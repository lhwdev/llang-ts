import { CstNode } from "../cst-parse/CstNode.ts";
import type { Token } from "../token/Token.ts";
import { Tokens } from "../token/TokenKind.ts";

export class CstImplicit extends CstNode {}

export class CstWs extends CstImplicit {
  constructor(readonly token: Token) {
    super();
  }
}

export class CstWhitespace extends CstWs {}

export abstract class CstComment extends CstImplicit {
  abstract readonly kind: Tokens.Comments.Kind;
  abstract readonly content: Token<Tokens.Comment.Content | Tokens.LineBreak>[];
}

export class CstBlockComment extends CstComment {
  constructor(
    override readonly kind: Tokens.Comments.Kind,
    override readonly content: Token<Tokens.Comment.Content | Tokens.LineBreak>[],
  ) {
    super();
  }

  get isDoc() {
    return this.kind.type === "docBlock";
  }
}

export class CstLineComment extends CstComment {
  constructor(
    override readonly content: Token<Tokens.Comment.Content>[],
  ) {
    super();
  }

  override get kind() {
    return Tokens.Comments.Line.Kind;
  }
}
