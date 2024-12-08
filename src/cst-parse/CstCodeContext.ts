import type { Token } from "../token/Token.ts";
import type { TokenKind, Tokens } from "../token/TokenKind.ts";

export interface CstCodeContext {
  next(): Token[];
  next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  next<Kind extends TokenKind>(kind: abstract new (...args: any) => Kind): Token<Kind> | null;

  peek(): Token[];
  peek<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  peek<Kind extends TokenKind>(kind: abstract new (...args: any) => Kind): Token<Kind> | null;

  expect(): Token;
  expect<Kind extends TokenKind>(kind: Kind): Token<Kind>;
  expect<Kind extends TokenKind>(kind: abstract new (...args: any) => Kind): Token<Kind>;
}

export class CstCodeScope {}

export namespace CstCodeScopes {
  export class Comment {
    constructor(readonly kind: Tokens.Comments.Kind) {}
  }
}
