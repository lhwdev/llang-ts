import type { Token } from "../../../lib/token/Token.ts";
import type { Tokens } from "../../token/Tokens.ts";
import { CstNode } from "../../../lib/cst/CstNode.ts";
import type { CstTypeArguments } from "../type/CstTypeArguments.ts";
import { CstExpression } from "./CstExpression.ts";
import type { CstLambdaExpression } from "./CstFunctionExpression.ts";
import type { CstList } from "../../../lib/cst/CstList.ts";

export class CstCall extends CstExpression {
  declare private $call: void;

  constructor(
    readonly target: CstExpression,
  ) {
    super();
  }
}

export class CstSimpleCall extends CstCall {
  declare private $simpleCall: void;

  constructor(
    target: CstExpression,
    readonly typeArguments: CstTypeArguments | null,
    readonly valueArguments: CstValueArguments,
  ) {
    super(target);
  }
}

/**
 * Note that, when `fun fn(a: Int, b: () -> Unit)` exists, expression `fn(1) {}`
 * is interpreted as `CstLambdaCall(CstCall("fn", [1]), CstLambdaExpression(...))`.
 * As Cst cannot interpret the semantics of target function, cst parser cannot
 * distinct between `fn(1)({})` and `fn(1, {})`. So, converting Cst into such an
 * ast is a job of ast parser.
 */
export class CstLambdaCall extends CstCall {
  declare private $lambdaCall: void;

  constructor(
    target: CstExpression,
    readonly lambda: CstLambdaExpression,
  ) {
    super(target);
  }
}

export class CstGetCall extends CstCall {
  declare private $getCall: void;
}

export class CstValueArguments extends CstNode {
  declare private $valueArguments: void;

  constructor(
    readonly items: CstList<CstValueArgumentItem>,
  ) {
    super();
  }

  get(name: string): CstExpression | null;
  get(index: number): CstExpression | null;
  get(index: string | number): CstExpression | null {
    if (typeof index === "number") {
      return this.items.at(index)?.value ?? null;
    } else {
      for (const { name, value } of this.items) {
        if (name?.code === index) return value;
      }
      return null;
    }
  }
}

export class CstValueArgumentItem extends CstNode {
  constructor(readonly name: Token<Tokens.Identifier> | null, readonly value: CstExpression) {
    super();
  }
}
