import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
// @ts-types="npm:@types/unicode-properties"
import * as unicode from "unicode-properties";
import { isLineBreak } from "./lineBreak.ts";

const Other = "_$";

export function parseIdentifierToken(code: CstTokenizerContext): Token<Tokens.Identifier> | null {
  const first = code.current;
  if (first === "`") {
    let offset = 1;
    for (; offset < code.remaining; offset++) {
      if (code.get(offset) == "`") break;
      if (isLineBreak(code, offset)) throw new Error("TODO: parse error");
    }
    return code.create(Tokens.Identifier, offset);
  }
  if (!unicode.isAlphabetic(first.codePointAt(0)!) && !Other.includes(first)) {
    return null;
  }

  let offset = 1;
  for (; offset < code.remaining; offset++) {
    const char = code.get(offset);
    const category = unicode.getCategory(char.codePointAt(0)!);
    if (category[0] === "L" || category[0] === "N" || Other.includes(char)) {
      // okay
    } else {
      break;
    }
  }
  return code.create(Tokens.Identifier, offset);
}
