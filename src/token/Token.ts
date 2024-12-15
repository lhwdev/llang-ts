import { tokenKindName } from "../utils/debug.ts";
import { valueToColorString } from "../utils/format.ts";
import { ToFormatString } from "../utils/format.ts";
import { TokenKind } from "./TokenKind.ts";
import * as colors from "@std/fmt/colors";

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

  toString() {
    return `Token(kind=${tokenKindName(this.kind)},` +
      `span=[${this.span.start}, ${this.span.start + this.kind.code.length}],` +
      ` code='${this.kind.code}')`;
  }

  [ToFormatString]() {
    return `${colors.brightBlue(tokenKindName(this.kind))}` +
      `[${colors.yellow(this.span.start.toString())}, ` +
      `${colors.yellow((this.span.start + this.kind.code.length).toString())}]` +
      ` ${valueToColorString(this.kind.code)}`;
  }
}

export interface Span {
  start: number;
}
