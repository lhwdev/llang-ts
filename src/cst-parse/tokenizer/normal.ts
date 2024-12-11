import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/TokenKind.ts";
import { CstCodeScope } from "./CstCodeScope.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export class NormalScope extends CstCodeScope {
  depth = 1;
  private nextCache: Token | null = null;

  constructor(code: CstTokenizerContext) {
    super(code);
  }

  // deno-lint-ignore no-unused-vars
  protected unmatchedDelimiter(code: CstTokenizerContext, kind: Tokens.Delimiter.Right): Token {
    throw new Error("!!!");
  }

  private matchSpecial(code: CstTokenizerContext): Token | null {
    let token;
    if (token = code.ifMatch(Tokens.Comments.Block.Begin)) {
      this.depth++;
      return token;
    }

    return null;
  }

  private match(code: CstTokenizerContext): Token {
    let token;
    if (token = this.nextCache) {
      this.nextCache = null;
      return token;
    }
    if (token = this.matchSpecial(code)) {
      this.depth++;
      return token;
    }
  }

  override nextAny(): [Token] {
    return [this.match(this.code)];
  }

  override peek(): this {
    const scope = new NormalScope(this.code.peek());
    scope.depth = this.depth;
    return scope as this;
  }
}
