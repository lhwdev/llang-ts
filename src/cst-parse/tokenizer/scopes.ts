import type { Tokens } from "../../token/TokenKind.ts";
import { CommentScope } from "./comment.ts";
import type { CstCodeScopes } from "./CstCodeScope.ts";
import type { CstTokenizerContext } from "./CstTokenizerContext.ts";
import { NormalScope } from "./normal.ts";

export class CodeScopesImpl implements CstCodeScopes {
  constructor(private readonly code: CstTokenizerContext) {}

  normal() {
    return new NormalScope(this.code);
  }

  comment(kind: Tokens.Comments.Kind) {
    return new CommentScope(this.code, kind);
  }
}
