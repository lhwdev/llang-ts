import { TokenKind } from "./TokenKind.ts";

// these properties are for TS type narrowing: without this, when
// token is Implicit, if !token.is(Whitespace) then token becomes never. To
// say, type `this is SomeType` cannot differentiate Whitespace, LineBreak,
// etc, as they have same shape, even though `instanceof` will say different.
export type TypeMarker = never;

export namespace Tokens {
  /// Eof: end of file
  class _Eof extends TokenKind {
    declare $eof?: TypeMarker;
  }
  export const Eof = new _Eof("");

  /// Implicit Nodes (ignored)
  export class Implicit extends TokenKind {
    declare $implicit?: TypeMarker;
  }

  export class Whitespace extends Implicit {
    declare $whitespace?: TypeMarker;
  }
  export class LineBreak extends Implicit {
    declare $lineBreak?: TypeMarker;
  }

  export class Comment extends Implicit {
    declare $comment?: TypeMarker;
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
      readonly end: Comment.End | null;
      readonly text: new (code: string) => Comment.Content;
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
        get text() {
          return Text;
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
        get text() {
          return Content;
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

    export namespace Line {
      export const Kind: Kind = {
        type: "line",
        get begin() {
          return Begin;
        },
        get end() {
          return null;
        },
        get text() {
          return Content;
        },
      };

      export const Begin = new Comment.Begin(Kind, "//");
      export class Content extends Comment.Content {
        constructor(code: string) {
          super(Kind, code);
        }
      }
    }
  }

  /// Modifiers
  export class Modifier extends TokenKind {
    declare $modifier?: TypeMarker;
  }

  export const Keywords = [
    "class",
    "fun",
    "val",
    "var",
  ] as const;

  export class Keyword extends Modifier {
    declare $keyword?: TypeMarker;
  }

  export const SoftKeywords = [
    "public",
  ] as const;

  export class SoftKeyword extends Modifier {
    declare $softKeyword?: TypeMarker;
  }

  /// Identifiers
  export class Identifier extends TokenKind {
    declare $identifier?: TypeMarker;
  }

  /// Operators
  export class Operator extends TokenKind {
    declare $operator?: TypeMarker;

    static Plus = new Operator("+");
    static Minus = new Operator("-");

    static Dot = new Operator(".");
  }

  /// Operators - Delimiter: {} [] ()
  export class Delimiter extends Operator {
    declare $delimiter?: TypeMarker;
  }

  export namespace Delimiter {
    export class Left extends Delimiter {
      declare $delimiterLeft?: TypeMarker;

      static Brace = new Left("{");
      static Bracket = new Left("[");
      static Paren = new Left("(");
    }
    export class Right extends Delimiter {
      declare $delimiterRight?: TypeMarker;

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
    declare $separator?: TypeMarker;

    static Comma = new Separator(",");
    static Semi = new Separator(";");
  }

  /// Literals: "hi$ho" 0.23e5
  export class Literal extends TokenKind {}

  export namespace Literal {
    export class String extends Literal {}

    export namespace String {
      export class Left extends String {
        declare $stringLeft?: TypeMarker;

        kind!: String.Kind;
      }
      export class Right extends String {
        declare $stringRight?: TypeMarker;

        kind!: String.Kind;
      }
      export class Text extends String {
        declare $stringText?: TypeMarker;
      }
      export class Template extends String {
        declare $stringTemplate?: TypeMarker;

        static VariableBegin = new Template("$");
        static ExprBegin = new Template("${");
        static ExprEnd = new Template("}");
      }

      export class Escape extends Text {
        declare $stringEscape?: TypeMarker;

        static EscapeChar = "\\";
      }

      export class Kind {
        constructor(
          readonly type: "oneLine" | "multiLine",
          readonly template: boolean,
          readonly escape: boolean,
          readonly left: Left,
          readonly right: Right,
        ) {
          left.kind = this;
          right.kind = this;
        }

        static OneLine = new Kind("oneLine", true, true, new Left('"'), new Right('"'));
        static MultiLine = new Kind("multiLine", true, true, new Left('"""'), new Right('"""'));
      }
    }

    export class Number extends Literal {}

    export namespace Number {
      export class Binary extends Literal {}
      export class Hex extends Literal {}
      export class Decimal extends Literal {}
    }

    export class Boolean extends Literal {
      static True = new Boolean("true");
      static False = new Boolean("false");
    }
  }
}
