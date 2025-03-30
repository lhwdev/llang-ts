import { CstExpression } from "./CstExpression.ts";
import type { CstBinaryOperator, CstOperator, CstUnaryOperator } from "./CstOperator.ts";

export abstract class CstOperation extends CstExpression {
  declare private $operation: void;
  abstract readonly operator: CstOperator;

  abstract readonly operand: CstExpression[];
}

export class CstBinaryOperation extends CstOperation {
  declare private $binaryOperation: void;

  constructor(
    readonly lhs: CstExpression,
    override readonly operator: CstBinaryOperator,
    readonly rhs: CstExpression,
  ) {
    super();
  }

  override get operand(): [CstExpression, CstExpression] {
    return [this.lhs, this.rhs];
  }
}

export class CstUnaryOperation extends CstOperation {
  declare private $unaryOperation: void;

  constructor(
    override readonly operator: CstUnaryOperator,
    readonly expr: CstExpression,
  ) {
    super();
  }

  override get operand(): [CstExpression] {
    return new [this.expr]();
  }
}
