import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";
import { parseIdentifierLike } from "./common.ts";
import { CstCodeScope } from "./CstCodeScope.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { parseIdentifierToken } from "./identifier.ts";
import { parseLineBreakToken } from "./lineBreak.ts";

const digits = "0123456789_";
const specialDigitLimiters = "xb";

export function parseNumberLiteralToken(
  code: CstTokenizerContext,
): Token<Tokens.Literal.Number> | null {
  if (!"0123456789".includes(code.current)) return null;

  let offset = 1;
  let limiter;

  if (specialDigitLimiters.includes(limiter = code.get(offset))) {
    offset++;
  } else {
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

export function parseBooleanLiteralToken(
  code: CstTokenizerContext,
): Token<Tokens.Literal.Boolean> | null {
  const text = parseIdentifierLike(code);
  if (!text) return null;

  if (text === "true") return code.match(Tokens.Literal.Boolean.True);
  if (text === "false") return code.match(Tokens.Literal.Boolean.False);

  return null;
}
export function parseStringLiteralToken(
  code: CstTokenizerContext,
): Token<Tokens.Literal.String.Left> | null {
  let token;
  if (token = code.ifMatch(Tokens.Literal.String.Kind.OneLine.left)) return token;
  if (token = code.ifMatch(Tokens.Literal.String.Kind.MultiLine.left)) return token;
  return null;
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
    if (code.current === Tokens.Literal.String.Escape.EscapeChar) {
      const text = code.get(1);
      if (text === "u") { // unicode escape, such as \uf0ff
        return code.create(Tokens.Literal.String.Escape, 6);
      } else { // other escapes; \\, \n, \{ etc
        return code.create(Tokens.Literal.String.Escape, 2);
      }
    }
    if (token = code.ifMatch(kind.right)) {
      return token;
    }
    if (token = code.ifMatch(Tokens.Literal.String.Template.ExprBegin)) {
      return token;
    }
    if (token = code.ifMatch(Tokens.Literal.String.Template.VariableBegin)) {
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

    let offset = 1;
    while (offset < code.remaining) {
      if (token = this.matchSpecial(code.peek(offset))) {
        this.nextCache = token;
        return code.create(Tokens.Literal.String.Text, offset);
      }

      offset++;
    }
    return code.create(Tokens.Literal.String.Text, offset);
  }
  override nextAny(): Token {
    return this.match(this.code);
  }

  override peek(): this {
    return new StringLiteralScope(this.kind, this.code.peek()) as this;
  }

  variableTemplate(): CstCodeScope {
    class VariableTemplate extends StringLiteralScope {
      override nextAny(): Token {
        let token;
        if (token = parseIdentifierToken(this.code)) {
          return token;
        }
        return super.nextAny();
      }
      override peek(): this {
        return new VariableTemplate(this.kind, this.code.peek()) as this;
      }
    }
    return new VariableTemplate(this.kind, this.code);
  }
}
