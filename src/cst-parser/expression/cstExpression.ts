import type { CstConstraintScope } from "../../../lib/cst-parse/constraint/CstConstraintScope.ts";
import { code } from "../../../lib/cst-code/intrinsics.ts";
import { unexpectedTokenError } from "../../../lib/cst-parse/parseError.ts";
import { nullableParser, parser } from "../../../lib/cst-parse/parser.ts";
import { CstExpression } from "../../cst/expression/CstExpression.ts";
import {
  CstBinaryOperation,
  CstOperation,
  CstUnaryOperation,
} from "../../cst/expression/CstOperation.ts";
import {
  CstBinaryOperator,
  CstOperator,
  CstUnaryOperator,
  OperatorPrecedence,
} from "../../cst/expression/CstOperator.ts";
import { Tokens } from "../../token/Tokens.ts";
import { fmt } from "../../../lib/utils/format.ts";
import { cstCall, cstGetCall, cstLambdaCall, cstSimpleCall } from "./cstCall.ts";
import { cstGroup } from "./cstGroup.ts";
import { cstLambdaExpression } from "./cstLambdaExpression.ts";
import { cstLiteral } from "./cstLiteral.ts";
import {
  cstBinaryOperatorOrNull,
  cstUnaryPostfixOperatorOrNull,
  cstUnaryPrefixOperator,
} from "./cstOperator.ts";
import { cstReference } from "./cstReference.ts";

/**
 * All operations:
 * - binary ops
 * - unary ops
 * - group; ()
 * - invocation; CstCall (), CstLambdaCall {}, CstGetCall []
 *
 * {@link OperatorPrecedence}: (lowest -> highest)
 * - *special: assignment spread
 * - logic or, logic and -> equality -> comparison -> named check
 * - if falsy -> infix -> range
 * - additive -> multiplicative
 * - type cast
 * - *prefix: some(+ - !)
 * - *postfix: propagate error
 * - *postfix: invoke
 * - (*binary: access -> this is statement...)
 * All starred items are treated specially.
 *
 * Eager operations:
 * - group
 */

const cstExpression = parser(CstExpression, (scope: CstConstraintScope) => {
  const stack = new ExpressionStack();

  scope.repeat(() => 1);
});

type Item = CstExpression | CstOperator;

class ExpressionStack {
  private data: Item[] = [];

  push(item: Item) {
    this.data.push(item);
  }
}

/**
 * Can parse:
 * - unary ops (prefix)
 */
const cstPrefix = nullableParser(CstOperator, () => {
  const token = code((c) => c.peek());
  if (token.is(Tokens.Operator)) return cstUnaryPrefixOperator();

  return null;
}, { name: "prefix" });

/**
 * Can parse atom expression.
 * - {@link CstGroup}; ()
 * - constant literal, string template literal
 * - lambda expression
 * - reference; <identifier>
 */
const cstAtom = parser(CstExpression, () => {
  const token = code((c) => c.peek());
  if (token.is(Tokens.Identifier)) return cstReference();
  if (token.is(Tokens.Literal)) return cstLiteral();
  if (token.is(Tokens.Delimiter.Left)) {
    switch (token.kind) {
      case Tokens.Delimiter.Left.Brace:
        return cstLambdaExpression();
      case Tokens.Delimiter.Left.Paren:
        return cstGroup();
      default:
        unexpectedTokenError(token);
    }
  }
  if (token.is(Tokens.Keyword)) {
    // TODO
  }

  unexpectedTokenError(token);
}, { name: "atom" });

/**
 * Can parse:
 * - unary ops (postfix)
 * - invocation; CstCall (), CstLambdaCall {}, CstGetCall []
 */
const cstPostfix = nullableParser(CstOperator, () => {
  const token = code((c) => c.peek());
  if (token.is(Tokens.Delimiter.Left)) return new CstCallDelimiter(token.kind);
  if (token.is(Tokens.Operator)) return cstUnaryPostfixOperatorOrNull();

  return null;
}, { name: "postfix" });

class CstCallDelimiter extends CstOperator {
  constructor(readonly kind: Tokens.Delimiter.Left) {
    super();
  }

  override get precedence(): OperatorPrecedence {
    return OperatorPrecedence.Invoke;
  }
}

/**
 * Can parse:
 * - binary ops; + - * / etc, infix, dot
 */
const cstBinary = parser(CstOperator, () => {
  const binaryOp = cstBinaryOperatorOrNull();
  if (binaryOp) return binaryOp;

  throw new Error("???");
}, { name: "binary" });
