import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree, CstTreeItem } from "../../cst/CstTree.ts";
import { Span } from "../../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../../token/Spanned.ts";
import type { Token } from "../../token/Token.ts";
import { fmt } from "../../utils/format.ts";
import { detailedParseError } from "../impl/errors.ts";
import type { CstCodeScope } from "../tokenizer/CstCodeScope.ts";
import { CstGroup } from "../internal_old/CstGroup.ts";

export class CstIntermediateGroup {
  constructor(
    public parent: CstIntermediateGroup,
    public info: CstNodeInfo<any>,
    public spanStart: number,
  ) {
    this.spanEnd = spanStart;
    this.codeScope = parent.codeScope;
  }

  spanEnd: number;

  children: CstTree[] = [];
  tokens: Token[] = [];
  allItems: CstTreeItem[] = [];
  allSpans: Spanned[] = [];

  // Needed only while building
  declare disableImplicit?: true;
  declare isAttached?: boolean;
  declare allowImplicit?: boolean;
  declare codeScope?: CstCodeScope;
  declare snapshot?: unknown;

  error: unknown | undefined = undefined;

  group?: CstTree;

  /// Tokenizing code
  private codeSession?: { start: number; tokens: Token[] } | null;

  protected extendSpan(span: Span, debugHint?: any) {
    if (this.spanEnd !== span.start) {
      throw detailedParseError`
        Span not continuous; previous=${new Span(this.spanStart, this.spanEnd)}, current= \\
        ${debugHint ?? span}
      `;
    }
    this.spanEnd = span.end;
  }

  startCode() {
    if (this.codeSession) {
      throw new Error("calling code() inside code()");
    }
    this.codeSession = { start: this.tokens.length, tokens: [] };
    return this.codeSession;
  }

  reportToken(token: Token) {
    const session = this.codeSession;
    if (!session) {
      throw new Error("internal error: CstTokenizerContext used outside code()");
    }
    const previous = this.allItems.at(-1)?.[GetSpanSymbol];
    if ((previous?.end ?? this.spanStart) !== token.span.start) {
      throw new Error(
        fmt`token.span not continuous: previous=${previous}, current=${token}`.s,
      );
    }
    session.tokens.push(token);

    // debug`reportToken ${token} at start=${this.spanEnd}, group=${this.info}`;
  }

  endCode(session: typeof this.codeSession) {
    if (session !== this.codeSession) {
      throw new Error("internal error: session != this.codeSession");
    }
    if (!session) {
      throw new Error("internal error: endCode() called before calling startCode()");
    }

    if (session.tokens.length > 1) {
      throw new Error(
        "parse maximum of one token inside one code() invocation.\n" +
          "To parse multiple token, call code() multiple times.",
      );
    }
    this.codeSession = null;

    const token = session.tokens[0];
    if (token) {
      this.tokens.push(token);
      this.allItems.push(token);
      this.extendSpan(token.span, token);
    }
  }

  createChild(info: CstNodeInfo<any>, offset: number): CstIntermediateGroup {
    return new CstIntermediateGroup(this, info, offset);
  }

  onCreateForeignChild<Group extends CstIntermediateGroup>(group: Group): Group {
    return group;
  }

  /// Adding children
  addChild(child: CstTree) {
    this.children.push(child);
    this.allItems.push(child);
    if (child instanceof CstGroup && child.span.invalid && this.spanEnd !== -1) {
      child.realizeOffsetForEmpty(this.spanEnd);
    }
    this.extendSpan(child.span, child);

    if (child.span.length > 0) {
      this.allowImplicit = true;
    }
  }

  /// Building node
  protected createGroup(node: CstNode): CstTree {
    return new CstGroup(this, node);
  }

  beforeEnd(node: CstNode): CstTree {
    if (this.group) throw new Error("building group twice");
    const group = this.createGroup(node);
    this.group = group;
    return group;
  }

  end(node: CstNode): CstTree {
    let group = this.group;
    if (group) {
      if (group.node !== node) {
        throw new Error("you should return CstNode that is newly created inside parser.");
      }
    } else {
      group = this.createGroup(node);
      this.group = group;

      // In this case, this parser returns node from child parser as-is.
      // We need special handling for this case.
      const childGroup = node.tree;
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
          ...childGroup instanceof CstGroup ? childGroup.shadowedGroups ?? [] : [],
        ];
      }
    }
    return group;
  }

  endWithError(error: unknown) {
    this.error = error;
    return null;
  }

  insertChild(group: CstTree): void {
    this.addChild(group);
  }
}
