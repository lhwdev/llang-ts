import type { Token } from "../../token/Token.ts";
import type { TokenKinds } from "../../token/TokenKinds.ts";
import { Tokens } from "../../token/Tokens.ts";
import { CstCodeScope } from "./CstCodeScope.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { parseLineBreakToken } from "./lineBreak.ts";

export class CommentScope extends CstCodeScope {
  depth = 1;
  private nextCache: Token | null = null;

  constructor(
    readonly kind: Tokens.Comments.Kind,
    code: CstTokenizerContext,
  ) {
    super(code);
  }

  private matchSpecial(code: CstTokenizerContext): Token | null {
    let token;
    if (token = code.ifMatch(Tokens.Comments.Block.Begin)) {
      this.depth++;
      return token;
    }
    if (this.kind.end) {
      if (this.depth == 1) {
        if (token = code.ifMatch(this.kind.end)) {
          this.depth--;
          return token;
        }
      } else {
        if (token = code.ifMatch(Tokens.Comments.Block.End)) {
          this.depth--;
          return token;
        }
      }
    }
    if (token = parseLineBreakToken(code)) {
      return token;
    }

    if (this.kind.type === "docBlock") {
      // TODO
    }

    return null;
  }

  override match(code: CstTokenizerContext, _kind: TokenKinds): Token {
    let token;
    if (token = this.nextCache) {
      this.nextCache = null;
      return code.consume(token);
    }
    if (token = this.matchSpecial(code)) {
      this.depth++;
      return token;
    }

    let offset = 0;
    while (offset < code.remaining) {
      if (token = this.matchSpecial(code.peek(offset))) {
        this.nextCache = token;
        return code.create(this.kind.text, offset);
      }

      offset++;
    }
    return code.create(this.kind.text, offset);
  }

  override peek(): this {
    const scope = new CommentScope(this.kind, this.code.peek());
    scope.depth = this.depth;
    return scope as this;
  }
}
