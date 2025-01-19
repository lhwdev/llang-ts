import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { parseIdentifierLike } from "./common.ts";

export function parseKeywordToken(code: CstTokenizerContext): Token<Tokens.Keyword> | null {
  const text = parseIdentifierLike(code);
  if (!text) return null;

  const keyword = Tokens.Keywords.get(text);
  return keyword ? code.match(keyword) : null;
}

export function parseSoftKeywordToken(code: CstTokenizerContext): Token<Tokens.SoftKeyword> | null {
  const text = parseIdentifierLike(code);
  if (!text) return null;

  const keyword = Tokens.SoftKeywords.get(text);
  return keyword ? code.match(keyword) : null;
}
