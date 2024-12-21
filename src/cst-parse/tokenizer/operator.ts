import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";

export function parseOperatorToken(code: CstTokenizerContext): Token<Tokens.Operator> | null {
  const kind = parseOperatorKind(code);
  return kind ? code.match(kind) : null;
}

function parseOperatorKind(code: CstTokenizerContext): Tokens.Operator | null {
  switch (code.current) {
    case "{":
      return Tokens.Delimiter.Left.Brace;
    case "[":
      return Tokens.Delimiter.Left.Bracket;
    case "(":
      return Tokens.Delimiter.Left.Paren;

    case "}":
      return Tokens.Delimiter.Right.Brace;
    case "]":
      return Tokens.Delimiter.Right.Bracket;
    case ")":
      return Tokens.Delimiter.Right.Paren;

    case "+":
      return Tokens.Operator.Plus;
    case "-":
      return Tokens.Operator.Minus;
    case ".":
      return Tokens.Operator.Dot;

    case ",":
      return Tokens.Separator.Comma;
    case ";":
      return Tokens.Separator.Semi;

    default:
      return null;
  }
}
