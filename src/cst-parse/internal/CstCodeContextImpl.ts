import type { Token } from "../../token/Token.ts";
import { type TokenKind, Tokens } from "../../token/TokenKind.ts";
import { isTokenKindMatch, type TokenKinds } from "../../token/TokenKinds.ts";
import { CstCodeContext } from "../CstCodeContext.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import type { CstCodeScope } from "../tokenizer/CstCodeScope.ts";

export class CstCodeContextImpl extends CstCodeContext {
  constructor(
    readonly code: CstTokenizerContext,
  ) {
    super();
  }

  scope!: CstCodeScope;

  protected nextToken<Kind extends TokenKind>(
    scope: CstCodeScope,
    kind?: Kind | TokenKinds<Kind>,
  ): Token<Kind> | null {
    if (scope.code.remaining == 0) {
      const token = scope.code.match(Tokens.Eof);
      if (!kind) return token as any;
      return isTokenKindMatch(token.kind, kind) ? token : null as any;
    }
    if (!kind) {
      return scope.nextAny() as any;
    } else {
      return scope.next(kind as any);
    }
  }

  override next(): Token;
  override next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  override next<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  override next(kind?: any): any {
    return this.nextToken(this.scope, kind);
  }

  override peek(): Token;
  override peek<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  override peek<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  override peek(kind?: any): Token | null {
    return this.nextToken(this.scope.peek(), kind);
  }

  override expect<Kind extends TokenKind>(kind: Kind): Token<Kind>;
  override expect<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind>;

  override expect(kind: any): Token {
    const result = this.next(kind);
    if (!result) throw new Error(`expected ${kind}, but got ${result}`);
    return result;
  }
}
