import { code, enableDiscard } from "../../cst-parse/intrinsics.ts";
import { unexpectedTokenError } from "../../cst-parse/parseError.ts";
import { nullableParser, parser } from "../../cst-parse/parser.ts";
import { CstBinaryOperator } from "../../cst/expression/CstOperator.ts";
import { CstUnaryOperator } from "../../cst/expression/CstOperator.ts";
import { Tokens } from "../../token/Tokens.ts";

// Note: unary ops cannot be distinguished from binary ops, such as + -.

export const cstUnaryPrefixOperator = parser(CstUnaryOperator, () => {
  const token = code((c) => c.expect(Tokens.Operator));
  switch (token.kind) {
    case Tokens.Operator.Plus:
      return new CstUnaryOperator.Plus(token);
    case Tokens.Operator.Minus:
      return new CstUnaryOperator.Negate(token);
    case Tokens.Operator.Not:
      return new CstUnaryOperator.Not(token);
    default:
      unexpectedTokenError(token);
  }
});

export const cstUnaryPostfixOperatorOrNull = nullableParser(CstUnaryOperator, () => {
  enableDiscard();
  const token = code((c) => c.expect(Tokens.Operator));
  switch (token.kind) {
    case Tokens.Operator.Plus:
      return new CstUnaryOperator.Plus(token);
    case Tokens.Operator.Minus:
      return new CstUnaryOperator.Negate(token);
    default:
      return null;
  }
});

export const cstBinaryOperatorOrNull = nullableParser(CstBinaryOperator, () => {
  return cstNotBinaryOperatorOrNull() ?? cstBinaryOperatorCoreOrNull();
});

export const cstBinaryOperatorCoreOrNull = nullableParser(CstBinaryOperator, () => {
  enableDiscard();
  let token;
  if (token = code((c) => c.next(Tokens.Operator))) {
    switch (token?.kind) {
      case Tokens.Operator.Plus:
        return new CstBinaryOperator.Add(token);
      case Tokens.Operator.Minus:
        return new CstBinaryOperator.Subtract(token);
      case Tokens.Operator.Dot:
        return new CstBinaryOperator.Access(token);
    }
    return null;
  }
  if (token = code((c) => c.next(Tokens.Keyword))) {
    switch (token.kind) {
      case Tokens.Keywords.Is:
        return new CstBinaryOperator.Is(token);
    }
  }
  if (token = code((c) => c.next(Tokens.Identifier))) {
    return new CstBinaryOperator.Infix(token);
  }
  return null;
}, { name: "cstBinaryOperatorCore" });

export const cstNotBinaryOperatorOrNull = nullableParser(CstBinaryOperator.Not, () => {
  enableDiscard();
  const notToken = code((c) => c.next(Tokens.Operator.Not));
  if (!notToken) return null;

  const operator = cstBinaryOperatorCoreOrNull();
  if (!operator) return null;

  return new CstBinaryOperator.Not(operator);
});
