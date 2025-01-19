import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstImplicitNode } from "../../cst/CstSpecialNode.ts";
import { Span } from "../../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../../token/Spanned.ts";
import type { Token } from "../../token/Token.ts";
import { isInherited } from "../../utils/extends.ts";
import { fmt } from "../../utils/format.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type { ContextValue } from "../CstParseContext.ts";
import type { ContextKey } from "../CstParseContext.ts";
import { ContextKeys } from "../CstParseContext.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import { type CstCodeContextImpl, subscribeToken } from "./CstCodeContextImpl.ts";
import { CstGroup, type CstGroupItem } from "./CstGroup.ts";

export abstract class CstIntermediateGroup {
  readonly spanStart: number;
  spanEnd: number;

  items: CstGroupItem[] = [];
  declare allowImplicit?: boolean;
  declare isImplicit?: boolean;

  declare contextValues?: ContextValue<any>[];
  contextualNode: CstIntermediateGroup;

  declare group?: CstGroup;

  declare debugInitialized?: boolean;

  constructor(
    readonly parent: CstIntermediateGroup,
    readonly info: CstNodeInfo<any>,
  ) {
    this.spanStart = parent.spanEnd;
    this.spanEnd = this.spanStart;

    this.contextualNode = parent.contextualNode;

    if (parent.isImplicit) this.isImplicit = true;
  }

  /// Internal-most tree management functions

  addItem(item: CstGroupItem) {
    this.updateSpan(item);
    this.items.push(item);
  }

  updateSpan(item: Spanned) {
    const span = item[GetSpanSymbol];
    if (span.start !== this.spanEnd) {
      throw new Error(
        "span not continuous: " +
          fmt`inserting ${item} into group(span=${new Span(this.spanStart, this.spanEnd)})`,
      );
    }
    this.spanEnd = span.end;
    this.ensureInitialized();
  }

  resolveContextOrNull<T>(key: ContextKey<T>): ContextValue<T> | null {
    if (this.contextValues) {
      for (const provided of this.contextValues) {
        if (provided.key === key) return provided;
      }
      return this.parent.contextualNode.resolveContextOrNull(key);
    } else {
      return this.contextualNode.resolveContextOrNull(key);
    }
  }

  resolveContext<T>(key: ContextKey<T>): ContextValue<T> {
    const result = this.resolveContextOrNull(key);
    if (!result) {
      throw new Error(fmt`Cannot resolve context value for ${key}`);
    }
    return result;
  }

  provideContext(value: ContextValue<any>): void {
    if (this.debugInitialized) {
      throw new Error("context should be provided before calling code() or cstNode()");
    }

    if (this.contextValues == null) {
      this.contextualNode = this;
      this.contextValues = [];
    }

    // Not ideal performance for large contextValues array;
    // but sufficient for now
    this.contextValues.unshift(value);

    if (value.key === ContextKeys.IsImplicit) {
      this.isImplicit = value.value;
    }
  }

  /// Code parsing

  get codeScopes(): CstCodeScopes {
    return this.resolveContext(ContextKeys.CodeScopes).value;
  }

  code<R>(context: CstCodeContextImpl, scope: CstCodeScope, fn: (code: CstCodeContext) => R): R {
    let token: Token | null = null;
    const reportToken = (nextToken: Token) => {
      if (token) {
        throw new Error(
          "parse maximum of one token inside one code() invocation. " +
            "To parse multiple token, call code() multiple times.",
        );
      }
      token = nextToken;
    };

    context.scope = scope;
    try {
      const result = subscribeToken(reportToken, () => fn(context));
      if (token) {
        this.addItem(token);
      }

      return result;
    } finally {
      context.scope = null;
      this.ensureInitialized();
    }
  }

  /// Children management

  get isAttached(): boolean {
    return true;
  }

  beginChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    // beginChild -> to consider: special nodes, implicit, debug
    // end -> to consider: special nodes, update implicit state, update span,
    // (parent.add is handled by CstParseContext)
    const special = this.beginSpecialNode(info);
    if (special) return special;

    this.handleImplicit();

    const child = this.createChild(info);
    // this.intermediateChildren.push(child);
    this.ensureInitialized();
    return child;
  }

  beginSpecialNode(info: CstNodeInfo<any>): CstIntermediateGroup | null {
    // STUB; If implemented directly here, will cause circular import issue.
    throw new Error(
      `implemented by index.ts (suppressing 'parameters are unused' warning: ${info})`,
    );
  }

  handleImplicit(): void {
    if (this.isImplicit) return;
    if (this.allowImplicit) {
      this.allowImplicit = false;

      const cstImplicit = this.resolveContextOrNull(ContextKeys.ImplicitNode)?.value;
      if (!cstImplicit) return;
      if (!isInherited(cstImplicit.info, CstImplicitNode)) {
        throw new Error(
          "All nodes registered as ContextKeys.ImplicitNode should extend CstImplicitNode; " +
            `${cstImplicit.info.name} does not.`,
        );
      }

      cstImplicit();
    }
  }

  abstract createChild(info: CstNodeInfo<any>): CstIntermediateGroup;

  beforeEnd<Node extends CstNode>(node: Node): CstGroup<Node> {
    if (this.group) {
      throw new Error(
        "Creating multiple CstNode inside one node() call is not allowed. " +
          "For example, `new CstSimpleCall(new CstReference('hi'), [], [])` is not allowed. " +
          "To do this, use separate node() call, like `new CstSimpleCall(node(() => new CstReference('hi')), [], [])`.",
      );
    }

    const group = this.createGroup(node);
    this.group = group;
    return group;
  }

  end<Node extends CstNode>(node: Node): Node {
    let group = this.group as CstGroup<Node> | undefined;
    if (group) {
      if (group.node !== node) {
        throw new Error("you should return CstNode that is newly created inside parser.");
      }
    } else {
      // Shadowing node: such as `node(() => node(() => new CstNode))`
      group = this.createGroup(node);
      this.group = group;

      // In this case, this parser returns node from child parser as-is.
      // We need special handling for this case.
      const childGroup = node.tree;
      if (!(childGroup instanceof CstGroup)) {
        throw new Error("cannot shadow node created by unknown parser");
      }
      const attachedChildren = group.children.filter((child) => child.isAttached);
      if (
        attachedChildren.length > 1 ||
        group.tokens.length > 0 ||
        attachedChildren.at(0) !== childGroup
      ) {
        console.error("attachedChildren =", attachedChildren);
        console.error("childGroup =", childGroup);
        throw new Error(
          "to return node as-is from parser, you should call maximum of only one group.",
        );
      }
      node.tree = group;
      // group.allSpans = childGroup.allSpans;
      if (group instanceof CstGroup) {
        group.shadowedGroups = [
          childGroup,
          ...childGroup.shadowedGroups ?? [],
        ];
      }
    }
    return group.node;
  }

  abstract createGroup<Node extends CstNode>(node: Node): CstGroup<Node>;

  /// Other utilities

  protected ensureInitialized() {
    this.debugInitialized = true;
  }
}
