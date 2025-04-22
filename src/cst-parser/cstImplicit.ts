import { CstMutableList } from "../../lib/cst-parse/CstMutableList.ts";
import { useImplicitNode } from "../../lib/cst-parse/intrinsics.ts";
import { code } from "../../lib/cst-code/intrinsics.ts";
import { nullableParser, parser } from "../../lib/cst-parse/parser.ts";
import {
  CstBlockComment,
  CstImplicit,
  CstImplicitList,
  CstLineBreak,
  CstLineComment,
  CstWhitespace,
} from "../../lib/cst/CstImplicit.ts";
import type { Token } from "../../lib/token/Token.ts";
import { Tokens } from "../../src/token/Tokens.ts";
import { codeScopes } from "../tokenizer/index.ts";

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
        const content = CstMutableList<Token<Tokens.Comment | Tokens.LineBreak>>();
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
        const content = CstMutableList<Token<Tokens.Comments.Line.Content>>();
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
  const list = CstMutableList<CstImplicit>();
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
