import type { Token } from "../../token/Token.ts";
import { TokenKind, type Tokens } from "../../token/TokenKind.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export abstract class CstCodeScope {
  constructor(readonly code: CstTokenizerContext) {}

  abstract nextAny(): Token[];
  next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  next<Kind extends TokenKind>(kind: abstract new (...args: any) => Kind): Token<Kind> | null;

  next(kind: any): Token | null {
    const all = this.nextAny();
    if (kind instanceof TokenKind) {
      let result = null;
      for (const token of all) {
        if (token.kind.equals(kind)) {
          if (result) {
            throw new Error(`multiple tokens matched for kind=${kind}: ${result}, ${token}`);
          }
          result = token;
        }
      }
      return result;
    } else {
      let result = null;
      for (const token of all) {
        if (token.kind instanceof kind) {
          if (result) {
            throw new Error(
              `multiple tokens matched for kind instanceof ${kind}: ${result}, ${token}`,
            );
          }
          result = token;
        }
      }
      return result;
    }
  }

  abstract peek(): this;
}

export interface CstCodeScopes {
  normal(): CstCodeScope;
  comment(kind: Tokens.Comments.Kind): CstCodeScope & { readonly depth: number };
}
