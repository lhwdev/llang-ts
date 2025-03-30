import { constraintNode } from "../cst-parse/CstConstraintNode.ts";
import { cstImplicitList } from "../cst-parser/cstImplicit.ts";
import {
  cstNumberLiteralOrNull,
  cstStringTemplateOrNull,
} from "../cst-parser/expression/cstLiteral.ts";
import type { CstList } from "../cst/CstList.ts";
import { CstNode } from "../cst/CstNode.ts";
import { testCstParse } from "./common.ts";

const testCode = `
1 /*ho*/ 2 3 "hello!"
`;

class CoolNode extends CstNode {
  constructor(readonly args: CstList<CstNode>, readonly body: CstNode) {
    super();
  }
}

testCstParse(testCode, () => {
  cstImplicitList();
  constraintNode(CoolNode, (scope) => {
    const list = scope.repeat().atLeast(1).invokeMinimum(() => cstNumberLiteralOrNull());
    const other = scope.node(() => cstStringTemplateOrNull()).map((v) => v);

    return new CoolNode(list.value, other.value);
  });
});
