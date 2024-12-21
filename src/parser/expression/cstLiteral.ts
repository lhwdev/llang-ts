import { node } from "../../cst-parse/inlineNode.ts";
import { code, codeScopes } from "../../cst-parse/intrinsics.ts";
import { nullableParser, parser } from "../../cst-parse/parser.ts";
import type { CstExpression } from "../../cst/expression/CstExpression.ts";
import {
  CstLiteral,
  CstStringTemplate,
  CstStringTemplateText,
  CstStringTemplateVariable,
} from "../../cst/expression/CstLiteral.ts";
import { Tokens } from "../../token/Tokens.ts";

export const cstLiteral = parser(CstLiteral, () => {
  let node;
  if (node = cstStringTemplateOrNull()) return node;

  throw new Error("no match");
});

export const cstStringTemplateOrNull = nullableParser(CstStringTemplate, () => {
  const left = code((c) => c.next(Tokens.Literal.String.Left));
  if (!left) return null;

  const kind = left.kind.kind;
  const scope = codeScopes.stringLiteral(kind);
  const items: CstExpression[] = [];
  while (true) {
    const next = code(scope, (c) => c.peek());
    if (next.is(Tokens.Literal.String.Text)) {
      const text = node(CstStringTemplateText, () => {
        const token = code((c) => c.consume(next));
        return new CstStringTemplateText(token);
      });
      items.push(text);
      continue;
    }
    if (next.is(Tokens.Literal.String.Template.ExprBegin)) {
      code(scope, (c) => c.consume(next));
      const expr = 0 as any; // TODO: some method to mark delimited?
      code(scope, (c) => c.expect(Tokens.Literal.String.Template.ExprEnd));

      items.push(expr);
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
      return new CstStringTemplate(items);
    }
    throw new Error(`unexpected token ${next}`);
  }
});
