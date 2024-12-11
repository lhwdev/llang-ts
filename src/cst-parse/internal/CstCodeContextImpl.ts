import type { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
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

  override nextAny(): Token[] {
    return this.scope.nextAny();
  }

  override next<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  override next<Kind extends TokenKind>(
    kind: abstract new (...args: any) => Kind,
  ): Token<Kind> | null;

  override next(kind: any): any {
    return this.scope.next(kind);
  }

  override peekAny(): Token[] {
    return this.scope.peek().nextAny();
  }
  override peek<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  override peek<Kind extends TokenKind>(
    kind: abstract new (...args: any) => Kind,
  ): Token<Kind> | null;

  override peek(kind: any): Token | null {
    return this.scope.peek().next(kind);
  }

  override expect(): Token;
  override expect<Kind extends TokenKind>(kind: Kind): Token<Kind>;
  override expect<Kind extends TokenKind>(kind: abstract new (...args: any) => Kind): Token<Kind>;

  override expect(kind?: any): Token {
    if (!kind) {
      const any = this.nextAny();
      if (any.length != 0) throw new Error(`expected single token candidate: got ${any}`);
      return any[0];
    }
    const result = this.next(kind);
    if (!result) throw new Error(`expected ${kind}, but got ${result}`);
    return result;
  }
}
