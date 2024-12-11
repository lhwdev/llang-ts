import type { Token } from "../token/Token.ts";
import type { TokenKind } from "../token/TokenKind.ts";

export abstract class CstCodeContext {
  abstract nextAny(): Token[];
  abstract next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  abstract next<Kind extends TokenKind>(
    kind: abstract new (...args: any) => Kind,
  ): Token<Kind> | null;

  abstract peekAny(): Token[];
  abstract peek<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  abstract peek<Kind extends TokenKind>(
    kind: abstract new (...args: any) => Kind,
  ): Token<Kind> | null;

  abstract expect(): Token;
  abstract expect<Kind extends TokenKind>(kind: Kind): Token<Kind>;
  abstract expect<Kind extends TokenKind>(kind: abstract new (...args: any) => Kind): Token<Kind>;
}
