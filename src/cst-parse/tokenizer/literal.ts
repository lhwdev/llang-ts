import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/TokenKind.ts";
import { CstCodeScope } from "./CstCodeScope.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { parseLineBreakToken } from "./lineBreak.ts";
import { NormalScope } from "./normal.ts";

const digits = "0123456789_";
const specialDigitLimiters = "xb";

export function parseNumberLiteral(code: CstTokenizerContext): Token<Tokens.Literal.Number> | null {
  if (!"0123456789".includes(code.current)) return null;

  let offset = 1;
  let limiter;

  if (!specialDigitLimiters.includes(limiter = code.get(offset))) {
    limiter = null;
  }

  switch (limiter) {
    case "x":
      for (; offset < code.remaining; offset++) {
        if (!"0123456789abcdefABCDEF_".includes(code.get(offset))) {
          // TODO: 0x123hello should be illegal token; not parsed into two tokens
          break;
        }
      }
      break;

    case "b":
      for (; offset < code.remaining; offset++) {
        if (!"01_".includes(code.get(offset))) {
          // TODO: 0x123hello should be illegal token; not parsed into two tokens
          break;
        }
      }
      break;

    case null: {
      let dots = 0;
      for (; offset < code.remaining; offset++) {
        const char = code.get(offset);
        if (digits.includes(char)) continue;
        else if (char === ".") {
          if (++dots > 1) throw new Error("multiple dots?");
        } else if (char === "e") {
          for (; offset < code.remaining; offset++) {
            if (digits.includes(char)) continue;
          }
          break;
        } else {
          // TODO: 0x123hello should be illegal token; not parsed into two tokens
          break;
        }
      }
      break;
    }
  }
  return code.create(Tokens.Literal.Number, offset);
}

export class StringLiteralScope extends CstCodeScope {
  private nextCache: Token | null = null;

  constructor(
    readonly kind: Tokens.Literal.String.Kind,
    code: CstTokenizerContext,
  ) {
    super(code);
  }

  private matchSpecial(code: CstTokenizerContext): Token | null {
    const kind = this.kind;

    let token;
    if (token = parseLineBreakToken(code)) {
      if (kind.type != "multiLine") throw new Error("TODO??");
      return token;
    }
    if (token = code.ifMatch(kind.right)) {
      return token;
    }
    if (token = code.ifMatch(Tokens.Literal.String.Escape.ExprBegin)) {
      return token;
    }
    if (token = code.ifMatch(Tokens.Literal.String.Escape.VariableBegin)) {
      return token;
    }
    return null;
  }

  private match(code: CstTokenizerContext): Token {
    let token;
    if (token = this.nextCache) {
      this.nextCache = null;
      return code.consume(token);
    }
    if (token = this.matchSpecial(code)) {
      return token;
    }

    let offset = 0;
    while (offset < code.remaining) {
      if (token = this.matchSpecial(code.peek(offset))) {
        this.nextCache = token;
        return code.create(Tokens.Literal.String.Text, offset);
      }

      offset++;
    }
    return code.create(Tokens.Literal.String.Text, offset);
  }

  override nextAny(): [Token] {
    return [this.match(this.code)];
  }

  override peek(): this {
    return new StringLiteralScope(this.kind, this.code) as this;
  }
}

export class StringLiteralExprScope extends NormalScope {
  constructor(
    readonly kind: Tokens.Literal.String.Kind,
    ...args: ConstructorParameters<typeof NormalScope>
  ) {
    super(...args);
  }

  protected override unmatchedDelimiter(
    code: CstTokenizerContext,
    kind: Tokens.Delimiter.Right,
  ): Token {
    let token;
    if (token = code.ifMatch(this.kind.right)) {
      return token;
    }
    return super.unmatchedDelimiter(code, kind);
  }

  override peek(): this {
    return new StringLiteralExprScope(this.kind, this.code.peek()) as this;
  }
}
