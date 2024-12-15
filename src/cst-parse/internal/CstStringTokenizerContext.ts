import { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import { tokenKindName } from "../../utils/debug.ts";
import { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import { cyan, green } from "jsr:@std/fmt/colors";

export class CstStringTokenizerContext extends CstTokenizerContext {
  constructor(
    readonly code: string,
    override offset: number = 0,
    readonly isPeek = false,
  ) {
    super();
  }

  override get current(): string {
    return this.code[this.offset];
  }

  override get remaining(): number {
    return this.code.length - this.offset;
  }

  override get(n: number): string {
    const pos = this.offset + n;
    return pos >= this.code.length ? "\0" : this.code[pos];
  }

  override span(length: number): string {
    const start = this.offset;
    return this.code.slice(start, start + length);
  }

  private addToken(kind: TokenKind, start: number, length: number) {
    // if (!this.isPeek) {
    //   console.log(
    //     `addToken kind=${cyan(tokenKindName(kind))}, start=${green(`${start}`)}, ` +
    //       `code='${cyan(kind.code)}'`,
    //   );
    // }

    this.offset += length;
    return new Token(kind, { start });
  }

  override ifMatch(kind: TokenKind): Token | null {
    const start = this.offset;
    const length = kind.code.length;
    const span = this.code.slice(start, start + length);
    if (span !== kind.code) return null;

    return this.addToken(kind, start, length);
  }

  protected override _create(fn: (span: string) => TokenKind, length: number): Token {
    const start = this.offset;
    const kind = fn(this.code.slice(start, start + length));

    return this.addToken(kind, start, length);
  }

  override peek(offset: number = 0): CstTokenizerContext {
    return new CstStringTokenizerContext(this.code, this.offset + offset, true);
  }

  override toString() {
    return `CstStringTokenizerContext(offset=${this.offset}, code='${this.code}')`;
  }
}
