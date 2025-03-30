import type { Token } from "../token/Token.ts";
import { Tokens } from "../token/Tokens.ts";
import { dumpNodeEntry, formatNodeName } from "../utils/debug.ts";
import { fmt, format } from "../utils/format.ts";
import type { CstList } from "./CstList.ts";
import { CstNode } from "./CstNode.ts";

export class CstImplicit extends CstNode {
  declare private $implicit: void;
}

export class CstWs extends CstImplicit {
  declare private $ws: void;

  constructor(readonly token: Token) {
    super();
  }
}

export class CstWhitespace extends CstWs {
  declare private $whitespace: void;
}

export class CstLineBreak extends CstWs {
  declare private $lineBreak: void;
}

export abstract class CstComment extends CstImplicit {
  declare private $comment: void;
  abstract readonly kind: Tokens.Comments.Kind;
  abstract readonly content: CstList<Token<Tokens.Comment.Content | Tokens.LineBreak>>;
}

export class CstBlockComment extends CstComment {
  declare private $blockComment: void;

  constructor(
    override readonly kind: Tokens.Comments.Kind,
    override readonly content: CstList<Token<Tokens.Comment.Content | Tokens.LineBreak>>,
  ) {
    super();
  }

  get isDoc() {
    return this.kind.type === "docBlock";
  }
}

export class CstLineComment extends CstComment {
  declare private $lineComment: void;

  constructor(
    override readonly content: CstList<Token<Tokens.Comment.Content>>,
  ) {
    super();
  }

  override get kind() {
    return Tokens.Comments.Line.Kind;
  }
}

export class CstImplicitList extends CstImplicit {
  declare private $implicitList: void;

  constructor(
    readonly items: CstList<CstImplicit>,
  ) {
    super();
  }

  @format.representation
  override dump() {
    return fmt`${formatNodeName(this)} ${this.items.map((item) => dumpNodeEntry(item))}`.s;
  }
}
