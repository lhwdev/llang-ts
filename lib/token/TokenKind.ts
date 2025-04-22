import { bold, gray } from "../utils/ansi.ts";
import { tokenKindName, tokenKindNames } from "../utils/debug.ts";
import { format, formatClass } from "../utils/format.ts";

export abstract class TokenKind {
  constructor(readonly code: string) {}

  equals(other: TokenKind): boolean {
    return Object.getPrototypeOf(this) === Object.getPrototypeOf(other) &&
      this.code === other.code;
  }

  @format.className
  formatName(): string {
    return tokenKindNames(this)
      .map((name, index, array) => index === array.length - 1 ? bold(name) : name)
      .join(gray("."));
  }

  @format.representation
  format(): string {
    return formatClass(this);
  }

  toString() {
    return `${tokenKindName(this)}(code='${this.code}')`;
  }
}
