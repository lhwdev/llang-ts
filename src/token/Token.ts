import { TokenKind } from "./TokenKind.ts";

/**
 * Why need a `Token`, when {@link TokenKind} already contains code? The reason
 * is,
 *
 * 1. Token should be unique per location. So to say, Token itself can be unique
 *    identifier for class name, function name, etc.
 *
 * 2. Token should be able to contain information such as {@link span}, error,
 *    etc.
 */
export class Token<Kind extends TokenKind = TokenKind> {
  constructor(
    readonly kind: Kind,
    readonly span: Span,
  ) {}

  is<T extends TokenKind>(type: T | (abstract new (...args: any) => T)): this is Token<T> {
    if (type instanceof TokenKind) {
      return this.kind === type as any;
    }
    return this.kind instanceof type;
  }
}

export interface Span {
  start: number;
}
