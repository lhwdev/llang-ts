import { cyan, green } from "@std/fmt/colors";
import { Span } from "../../token/Span.ts";
import { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import { tokenKindName } from "../../utils/debug.ts";
import { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";

export class CstStringTokenizerContext extends CstTokenizerContext {
  constructor(
    readonly code: string,
    override offset: number = 0,
    readonly isPeek = false,
    readonly onToken: ((context: CstTokenizerContext, token: Token) => void)[] = [],
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

  private addToken<Kind extends TokenKind>(kind: Kind, start: number, length: number) {
    if (!this.isPeek) {
      console.log(
        `addToken kind=${cyan(tokenKindName(kind))}, start=${green(`${start}`)}, ` +
          `code='${cyan(kind.code)}'`,
      );
    }

    const token = new Token(kind, new Span(start, start + length));

    this.onToken.forEach((callback) => callback(this, token));
    this.offset += length;

    return token;
  }

  override ifMatch<Kind extends TokenKind>(kind: Kind): Token<Kind> | null {
    const start = this.offset;
    const length = kind.code.length;
    const span = this.code.slice(start, start + length);
    if (span !== kind.code) return null;

    return this.addToken(kind, start, length);
  }

  protected override _create<Kind extends TokenKind>(
    fn: (span: string) => Kind,
    length: number,
  ): Token<Kind> {
    const start = this.offset;
    const kind = fn(this.code.slice(start, start + length));

    return this.addToken(kind, start, length);
  }

  override peek(offset: number = 0): CstTokenizerContext {
    // onToken is [], so any works done on .peek() is not reported
    return new CstStringTokenizerContext(this.code, this.offset + offset, true, []);
  }

  override subscribe(onToken: (tokenizer: CstTokenizerContext, token: Token) => void) {
    return new CstStringTokenizerContext(
      this.code,
      this.offset,
      this.isPeek,
      [...this.onToken, onToken],
    );
  }

  override toString() {
    return `CstStringTokenizerContext(offset=${this.offset}, code='${this.code}')`;
  }
}
