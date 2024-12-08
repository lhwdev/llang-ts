export abstract class TokenKind {
  constructor(readonly code: string) {}
}

// these properties are for TS type narrowing: without this, when
// token is Implicit, if !token.is(Whitespace) then token becomes never. To
// say, type `this is SomeType` cannot differentiate Whitespace, LineBreak,
// etc, as they have same shape, even though `instanceof` will say different.
type TypeMarker = never;

export namespace Tokens {
  /// Eof: end of file
  export class Eof extends TokenKind {
    $eof?: TypeMarker;
  }

  /// Implicit Nodes (ignored)
  export class Implicit extends TokenKind {
    $implicit?: TypeMarker;
  }

  export class Whitespace extends Implicit {
    $whitespace?: TypeMarker;
  }
  export class LineBreak extends Implicit {
    $lineBreak?: TypeMarker;
  }

  export class Comment extends Implicit {
    $comment?: TypeMarker;
    constructor(readonly kind: Comments.Kind, code: string) {
      super(code);
    }
  }

  export namespace Comment {
    export class Begin extends Comment {}

    export class End extends Comment {}

    export class Content extends Comment {}
  }

  export namespace Comments {
    export interface Kind {
      type: "docBlock" | "block" | "line";

      readonly begin: Comment.Begin;
      readonly end: Comment.End;
    }

    export namespace DocBlock {
      export const Kind: Kind = {
        type: "docBlock",
        get begin() {
          return Begin;
        },
        get end() {
          return End;
        },
      };

      export const Begin = new Comment.Begin(Kind, "/**");
      export const End = new Comment.End(Kind, "*/");
      export abstract class Content extends Comment.Content {
        constructor(code: string) {
          super(Kind, code);
        }
      }

      export class Text extends Content {}
      /** ex) `@param` */
      export class Annotation extends Content {}
      /** ex) backtick, star, underslash */
      export class Delimiter extends Content {
        constructor(code: string, readonly open: boolean) {
          super(code);
        }
      }
    }

    export namespace Block {
      export const Kind: Kind = {
        type: "block",
        get begin() {
          return Begin;
        },
        get end() {
          return End;
        },
      };

      export const Begin = new Comment.Begin(Kind, "//");
      export const End = new Comment.End(Kind, "");
      export class Content extends Comment.Content {
        constructor(code: string) {
          super(Kind, code);
        }
      }
    }

    export namespace Line {
      export const Kind: Kind = {
        type: "line",
        get begin() {
          return Begin;
        },
        get end() {
          return End;
        },
      };

      export const Begin = new Comment.Begin(Kind, "/*");
      export const End = new Comment.End(Kind, "*/");
      export class Content extends Comment.Content {
        constructor(code: string) {
          super(Kind, code);
        }
      }
    }
  }

  /// Operators
  export class Operator extends TokenKind {
    $operator?: TypeMarker;
  }

  /// Operators - Delimiter: {} [] ()

  export class Delimiter extends Operator {
    $delimiter?: TypeMarker;
  }

  export namespace Delimiter {
    export class Left extends Delimiter {
      $delimiterLeft?: TypeMarker;

      static Brace = new Left("{");
      static Bracket = new Left("[");
      static Paren = new Left("(");
    }
    export class Right extends Delimiter {
      $delimiterRight?: TypeMarker;

      static Brace = new Right("}");
      static Bracket = new Left("]");
      static Paren = new Left(")");
    }
  }

  export class Delimiters {
    constructor(
      readonly left: Delimiter.Left,
      readonly right: Delimiter.Right,
    ) {}

    static Brace = new Delimiters(Delimiter.Left.Brace, Delimiter.Right.Brace);
    static Bracket = new Delimiters(Delimiter.Left.Bracket, Delimiter.Right.Bracket);
    static Paren = new Delimiters(Delimiter.Left.Paren, Delimiter.Right.Paren);
  }

  /// Operators - Separators: , ;
  export class Separator extends Operator {
    $separator?: TypeMarker;
  }

  export namespace Separators {
    export const Comma = new Separator(",");
  }
}
