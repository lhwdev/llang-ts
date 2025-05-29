import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstTree } from "../../cst/CstTree.ts";
import type { Span } from "../../token/Span.ts";
import type { Spanned } from "../../token/Spanned.ts";
import { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import type { CstNodeType } from "../intermediate/CstNodeType.ts";
import type { CstGroupMetadata } from "./CstGroupMetadata.ts";

export class CstGroup<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> extends CstTree<Node> {
  constructor(
    readonly meta: CstGroupMetadata<Node, Info>,
    override readonly node: Node,
    private readonly _source: CstGroup<Node, Info> | null,
    override readonly items: readonly CstGroupItem[],
  ) {
    super();
  }

  override shadowedGroups?: CstTree<CstNode>[] | undefined;

  override get type(): CstNodeType<Info> {
    return this.meta.type;
  }

  override get info(): Info {
    return this.meta.info;
  }

  override get span(): Span {
    return this.meta.span;
  }

  override get source(): CstGroup<Node, CstNodeInfo<Node>> {
    return this._source ?? this;
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
}

export type CstGroupItem = CstGroup<CstNode> | Token;
