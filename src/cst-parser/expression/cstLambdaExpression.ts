import { parser } from "../../../lib/cst-parse/parser.ts";
import { CstLambdaExpression } from "../../cst/expression/CstFunctionExpression.ts";

export const cstLambdaExpression = parser(CstLambdaExpression, (): CstLambdaExpression => {
  return null;
});
