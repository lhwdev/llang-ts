import { Span } from "../token/Span.ts";
import type { SpanGroup, Spanned } from "../token/Spanned.ts";
import { GetSpanSymbol, SpanGroupSymbol } from "../token/Spanned.ts";

export interface CstReadonlyArray<T extends Spanned> extends ReadonlyArray<T>, SpanGroup {}

export class CstArray<T extends Spanned> extends Array<T>
  implements CstReadonlyArray<T>, SpanGroup {
  get [GetSpanSymbol]() {
    if (this.length > 0) {
      return new Span(this[0][GetSpanSymbol].start, this.at(-1)![GetSpanSymbol].end);
    } else {
      return Span.Empty;
    }
  }

  get [SpanGroupSymbol]() {
    return this;
  }
}

export type CstTuple<T extends any[]> = CstArray<T[number]> & T;

export type CstReadonlyTuple<T extends any[]> = CstReadonlyArray<T[number]> & T;

export const CstTuple: new <const T extends any[]>(...elements: T) => CstTuple<T> = CstArray;
