import type { Span } from "./Span.ts";

export const GetSpanSymbol = Symbol("Spanned");

export interface Spanned {
  [GetSpanSymbol]: Span;
}
