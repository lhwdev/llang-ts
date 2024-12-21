import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstRootNode } from "../../cst/CstRootNode.ts";
import { CstTree } from "../../cst/CstTree.ts";
import { Span } from "../../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../../token/Spanned.ts";
import type { Token } from "../../token/Token.ts";
import { fmt } from "../../utils/format.ts";
import type { CstNodeHintType } from "../CstParseContext.ts";
import type { CstCodeScope } from "../tokenizer/CstCodeScope.ts";

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

  children: CstGroup[] = [];
  tokens: Token[] = [];
  allSpans: Spanned[] = [];

  // Needed only while building
  type?: CstNodeHintType;
  disableImplicit?: true;
  allowImplicit?: boolean;
  codeScope?: CstCodeScope;

  node: CstNode | null = null;
  error: unknown | null = null;

  group?: CstGroup;

  /// Tokenizing code

  private codeSession?: { start: number };

  protected extendSpan(span: Span, debugHint?: any) {
    if (this.spanEnd !== span.start) {
      throw new Error(
        fmt`span not continuous: previous=${this.spanStart} to ${this.spanEnd}, current=${
          debugHint ?? span
        }`,
      );
    }
    this.spanEnd = span.end;
  }

  startCode(): CstCodeScope | null {
    if (this.codeSession) {
      throw new Error("calling code() inside code()");
    }
    this.codeSession = { start: this.tokens.length };
    return this.codeScope ?? null;
  }

  reportToken(token: Token) {
    if (!this.codeSession) {
      throw new Error("internal error: CstTokenizerContext used outside code()");
    }
    if (this.tokens.at(-1)?.span.end ?? 0 !== token.span.start) {
      throw new Error(
        fmt`token.span not continuous: previous token=${this.tokens.at(-1)}, current=${token}`,
      );
    }
    this.tokens.push(token);
    this.allSpans.push(token);
  }

  endCode() {
    const session = this.codeSession;
    if (!session) {
      throw new Error("internal error: endCode() called before calling startCode()");
    }

    const end = this.tokens.length;
    if (end - session.start > 1) {
      throw new Error(
        "parse maximum of one token inside one code() invocation.\n" +
          "To parse multiple token, call code() multiple times.",
      );
    }
    this.codeSession = undefined;
    const lastToken = this.tokens.at(-1);
    if (lastToken) this.extendSpan(lastToken.span, lastToken);
  }

  /// Adding children

  addChild(child: CstGroup) {
    this.children.push(child);
    this.extendSpan(child.span, child);

    if (child.span.length > 0) {
      this.allowImplicit = true;
    }
  }

  /// Building node

  beforeEnd(node: CstNode): CstGroup {
    if (this.group) throw new Error("building group twice");
    const group = new CstGroup(this, node);
    this.group = group;
    return group;
  }

  ensureEnd(node: CstNode): CstGroup {
    const group = this.group;
    if (!group) {
      throw new Error(
        "beforeEnd() not called; you should create one new CstNode instance inside parser.",
      );
    }
    if (this.node !== node) {
      throw new Error("you should return CstNode that is newly created inside parser.");
    }
    this.allSpans.push(...group.allSpans);
    return group;
  }

  endWithError(error: unknown) {
    this.error = error;
    return null;
  }
}

export class CstRootGroup extends CstIntermediateGroup {
  constructor() {
    super({} as CstIntermediateGroup, CstRootNode, 0);
    this.parent = this;
  }

  protected illegalOnRoot(): never {
    throw new Error("trying to insert child into root group");
  }

  override beforeEnd(_node: CstNode): CstGroup {
    this.illegalOnRoot();
  }

  override ensureEnd(_node: CstNode): CstGroup {
    this.illegalOnRoot();
  }
}

export class CstGroup extends CstTree {
  constructor(
    intermediate: CstIntermediateGroup,
    override readonly node: CstNode,
  ) {
    super();
    this.span = new Span(intermediate.spanStart, intermediate.spanEnd);
    this.children = intermediate.children;
    this.tokens = intermediate.tokens;
    this.allSpans = intermediate.allSpans;
  }

  span: Span;
  override children: readonly CstGroup[];
  override tokens: readonly Token[];

  override allSpans: readonly Spanned[];

  override get [GetSpanSymbol](): Span {
    return this.span;
  }
}
