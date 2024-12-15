import { GetSpanSymbol, type Spanned } from "./Spanned.ts";

export class Span implements Spanned {
  constructor(
    readonly start: number,
    readonly end: number,
  ) {}

  get length(): number {
    return this.end - this.start;
  }

  get [GetSpanSymbol](): Span {
    return this;
  }
}
