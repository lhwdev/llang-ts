import type { CstBody } from "../declaration/CstBody.ts";
import type { CstModifiers } from "..//declaration/CstModifier.ts";
import type { CstTypeParameters } from "../declaration/CstTypeParameter.ts";
import type { CstValueParameters } from "../declaration/CstValueParameter.ts";
import { CstExpression } from "./CstExpression.ts";

export abstract class CstFunctionExpression extends CstExpression {
  declare private $functionExpression: void;

  constructor(
    readonly modifiers: CstModifiers,
    readonly typeParameters: CstTypeParameters | null,
    readonly valueParameters: CstValueParameters,
    readonly body: CstBody,
  ) {
    super();
  }
}

export class CstFunctionLiteral extends CstFunctionExpression {
  declare private $functionLiteral: void;
}

export class CstLambdaExpression extends CstFunctionExpression {
  declare private $lambdaExpression: void;
}
