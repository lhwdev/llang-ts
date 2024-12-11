import { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";

export class CstStringTokenizerContext extends CstTokenizerContext {
  constructor(
    readonly code: string,
    override offset: number = 0,
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

  override ifMatch(kind: TokenKind): Token | null {
    const start = this.offset;
    const length = kind.code.length;
    const span = this.code.slice(start, start + length);
    if (span !== kind.code) return null;

    this.offset += length;
    return new Token(kind, { start });
  }

  protected override _create(fn: (span: string) => TokenKind, length: number): Token {
    const start = this.offset;
    const kind = fn(this.code.slice(start, start + length));
    this.offset += length;
    return new Token(kind, { start });
  }

  override peek(offset: number = 0): CstTokenizerContext {
    return new CstStringTokenizerContext(this.code, this.offset + offset);
  }
}
