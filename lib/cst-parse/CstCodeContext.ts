import type { Token } from "../token/Token.ts";
import type { TokenKind } from "../token/TokenKind.ts";
import { Tokens } from "../../src/token/Tokens.ts";
import type { TokenKinds } from "../token/TokenKinds.ts";

export abstract class CstCodeContext {
  abstract next(): Token;
  abstract next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  abstract next<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  abstract peek(): Token;
  abstract peek<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  abstract peek<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  abstract expect<Kind extends TokenKind>(kind: Kind): Token<Kind>;
  abstract expect<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind>;

  abstract consume<Kind extends TokenKind>(token: Token<Kind>): Token<Kind>;

  end(): boolean {
    return this.peek(Tokens.End) !== null;
  }

  abstract snapshot(): unknown;
  abstract restore(to: unknown): void;

  abstract close(): void;
}
