import type { Token } from "../token/Token.ts";

export abstract class CstDelimitedScope {
  abstract isEof(token: Token): boolean;
}
