import { TokenKind } from "./TokenKind.ts";

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
