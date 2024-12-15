import type { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";

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

  abstract ifMatch(kind: TokenKind): Token | null;

  match(kind: TokenKind): Token {
    const token = this.ifMatch(kind);
    if (!token) throw new Error(`nothing matched ${kind}`);
    return token;
  }

  create(length: number, fn: (span: string) => TokenKind): Token;
  create(constructor: new (span: string) => TokenKind, length: number): Token;

  create(a: any, b: any): Token {
    if (typeof a === "number") {
      return this._create(b, a);
    } else {
      return this._create((span) => new a(span), b);
    }
  }

  protected _create(fn: (span: string) => TokenKind, length: number): Token {
    return this.match(fn(this.span(length)));
  }

  consume(token: Token): Token {
    return this.match(token.kind);
  }

  abstract peek(offset?: number): CstTokenizerContext;

  abstract subscribe(
    onToken: (tokenizer: CstTokenizerContext, token: Token) => void,
  ): CstTokenizerContext;
}
