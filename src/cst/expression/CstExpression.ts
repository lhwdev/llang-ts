import { CstNode } from "../CstNode.ts";

export abstract class CstExpression extends CstNode {
  declare private $expression: void;
}
