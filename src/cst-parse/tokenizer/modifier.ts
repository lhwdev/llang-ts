import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/TokenKind.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

const isWord = /\w/;

function parseIdentifierLike(code: CstTokenizerContext): string | null {
  if (!isWord.test(code.current)) return null;
  let offset = 1;
  for (; offset < code.remaining; offset++) {
    if (!isWord.test(code.current)) break;
  }
  return code.span(offset);
}

export function parseKeywordToken(code: CstTokenizerContext): Token<Tokens.Keyword> | null {
  const text = parseIdentifierLike(code);
  if (!text) return null;

  if (Tokens.Keywords.includes(text as any)) {
    return code.match(new Tokens.Keyword(text));
  }
  return null;
}

export function parseSoftKeywordToken(code: CstTokenizerContext): Token<Tokens.SoftKeyword> | null {
  const text = parseIdentifierLike(code);
  if (!text) return null;

  if (Tokens.SoftKeywords.includes(text as any)) {
    return code.match(new Tokens.SoftKeyword(text));
  }
  return null;
}
