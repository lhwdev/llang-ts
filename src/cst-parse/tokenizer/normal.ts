import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/TokenKind.ts";
import type { TokenKinds } from "../../token/TokenKinds.ts";
import { isInherited } from "../../utils/extends.ts";
import { CstCodeScopeWithHint } from "./CstCodeScopeWithHint.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
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

export class NormalScope extends CstCodeScopeWithHint {
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
