import type { CstNode } from "../cst/CstNode.ts";
import { CstTree } from "../cst/CstTree.ts";
import { Span } from "../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../token/Spanned.ts";
import type { Token } from "../token/Token.ts";
import type { TokenKind } from "../token/TokenKind.ts";

export const StubSpan = new Span(0, 0);

export class StubCstTree extends CstTree {
  constructor(
    override node: CstNode,
  ) {
    super();
  }

  override get isAttached(): boolean {
    return true;
  }
  override get children(): readonly CstTree[] {
    return [];
  }
  override get tokens(): readonly Token<TokenKind>[] {
    return [];
  }
  override get allSpans(): readonly Spanned[] {
    return [];
  }
  override get [GetSpanSymbol](): Span {
    return StubSpan;
  }
}
