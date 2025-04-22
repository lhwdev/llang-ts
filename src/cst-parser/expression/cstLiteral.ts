import { node } from "../../../lib/cst-parse/inlineNode.ts";
import { intrinsics } from "../../../lib/cst-parse/intrinsics.ts";
import { code } from "../../../lib/cst-code/intrinsics.ts";
import { nullableParser, parser } from "../../../lib/cst-parse/parser.ts";
import { CstMutableList } from "../../../lib/cst-parse/CstMutableList.ts";
import {
  CstBooleanLiteral,
  CstNumberLiteral,
  CstStringLiteral,
  CstStringLiteralItem,
} from "../../cst/expression/CstLiteral.ts";
import {
  CstLiteral,
  CstStringLiteralText,
  CstStringTemplateVariable,
} from "../../cst/expression/CstLiteral.ts";
import { Tokens } from "../../../src/token/Tokens.ts";
import { codeScopes } from "../../tokenizer/index.ts";

export const cstLiteral = parser(CstLiteral, () => {
  let node;
  if (node = cstNumberLiteralOrNull()) return node;
  if (node = cstBooleanLiteralOrNull()) return node;
  if (node = cstStringLiteralOrNull()) return node;

  throw new Error("no match " + code((c) => (c as any).debugNext));
});

export const cstNumberLiteralOrNull = nullableParser(CstNumberLiteral, () => {
  const token = code((c) => c.next(Tokens.Literal.Number));
  if (!token) return null;

  return new CstNumberLiteral(token);
});

export const cstBooleanLiteralOrNull = nullableParser(CstBooleanLiteral, () => {
  const token = code((c) => c.next(Tokens.Literal.Boolean));
  if (!token) return null;

  return new CstBooleanLiteral(token);
});

export const cstStringLiteralOrNull = nullableParser(CstStringLiteral, () => {
  const left = code((c) => c.next(Tokens.Literal.String.Left));
  if (!left) return null;

  intrinsics.vital(left);

  const kind = left.kind.kind;
  const scope = codeScopes.stringLiteral(kind);
  const items = CstMutableList<CstStringLiteralItem>();
  while (true) {
    const next = code(scope, (c) => c.peek());
    if (next.is(Tokens.Literal.String.Text)) {
      const text = node(CstStringLiteralText, () => {
        const token = code(scope, (c) => c.consume(next));
        return new CstStringLiteralText(token);
      });
      items.push(text);
      continue;
    }
    if (next.is(Tokens.Literal.String.Template.ExprBegin)) {
      const item = node(CstStringLiteralItem, () => {
        code(scope, (c) => c.consume(next));
        const expr = 0 as any; // TODO: some method to mark delimited?
        code(scope, (c) => c.expect(Tokens.Literal.String.Template.ExprEnd));
        return expr;
      });
      items.push(item);
      continue;
    }
    if (next.is(Tokens.Literal.String.Template.VariableBegin)) {
      const expr = node(CstStringTemplateVariable, () => {
        code(scope, (c) => c.consume(next));
        const identifier = code(scope.variableTemplate(), (c) => c.expect(Tokens.Identifier));
        return new CstStringTemplateVariable(identifier);
      });
      items.push(expr);
      continue;
    }
    if (next.is(kind.right)) {
      code(scope, (c) => c.consume(next));
      return CstStringLiteral.from(left, items, next);
    }
    throw new Error(`unexpected token ${next}`);
  }
});
