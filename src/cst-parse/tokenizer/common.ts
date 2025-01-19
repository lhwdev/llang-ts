import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export const isWord = /\w/;

export function parseIdentifierLike(code: CstTokenizerContext): string | null {
  if (!isWord.test(code.current)) return null;
  let offset = 1;
  for (; offset < code.remaining; offset++) {
    if (!isWord.test(code.current)) break;
  }
  return code.span(offset);
}
