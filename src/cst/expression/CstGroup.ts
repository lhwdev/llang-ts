import { CstExpression } from "./CstExpression.ts";

export class CstGroup extends CstExpression {
  declare private $group: void;

  constructor(readonly inner: CstExpression) {
    super();
  }
}
