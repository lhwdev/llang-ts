import type { Spanned } from "../token/Spanned.ts";
import type { Token } from "../token/Token.ts";

type Options = ErrorOptions & {
  source?: Spanned;
};

export class ParseError extends Error {
  readonly source?: Spanned;

  constructor(message?: string, { source, ...options }: Options = {}) {
    super(message, options);

    this.source = source;
  }
}

export function unexpectedTokenError(token: Token): never {
  throw new ParseError(`Unexpected token ${token}`, { source: token });
}
