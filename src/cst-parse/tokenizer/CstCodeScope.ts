import type { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import type { Tokens } from "../../token/Tokens.ts";
import { isTokenKindMatch, type TokenKinds } from "../../token/TokenKinds.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export abstract class CstCodeScope {
  constructor(readonly code: CstTokenizerContext) {}

  abstract nextAny(): Token;

  next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  next<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  next(kind: any): Token | null {
    const token = this.nextAny();
    return isTokenKindMatch(token.kind, kind) ? token : null;
  }

  consume<Kind extends TokenKind>(token: Token<Kind>): Token<Kind> {
    return this.code.consume(token);
  }

  abstract peek(): this;
}

export interface CstCodeScopes {
  normal(): CstCodeScope;
  comment(kind: Tokens.Comments.Kind): CstCodeScope & { readonly depth: number };
  stringLiteral(
    kind: Tokens.Literal.String.Kind,
  ): CstCodeScope & { variableTemplate(): CstCodeScope };
}
