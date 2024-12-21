import { tokenKindName } from "../utils/debug.ts";
import { format, valueToColorString } from "../utils/format.ts";
import type { Span } from "./Span.ts";
import { GetSpanSymbol, type Spanned } from "./Spanned.ts";
import { TokenKind } from "./TokenKind.ts";
import * as colors from "@std/fmt/colors";
import type { TokenKinds } from "./TokenKinds.ts";

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
export class Token<Kind extends TokenKind = TokenKind> implements Spanned {
  constructor(
    readonly kind: Kind,
    readonly span: Span,
  ) {}

  get code(): string {
    return this.kind.code;
  }

  is<T extends TokenKind>(type: T | TokenKinds<T>): this is Token<T> {
    if (type instanceof TokenKind) {
      return this.kind === type as any;
    }
    return this.kind instanceof type;
  }

  as<T extends TokenKind>(type: T | TokenKinds<T>): Token<T> {
    if (!this.is(type)) throw new TypeError(`this token ${this} is not type of ${type}`);
    return this;
  }

  get [GetSpanSymbol](): Span {
    return this.span;
  }

  toString() {
    return `Token(kind=${tokenKindName(this.kind)},` +
      `span=[${this.span.start}, ${this.span.start + this.kind.code.length}],` +
      ` code='${this.kind.code}')`;
  }

  @format.print
  format() {
    return `${colors.brightBlue(tokenKindName(this.kind))}` +
      `[${colors.yellow(this.span.start.toString())}, ` +
      `${colors.yellow((this.span.start + this.kind.code.length).toString())}]` +
      ` ${valueToColorString(this.kind.code)}`;
  }
}
