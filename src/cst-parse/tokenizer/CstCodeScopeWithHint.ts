import type { Token } from "../../token/Token.ts";
import { TokenKind } from "../../token/TokenKind.ts";
import { tokenKindInstance, type TokenKinds } from "../../token/TokenKinds.ts";
import { CstCodeScope } from "./CstCodeScope.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export abstract class CstCodeScopeWithHint extends CstCodeScope {
  protected abstract match(code: CstTokenizerContext, hint: TokenKinds): Token;

  override nextAny(): Token {
    return this.match(this.code, TokenKind);
  }

  override next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  override next<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  override next(kind: any): Token | null {
    const token = this.match(this.code, tokenKindInstance(kind));
    if (kind instanceof TokenKind) {
      if (token.kind.equals(kind)) {
        return token;
      }
      return null;
    } else {
      if (token.kind instanceof kind) {
        return token;
      }
      return null;
    }
  }
}
