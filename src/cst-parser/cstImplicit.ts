import { code, codeScopes, useImplicitNode } from "../cst-parse/intrinsics.ts";
import { nullableParser, parser } from "../cst-parse/parser.ts";
import {
  CstBlockComment,
  CstImplicit,
  CstImplicitList,
  CstLineBreak,
  CstLineComment,
  CstWhitespace,
} from "../cst/CstImplicit.ts";
import { CstArray } from "../cst/CstArray.ts";
import type { Token } from "../token/Token.ts";
import { Tokens } from "../token/Tokens.ts";

export const cstWhitespace = parser(CstWhitespace, () => {
  const token = code((c) => c.expect(Tokens.Whitespace));
  return new CstWhitespace(token);
});

export const cstImplicitOrNull = nullableParser(CstImplicit, () => {
  useImplicitNode(null);

  const token = code((c) => c.next(Tokens.Implicit));
  if (!token) return null;
  if (token.is(Tokens.Comment)) {
    if (!token.is(Tokens.Comment.Begin)) throw new Error("unknown status");
    const kind = token.kind.kind;
    const scope = codeScopes.comment(kind);

    switch (kind.type) {
      case "docBlock":
      case "block": {
        const content = new CstArray<Token<Tokens.Comment | Tokens.LineBreak>>();
        while (true) {
          const next = code(scope, (c) => c.next());
          if (next.is(Tokens.Comment.Begin)) {
            content.push(next);
            continue;
          }
          if (next.is(Tokens.Comment.End)) {
            if (scope.depth > 0) {
              content.push(next);
              continue;
            }
            return new CstBlockComment(kind, content);
          }
          if (next.is(Tokens.Comment.Content) || next.is(Tokens.LineBreak)) {
            content.push(next);
            continue;
          }
          throw new Error(`illegal content inside block comment: ${next}`);
        }
      }
      case "line": {
        const content = new CstArray<Token<Tokens.Comments.Line.Content>>();
        while (true) {
          const next = code(scope, (c) => c.next());
          if (next.is(Tokens.LineBreak)) {
            return new CstLineComment(content);
          }
          if (next.is(Tokens.Comment.Content)) {
            content.push(next);
            continue;
          }
          throw new Error(`illegal content inside line comment: ${next}`);
        }
      }
    }
  }
  if (token.is(Tokens.Whitespace)) return new CstWhitespace(token);
  if (token.is(Tokens.LineBreak)) return new CstLineBreak(token);

  throw new Error(`unreachable: not well-known TokenType ${token.kind}`);
});

export const cstImplicitList = parser(CstImplicitList, () => {
  const list = new CstArray<CstImplicit>();
  while (true) {
    const node = cstImplicitOrNull();
    if (!node) break;
    list.push(node);
  }
  return new CstImplicitList(list);
});

export const cstImplicitNoLineBreak = () => {
  if (code((c) => c.peek(Tokens.LineBreak))) return null;
  return cstImplicitOrNull();
};
