import type { Tokens } from "../token/Tokens.ts";
import { CommentScope } from "./comment.ts";
import type { CstTokenizerContext } from "../../lib/cst-code/tokenizer/CstTokenizerContext.ts";
import { StringLiteralScope } from "./literal.ts";
import { NormalScope } from "./normal.ts";
import type { CstCodeScope } from "../../lib/cst-code/tokenizer/CstCodeScope.ts";

export interface CodeScopes {
  normal(): CstCodeScope;
  comment(kind: Tokens.Comments.Kind): CstCodeScope & { readonly depth: number };
  stringLiteral(
    kind: Tokens.Literal.String.Kind,
  ): CstCodeScope & { variableTemplate(): CstCodeScope };
}

export class CodeScopesImpl implements CodeScopes {
  constructor(private readonly code: CstTokenizerContext) {}

  normal() {
    return new NormalScope(this.code);
  }

  comment(kind: Tokens.Comments.Kind) {
    return new CommentScope(kind, this.code);
  }

  stringLiteral(kind: Tokens.Literal.String.Kind) {
    return new StringLiteralScope(kind, this.code);
  }
}
