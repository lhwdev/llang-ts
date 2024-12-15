import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/TokenKind.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { parseLineBreakToken } from "./lineBreak.ts";

export function parseImplicitToken(code: CstTokenizerContext): Token<Tokens.Implicit> | null {
  let token;
  if (token = code.ifMatch(Tokens.Comments.DocBlock.Begin)) return token;
  if (token = code.ifMatch(Tokens.Comments.Block.Begin)) return token;
  if (token = code.ifMatch(Tokens.Comments.Line.Begin)) return token;

  if (token = parseLineBreakToken(code)) return token;
  if (token = parseWhitespaceToken(code)) return token;

  return null;
}

const isWhitespaceRegex = /[^\S\r\n]/;

export function parseWhitespaceToken(code: CstTokenizerContext): Token<Tokens.Whitespace> | null {
  let offset = 0;
  for (; offset < code.remaining; offset++) {
    if (!isWhitespaceRegex.test(code.get(offset))) break;
  }
  if (offset == 0) return null;
  return code.create(Tokens.Whitespace, offset);
}
