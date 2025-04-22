import { code } from "../../../lib/cst-code/intrinsics.ts";
import { parser } from "../../../lib/cst-parse/parser.ts";
import { CstGroup } from "../../cst/expression/CstGroup.ts";
import { Tokens } from "../../token/Tokens.ts";

export const cstGroup = parser(CstGroup, () => {
  const left = code((c) => c.expect(Tokens.Delimiter.Left));
  const kind = left.kind.kind;
});
