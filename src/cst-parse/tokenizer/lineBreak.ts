import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/TokenKind.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export function isLineBreak(code: CstTokenizerContext, offset: number): number | false {
  const first = code.get(offset);
  if (first == "\n") {
    return 1;
  }
  if (first == "\r") {
    if (code.get(offset + 1) == "\n") {
      return 2;
    } else {
      return 1;
    }
  }
  return false;
}

export function parseLineBreakToken(code: CstTokenizerContext): Token<Tokens.LineBreak> | null {
  if (code.current == "\n") {
    return code.match(new Tokens.LineBreak("\n"));
  }
  if (code.current == "\r") {
    if (code.get(1) == "\n") {
      return code.match(new Tokens.LineBreak("\r\n"));
    } else {
      return code.match(new Tokens.LineBreak("\r"));
    }
  }
  return null;
}
