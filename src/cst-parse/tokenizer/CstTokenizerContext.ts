import type { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import { fmt } from "../../utils/format.ts";

export abstract class CstTokenizerContext {
  abstract readonly offset: number;
  abstract readonly current: string;
  abstract readonly remaining: number;
  abstract get(n: number): string;

  abstract span(length: number): string;

  matches(kind: TokenKind, offset: number = 0): boolean {
    const code = kind.code;
    for (let i = 0; i < code.length; i++) {
      if (code[i] != this.get(offset + i)) return false;
    }
    return true;
  }

  abstract ifMatch<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;

  match<Kind extends TokenKind>(kind: Kind): Token<Kind> {
    const token = this.ifMatch(kind);
    if (!token) {
      throw new Error(
        fmt`nothing matched ${this.span(kind.code.length)}; expected ${kind}`,
      );
    }
    return token;
  }

  create<Kind extends TokenKind>(length: number, fn: (span: string) => Kind): Token<Kind>;
  create<Kind extends TokenKind>(
    constructor: new (span: string) => Kind,
    length: number,
  ): Token<Kind>;

  create(a: any, b: any): Token {
    if (typeof a === "number") {
      return this._create(b, a);
    } else {
      return this._create((span) => new a(span), b);
    }
  }

  protected _create<Kind extends TokenKind>(
    fn: (span: string) => Kind,
    length: number,
  ): Token<Kind> {
    return this.match(fn(this.span(length)));
  }

  consume<Kind extends TokenKind>(token: Token<Kind>): Token<Kind> {
    return this.match(token.kind);
  }

  abstract snapshot(): unknown;

  abstract restore(to: unknown): void;

  abstract peek(offset?: number): CstTokenizerContext;

  abstract subscribe(
    onToken: (tokenizer: CstTokenizerContext, token: Token) => void,
  ): CstTokenizerContext;
}
