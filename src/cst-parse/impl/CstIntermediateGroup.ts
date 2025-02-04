import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstImplicitNode } from "../CstSpecialNode.ts";
import { Span } from "../../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../../token/Spanned.ts";
import type { Token } from "../../token/Token.ts";
import { dim, strikethrough } from "../../utils/colors.ts";
import { isInherited } from "../../utils/extends.ts";
import { fmt, formatClass, type FormatEntry } from "../../utils/format.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type { ContextValue, CstNodeHintType, CstParseContext } from "../CstParseContext.ts";
import type { ContextKey } from "../CstParseContext.ts";
import { ContextKeys, getContext } from "../CstParseContext.ts";
import { nullableNode } from "../inlineNode.ts";
import { debug } from "./debug.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import { type CstCodeContextImpl, subscribeToken } from "./CstCodeContextImpl.ts";
import { CstGroup, type CstGroupItem } from "./CstGroup.ts";
import type { CstParseContextImpl } from "./CstParseContextImpl.ts";
import { detailedParseError } from "./errors.ts";
import type { CstParseContextParent } from "./CstGroupParseContext.ts";

export const EmptySlot = Symbol("EmptySlot");

export abstract class CstIntermediateGroup {
  readonly spanStart: number;
  spanEnd: number;
  declare snapshot?: unknown; // tokenizer(offset = spanStart)

  declare flagNullable?: true;
  declare flagDiscardable?: true;

  readonly items: CstGroupItem[] = [];
  declare allowImplicit?: boolean;
  declare isImplicit?: boolean;

  declare contextValues?: ContextValue<any>[];
  contextualNode: CstIntermediateGroup;

  group?: CstGroup;
  declare error?: unknown | null;

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

  parentForPop() {
    return this.parent;
  }

  protected get c(): CstCodeContextImpl {
    return (getContext() as CstParseContextImpl<any>).c;
  }

  withSelf<R>(fn: () => R): R {
    // stub
    const context = getContext() as any;
    if (!("withCurrent" in context)) throw new Error("only compatible for CstParseContextImpl");
    return context.withCurrent(this, fn);
  }

  /// Debug

  // max laziness
  get debugDepth(): number {
    return this.parent === this ? 0 : this.parent.debugDepth + 1;
  }

  declare private debugLines?: FormatEntry[];

  debugLog(line: FormatEntry) {
    if (!this.debugLines) this.debugLines = [];
    this.debugLines.push(line);
    const indent = "  ".repeat(this.debugDepth);
    console.log(indent + line.toString().replace("\n", "\n" + indent));
  }

  /// Internal-most tree management functions

  protected addItem(item: CstGroupItem) {
    this.updateSpan(item);
    this.items.push(item);
  }

  protected updateSpan(item: Spanned) {
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

  protected resolveContextOnSelf<T>(key: ContextKey<T>): ContextValue<T> | null {
    if (this.contextValues) {
      for (const provided of this.contextValues) {
        if (provided.key === key) return provided;
      }
    }
    return null;
  }

  resolveContextOrNull<T>(key: ContextKey<T>): ContextValue<T> | null {
    if (this.contextValues) {
      return this.resolveContextOnSelf(key) ??
        this.parent.contextualNode.resolveContextOrNull(key);
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

  /// Metadata & Slot

  hintType(hint: CstNodeHintType) {
    switch (hint) {
      case "nullable": {
        this.flagNullable = true;
        this.ensureSnapshotExists();
        break;
      }
      case "discardable": {
        this.flagDiscardable = true;
        this.ensureSnapshotExists();
        break;
      }
      default:
        throw new Error(`unknown hint type ${hint}`);
    }
  }

  getSlot(): unknown {
    return EmptySlot;
  }

  updateSlot<T>(value: T): T {
    return value;
  }

  /// Code parsing

  get codeScopes(): CstCodeScopes {
    return this.resolveContext(ContextKeys.CodeScopes).value;
  }

  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R {
    const code = this.c;
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

    code.scope = scope;
    try {
      const result = subscribeToken(reportToken, () => fn(code));
      if (token) {
        this.addItem(token);
      }
      debug`${fmt.rgb8(136)`code`}(${fmt.symbol(scope.constructor.name)}, ${
        fmt.code(fn)
      }) -> ${token}`;

      return result;
    } finally {
      code.scope = null;
      this.ensureInitialized();
    }
  }

  ensureSnapshotExists() {
    if (!this.snapshot) {
      if (this.debugInitialized) {
        throw new Error("snapshot should be taken before calling code() or cstNode()");
      }
      this.snapshot = this.c.snapshot();
    }
  }

  restoreToPrevious() {
    if (!this.snapshot) {
      throw new Error("snapshot does not exist for group");
    }
    this.c.restore(this.snapshot);
  }

  /// Self management

  skipping<Node extends CstNode>(): Node | null {
    return null;
  }

  /**
   * Not guaranteed to be called for all new groups.
   */
  // deno-lint-ignore no-unused-vars
  createUniqueContext(parent: CstParseContextParent): CstParseContext | null {
    return null;
  }

  /// Children management

  beginChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    // beginChild -> to consider: special nodes, implicit, debug
    // end -> to consider: special nodes, update implicit state, update span,
    // (parent.add is handled by CstParseContext)
    this.ensureInitialized();

    let child: CstIntermediateGroup | null;

    const kind = this.isImplicit ? dim("Implicit Node") : "Node";
    debug`${
      fmt.lazy(() =>
        fmt`${
          fmt.cyan(() => child?.error !== undefined ? strikethrough(kind) : kind)
        } ${info} ➜  ` +
        (child?.error !== undefined
          ? child.error === null ? fmt.dim`null` : fmt`${fmt.red(`${child.error}`)}`
          : "")
      )
    }`;

    if (child = this.beginSpecialNode(info)) {
      return child;
    }

    this.handleImplicit();

    child = this.createSpecialChild(info) ?? this.createChild(info);
    // this.intermediateChildren.push(child);
    return child;
  }

  beginSpecialNode(info: CstNodeInfo<any>): CstIntermediateGroup | null {
    throw new Error(
      `implemented by index.ts to avoid circular imports, args=${info}`,
    );
  }

  createSpecialChild(info: CstNodeInfo<any>): CstIntermediateGroup | null {
    throw new Error(
      `implemented by index.ts to avoid circular imports, args=${info}`,
    );
  }

  protected handleImplicit(): void {
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

      nullableNode(CstImplicitNode, () => cstImplicit());
    }
  }

  protected abstract createChild(info: CstNodeInfo<any>): CstIntermediateGroup;

  protected childInstance<Ctor extends new (...args: any) => CstIntermediateGroup>(
    type: Ctor,
  ): Ctor {
    return this.contextualNode.childInstance(type);
  }

  beforeEnd<Node extends CstNode>(node: Node): CstGroup<Node> {
    if (this.group) {
      throw detailedParseError`
        Creating multiple CstNode inside one node() call is not allowed.
        For example, ${fmt.code`new CstSimpleCall(new CstReference('hi'), [], [])`} is not allowed.
        To do this, use separate node() call, like ${
        fmt.code(`new CstSimpleCall(node(() => new CstReference('hi')), [], [])`)
      }.
      `;
    }

    const group = this.createGroup(node);
    this.group = group;
    return group;
  }

  end<Node extends CstNode>(node: Node): Node {
    let group = this.group as CstGroup<Node> | undefined;
    if (group) {
      if (group.node !== node) {
        throw detailedParseError`
          you should return CstNode that is newly created inside parser.
          - ${fmt.brightYellow`previously created`}: ${group.node}
          - ${fmt.brightYellow`given`}: ${node}
        `;
      }
    } else {
      // Shadowing node: such as `node(() => node(() => new CstNode))`
      group = this.createGroup(node);
      this.group = group;

      // In this case, this parser returns node from child parser as-is.
      // We need special handling for this case.
      const childGroup = node.tree;
      // if (!(childGroup instanceof CstGroup)) {
      //   throw new Error("cannot shadow node created by unknown parser");
      // }
      const items = group.items;
      if (items.length > 1) {
        throw detailedParseError`
          to return node as-is from parser, you should call maximum of only one parser.
          - ${fmt.brightYellow`tree.items`}: ${items}
        `;
      }
      if (items.at(0) !== childGroup) {
        throw detailedParseError`
          to return node as-is from parser, you should call maximum of only one parser.
          - ${fmt.brightYellow`tree.items`}: ${items}
        `;
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

    debug`${fmt.dim`end ${this.info} ➜ `} ${
      fmt.lazy(() =>
        group.shadowedGroups && group.node === group.children.at(0)?.node
          ? fmt.italic`${fmt.rgb8(group.node.constructor.name, 19)}(${fmt.dim`same`})`
          : fmt`${node}`
      )
    }`;

    this.endSelf(group);
    return group.node;
  }

  insertChild<Node extends CstNode>(node: Node): Node {
    throw new Error(
      `implemented by index.ts to avoid circular imports, args=${node}`,
    );
  }

  protected endSelf(group: CstGroup) {
    this.parent.endChild(group, this);
  }

  endWithError(error: unknown | null): CstNode | null {
    this.error = error;
    if (this.snapshot) {
      this.restoreToPrevious();
    } else {
      if (this.flagNullable && this.spanEnd != this.spanStart) {
        if (this.flagDiscardable) throw new Error("<- never happens?");
        throw new Error(
          "nullableNode should call enableDiscard() to " +
            "consume any node then return null.",
        );
      }
    }
    this.endSelfWithError(error);

    if (error !== null) debug`${fmt.dim("endWithError")} ${fmt.red(`${error}`)}`;

    return null;
  }

  protected endSelfWithError(error: unknown | null) {
    this.parent.endChildWithError(error, this);
  }

  endChild(child: CstGroup, from: CstIntermediateGroup) {
    this.endChildCommon(from);
    this.addItem(child);
  }

  // deno-lint-ignore no-unused-vars
  endChildWithError(error: unknown | null, from: CstIntermediateGroup) {
    this.endChildCommon(from);
  }

  // deno-lint-ignore no-unused-vars
  endChildCommon(from: CstIntermediateGroup) {
    // do nothing
  }

  protected abstract createGroup<Node extends CstNode>(node: Node): CstGroup<Node>;

  /// Other utilities

  protected ensureInitialized() {
    this.debugInitialized = true;
  }

  toString() {
    return formatClass(this);
  }
}
