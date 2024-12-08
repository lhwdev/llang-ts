import { CstCodeScopes } from "../cst-parse/CstCodeContext.ts";
import { code, noImplicitNodes } from "../cst-parse/intrinsics.ts";
import { parser } from "../cst-parse/parser.ts";
import {
  CstBlockComment,
  CstImplicit,
  CstLineComment,
  CstWhitespace,
  CstWs,
} from "../cst/CstImplicit.ts";
import type { Token } from "../token/Token.ts";
import { Tokens } from "../token/TokenKind.ts";

export const cstWhitespace = parser(CstWhitespace, () => {
  const token = code((c) => c.expect(Tokens.Whitespace));
  return new CstWhitespace(token);
});

export const cstImplicit = parser(CstImplicit, () => {
  noImplicitNodes();

  const token = code((c) => c.expect(Tokens.Implicit));
  if (token.is(Tokens.Comment)) {
    if (!token.is(Tokens.Comment.Begin)) throw new Error("unknown status");
    const kind = token.kind.kind;
    const scope = new CstCodeScopes.Comment(kind);

    switch (kind.type) {
      case "docBlock":
      case "block": {
        const content: Token<Tokens.Comment.Content | Tokens.LineBreak>[] = [];
        while (true) {
          const next = code(scope, (c) => c.expect());
          if (next.is(Tokens.Comment.End)) {
            return new CstBlockComment(kind, content);
          }
          if (next.is(Tokens.Comment.Content) || next.is(Tokens.LineBreak)) {
            content.push(next);
          }
          throw new Error(`illegal content inside block comment: ${next}`);
        }
      }
      case "line": {
        const content: Token<Tokens.Comments.Line.Content>[] = [];
        while (true) {
          const next = code(scope, (c) => c.expect());
          if (next.is(Tokens.LineBreak)) {
            return new CstLineComment(content);
          }
          if (next.is(Tokens.Comment.Content)) {
            content.push(next);
          }
          throw new Error(`illegal content inside block comment: ${next}`);
        }
      }
    }
  }
  if (token.is(Tokens.Whitespace)) return new CstWhitespace(token);
  if (token.is(Tokens.LineBreak)) return new CstWs(token);

  throw new Error(`unreachable: not well-known TokenType ${token.kind}`);
});
