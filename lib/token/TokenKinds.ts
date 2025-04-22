import { TokenKind } from "./TokenKind.ts";

export type TokenKinds<Kind extends TokenKind = TokenKind> = abstract new (...args: any) => Kind;

export function tokenKindInstance<Kind extends TokenKind>(
  kind: Kind | TokenKinds<Kind>,
): TokenKinds<Kind> {
  if (kind instanceof TokenKind) {
    return kind.constructor as TokenKinds<Kind>;
  } else {
    return kind;
  }
}

export function isTokenKindMatch<Kind extends TokenKind>(
  kind: TokenKind,
  match: Kind | TokenKinds<Kind>,
): kind is Kind {
  if (match instanceof TokenKind) {
    if (kind.equals(match)) {
      return true;
    }
    return false;
  } else {
    if (kind instanceof match) {
      return true;
    }
    return false;
  }
}
