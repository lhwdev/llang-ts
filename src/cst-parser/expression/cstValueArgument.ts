import { parser } from "../../cst-parse/parser.ts";
import { CstValueArguments } from "../../cst/expression/CstCall.ts";

export const cstValueArguments = parser(CstValueArguments, () => {});
