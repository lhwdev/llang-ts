import type { Tokens } from "../../token/Tokens.ts";
import { CommentScope } from "./comment.ts";
import type { CstCodeScopes } from "./CstCodeScope.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { StringLiteralScope } from "./literal.ts";
import { NormalScope } from "./normal.ts";

export class CodeScopesImpl implements CstCodeScopes {
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
