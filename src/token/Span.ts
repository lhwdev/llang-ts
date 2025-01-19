import { fmt } from "../utils/format.ts";
import { GetSpanSymbol, type Spanned } from "./Spanned.ts";

/**
 * Note that `Span(start = -1, end = -1)` may exist in detached tree for short
 * time, which stands for empty node.
 */
export class Span implements Spanned {
  constructor(
    readonly start: number,
    readonly end: number,
  ) {}

  get length(): number {
    return this.end - this.start;
  }

  get invalid(): boolean {
    return this.start === -1 && this.end === -1;
  }

  get [GetSpanSymbol](): Span {
    return this;
  }

  toString() {
    return fmt.classLike("Span", fmt.entry`${this.start}..<${this.end}`).toString();
  }
}
