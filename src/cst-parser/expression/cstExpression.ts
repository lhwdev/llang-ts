import { peek, peekNode } from "../../cst-parse/inlineNode.ts";
import { code, endOfCode } from "../../cst-parse/intrinsics.ts";
import { unexpectedTokenError } from "../../cst-parse/parseError.ts";
import { nullableParser, parser } from "../../cst-parse/parser.ts";
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
import { fmt } from "../../utils/format.ts";
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
 * Control flow graph of, occurrence of these operators / nodes:
 * 1.
 */

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
 * - literal
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
 * - unary ops (postfix)
 * - invocation; CstCall (), CstLambdaCall {}, CstGetCall []
 */
const cstPostfix = nullableParser(CstOperator, () => {
  const token = code((c) => c.peek());
  if (token.is(Tokens.Delimiter.Left)) return new CstCallDelimiter(token.kind);
  if (token.is(Tokens.Operator)) return cstUnaryPostfixOperatorOrNull();

  return null;
}, { name: "postfix" });

/**
 * Can parse:
 * - binary ops; + - * / etc, infix, dot
 */
const cstBinary = parser(CstOperator, () => {
  const binaryOp = cstBinaryOperatorOrNull();
  if (binaryOp) return binaryOp;

  throw new Error("???");
}, { name: "binary" });

/** */
export const cstExpression = parser(CstExpression, () => {
  const list = peek(() => {
    const list: (CstExpression | CstOperator)[] = [];
    while (!endOfCode()) {
      let node;
      if (node = cstPrefix()) list.push(node);
      if (node = cstAtom()) list.push(node);
      if (node = cstPostfix()) list.push(node);
      if (endOfCode()) {
        break;
      } else {
        list.push(cstBinary());
      }
    }
    return list;
  });
});

function cstExpressionInner() {
  const stack: CstExpression[] = [];
  const operators: CstOperator[] = [];

  const makeOperation = (operator: CstOperator) =>
    peekNode(CstOperation, () => {
      if (operator instanceof CstBinaryOperator) {
        const right = stack.pop();
        const left = stack.pop();
        if (!right || !left) {
          throw new Error(fmt`null operand for ${operator}: left=${left} right=${right}`.s);
        }
        return new CstBinaryOperation(left, operator, right);
      } else if (operator instanceof CstUnaryOperator) {
        const operand = stack.pop()!;
        return new CstUnaryOperation(operator, operand);
      } else {
        console.error("unknown operator", operator);
        throw new Error("unknown operator");
      }
    });

  const handleOperator = (operator: CstOperator) => {
    operators.push(operator);
    while (true) {
      const before = operators.at(-2);
      if (!before) break;
      const last = operators.at(-1)!;
      if (before.precedence >= last.precedence) {
        stack.push(makeOperation(operator));
      }
    }
  };

  while (!endOfCode()) {
    let node;
    if (node = cstPrefix()) handleOperator(node);
    if (node = cstAtom()) stack.push(node);
    if (node = cstPostfix()) {
      handleOperator(node);
      if (node instanceof CstCallDelimiter) {
        console.assert(node === operators.pop());
        const fn = stack.pop()!;

        let call;
        switch (node.kind) {
          case Tokens.Delimiter.Left.Brace:
            call = cstLambdaCall(fn);
            break;
          case Tokens.Delimiter.Left.Bracket:
            call = cstGetCall(fn);
            break;
          case Tokens.Delimiter.Left.Paren:
            call = cstSimpleCall(fn);
            break;
          case Tokens.Delimiter.Left.AngleBracket:
            call = cstCall(fn);
            break;
          default:
            unexpectedTokenError(code((c) => c.peek()));
        }
        stack.push(call);
      }
    }
    if (endOfCode()) {
      break;
    } else {
      handleOperator(cstBinary());
    }
  }
}
