import type { Token } from "../../token/Token.ts";
import { TokenKind } from "../../token/TokenKind.ts";
import { isTokenKindMatch, type TokenKinds } from "../../token/TokenKinds.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export abstract class CstCodeScope {
  constructor(readonly code: CstTokenizerContext) {}

  protected abstract match(code: CstTokenizerContext, hint: TokenKinds): Token;

  nextAny(): Token {
    return this.match(this.code, TokenKind);
  }

  next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  next<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  next(kind: any): Token | null {
    const token = this.peek().nextAny();
    return isTokenKindMatch(token.kind, kind) ? this.consume(token) : null;
  }

  consume<Kind extends TokenKind>(token: Token<Kind>): Token<Kind> {
    return this.code.consume(token);
  }

  abstract peek(): this;
}
