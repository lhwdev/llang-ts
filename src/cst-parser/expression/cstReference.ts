import { code } from "../../cst-parse/intrinsics.ts";
import { parser } from "../../cst-parse/parser.ts";
import { CstReference } from "../../cst/expression/CstReference.ts";
import { Tokens } from "../../token/Tokens.ts";

export const cstReference = parser(CstReference, () => {
  const token = code((c) => c.expect(Tokens.Identifier));
  return new CstReference(token);
});
