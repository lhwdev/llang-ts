import type { Span } from "../token/Span.ts";
import type { GetSpanSymbol, Spanned } from "../token/Spanned.ts";
import type { Token } from "../token/Token.ts";
import type { CstNode } from "./CstNode.ts";

export abstract class CstTree implements Spanned {
  abstract node: CstNode;

  abstract readonly children: readonly CstTree[];

  abstract readonly tokens: readonly Token[];

  abstract readonly allSpans: readonly Spanned[];

  abstract [GetSpanSymbol]: Span;
}
