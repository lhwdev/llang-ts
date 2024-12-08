import { parser } from "../cst-parse/parser.ts";

export function cstLiteral() {
  cstStringLiteral();
}

export const cstStringLiteral = parser(() => {
});
