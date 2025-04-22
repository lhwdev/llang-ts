import type { Token } from "../../lib/token/Token.ts";
import { Tokens } from "../token/Tokens.ts";
import type { TokenKinds } from "../../lib/token/TokenKinds.ts";
import { isInherited } from "../../lib/utils/extends.ts";
import type { CstTokenizerContext } from "../../lib/cst-code/tokenizer/CstTokenizerContext.ts";
import { parseIdentifierToken } from "./identifier.ts";
import { parseImplicitToken } from "./implicit.ts";
import { parseLineBreakToken } from "./lineBreak.ts";
import {
  parseBooleanLiteralToken,
  parseNumberLiteralToken,
  parseStringLiteralToken,
} from "./literal.ts";
import { parseKeywordToken, parseSoftKeywordToken } from "./modifier.ts";
import { parseOperatorToken } from "./operator.ts";
import { CstCodeScope } from "../../lib/cst-code/tokenizer/CstCodeScope.ts";

export class NormalScope extends CstCodeScope {
  constructor(code: CstTokenizerContext) {
    super(code);
  }

  override match(code: CstTokenizerContext, hint: TokenKinds): Token {
    let token;

    if (token = parseLineBreakToken(code)) return token;

    if (token = parseKeywordToken(code)) return token;
    if (isInherited(hint, Tokens.SoftKeyword)) {
      if (token = parseSoftKeywordToken(code)) return token;
    }

    if (token = parseOperatorToken(code)) return token;

    if (token = parseNumberLiteralToken(code)) return token;
    if (token = parseBooleanLiteralToken(code)) return token;
    if (token = parseStringLiteralToken(code)) return token;

    if (token = parseIdentifierToken(code)) return token;
    if (token = parseImplicitToken(code)) return token;

    throw new Error(`nothing matched: ${code}`);
  }

  override peek(): this {
    return new NormalScope(this.code.peek()) as this;
  }
}
