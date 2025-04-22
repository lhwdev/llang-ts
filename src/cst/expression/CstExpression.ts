import { CstNode } from "../../../lib/cst/CstNode.ts";

export abstract class CstExpression extends CstNode {
  declare private $expression: void;
}
