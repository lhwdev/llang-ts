import type { Span } from "./Span.ts";

export const GetSpanSymbol = Symbol("Spanned");

export const SpanGroupSymbol = Symbol("SpanGroup");

export interface Spanned {
  [GetSpanSymbol]: Span;
}

export interface SpanGroup extends Spanned {
  [SpanGroupSymbol]: Spanned[];
}
