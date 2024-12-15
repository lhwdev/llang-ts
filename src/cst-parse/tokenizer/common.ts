import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { isWord } from "./modifier.ts";

export function parseIdentifierLike(code: CstTokenizerContext): string | null {
  if (!isWord.test(code.current)) return null;
  let offset = 1;
  for (; offset < code.remaining; offset++) {
    if (!isWord.test(code.current)) break;
  }
  return code.span(offset);
}
