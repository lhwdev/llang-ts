import type { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import { Tokens } from "../../token/Tokens.ts";
import { isTokenKindMatch, type TokenKinds } from "../../token/TokenKinds.ts";
import { CstCodeContext } from "../../cst-code/CstCodeContext.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import type { CstCodeScope } from "../tokenizer/CstCodeScope.ts";

export class CstCodeContextImpl extends CstCodeContext {
  constructor(
    readonly tokenizer: CstTokenizerContext,
  ) {
    super();
  }

  scope!: CstCodeScope;

  private peekBuffer: [CstCodeScope, Token] | null = null;

  get debugNext(): string {
    return this.tokenizer.span(10);
  }

  protected nextToken<Kind extends TokenKind>(
    scope: CstCodeScope,
    kind?: Kind | TokenKinds<Kind>,
  ): Token<Kind> | null {
    if (scope.code.remaining == 0) {
      const token = scope.code.match(Tokens.End);
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
    if (this.peekBuffer) {
      const [scope, token] = this.peekBuffer;
      this.peekBuffer = null;
      if (scope === this.scope) {
        return this.scope.consume(token);
      }
    }
    return this.nextToken(this.scope, kind);
  }

  override peek(): Token;
  override peek<Kind extends TokenKind>(kind: Kind): Token<Kind> | null;
  override peek<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind> | null;

  override peek(kind?: any): Token | null {
    if (this.peekBuffer) {
      const [scope, token] = this.peekBuffer;
      if (scope === this.scope) {
        if (!kind || isTokenKindMatch(token.kind, kind)) return token;
        return null;
      } else {
        this.peekBuffer = null;
      }
    }
    const peekScope = this.scope.peek();
    if (peekScope.code === this.scope.code) {
      throw new Error("CstCodeScope.peek() should use code.peek() as its new code.");
    }
    const token = this.nextToken(peekScope, kind);
    if (token) this.peekBuffer = [this.scope, token];
    return token;
  }

  override expect<Kind extends TokenKind>(kind: Kind): Token<Kind>;
  override expect<Kind extends TokenKind>(kind: TokenKinds<Kind>): Token<Kind>;

  override expect(kind: any): Token {
    const result = this.next(kind);
    if (!result) throw new Error(`expected ${kind}, but got ${result}`);
    return result;
  }

  override consume<Kind extends TokenKind>(token: Token<Kind>): Token<Kind> {
    if (this.peekBuffer) {
      const [scope, peekToken] = this.peekBuffer;
      if (scope === this.scope) {
        if (peekToken !== token) {
          throw new Error(`invalid consume: expected ${peekToken}, but got ${token}`);
        }
      }
      this.peekBuffer = null;
    } else {
      // this is nonsense, but maybe it can happen..????
    }
    return this.scope.consume(token);
  }

  override snapshot(): unknown {
    return { tokenizer: this.tokenizer.snapshot() };
  }

  override restore(to: unknown): void {
    const state = to as { tokenizer: unknown };
    this.tokenizer.restore(state.tokenizer);
    this.peekBuffer = null;
  }
}
