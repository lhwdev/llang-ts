import { code } from "../../../lib/cst-code/intrinsics.ts";
import { parser } from "../../../lib/cst-parse/parser.ts";
import { CstReference } from "../../cst/expression/CstReference.ts";
import { Tokens } from "../../token/Tokens.ts";

export const cstReference = parser(CstReference, () => {
  const token = code((c) => c.expect(Tokens.Identifier));
  return new CstReference(token);
});
