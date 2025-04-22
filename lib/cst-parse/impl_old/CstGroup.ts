import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstTree } from "../../cst/CstTree.ts";
import { Span } from "../../token/Span.ts";
import type { Spanned } from "../../token/Spanned.ts";
import { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import { formatClass } from "../../utils/format.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

export type CstGroupItem = CstGroup | Token;

export abstract class CstGroup<Node extends CstNode = CstNode> extends CstTree<Node> {
  override readonly info: CstNodeInfo<Node>;
  override readonly items: readonly CstGroupItem[];
  override readonly span: Span;

  declare shadowedGroups?: CstGroup<CstNode>[] | undefined;

  constructor(
    from: CstIntermediateGroup,
    override node: Node,
  ) {
    super();

    this.info = from.info;
    this.items = from.items;
    this.span = new Span(from.spanStart, from.spanEnd);
  }

  override get source(): CstTree<Node> {
    return this;
  }

  override get children(): readonly CstGroup<CstNode>[] {
    return this.items.filter((item) => item instanceof CstGroup);
  }

  override get tokens(): readonly Token<TokenKind>[] {
    return this.items.filter((item) => item instanceof Token);
  }

  override get allSpans(): readonly Spanned[] {
    return this.items;
  }

  override get isRead(): boolean {
    return true;
  }

  override get isAttached(): boolean {
    return true;
  }

  override toString() {
    return formatClass(this);
  }
}
