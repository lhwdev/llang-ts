import { TokenKind } from "./TokenKind.ts";
import type { TypeMarker } from "../utils/TypeMarker.ts";
import { type FirstToUppercase, firstToUppercase } from "../utils/strings.ts";

export namespace Tokens {
  /**
   * End: end of scope. In root scope, represents EOF(end of file). In specific
   * scope, represents delimited scope, such as end of group or comma.
   */
  class _End extends TokenKind {
    declare private $eof: void;
  }
  export const End = new _End("");

  /// Implicit Nodes (ignored)
  export class Implicit extends TokenKind {
    declare private $implicit: void;
  }

  export class Whitespace extends Implicit {
    declare private $whitespace: void;
  }
  export class LineBreak extends Implicit {
    declare private $lineBreak: void;
  }

  export class Comment extends Implicit {
    declare private $comment: void;
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
    declare private $modifier: void;
  }

  function modifiers<const K extends string, T extends Modifier>(
    create: new (code: string) => T,
    all: K[],
  ) {
    const kinds = all.map((k) => new create(k));
    const codeMap = new Map(kinds.map((k) => [k.code, k]));
    return {
      ...Object.fromEntries(
        all.map((k, index) => [firstToUppercase(k), kinds[index]]),
      ) as Record<FirstToUppercase<K>, T>,

      all: kinds,

      get(code: string) {
        return codeMap.get(code) ?? null;
      },
    };
  }

  export class Keyword extends Modifier {
    declare private $keyword: void;
  }

  export const Keywords = modifiers(Keyword, [
    "class",
    "fun",
    "val",
    "var",
    "in",
    "is",
    "as",
  ]);

  export class SoftKeyword extends Modifier {
    declare private $softKeyword: void;
  }

  export const SoftKeywords = modifiers(SoftKeyword, [
    "public",
  ]);

  /// Identifiers
  export class Identifier extends TokenKind {
    declare private $identifier: void;
  }

  /// Operators
  export class Operator extends TokenKind {
    declare private $operator: void;

    static Plus = new Operator("+");
    static Minus = new Operator("-");

    static Not = new Operator("!");

    static Dot = new Operator(".");
  }

  /// Operators - Delimiter: {} [] ()
  export class Delimiter extends Operator {
    declare private $delimiter: void;

    kind!: Delimiters;
  }

  export namespace Delimiter {
    export class Left extends Delimiter {
      declare private $delimiterLeft: void;

      static Brace = new Left("{");
      static Bracket = new Left("[");
      static Paren = new Left("(");
      static AngleBracket = new Left("<");
    }
    export class Right extends Delimiter {
      declare private $delimiterRight: void;

      static Brace = new Right("}");
      static Bracket = new Right("]");
      static Paren = new Right(")");
      static AngleBracket = new Right(">");
    }
  }

  export class Delimiters {
    constructor(
      readonly left: Delimiter.Left,
      readonly right: Delimiter.Right,
    ) {
      left.kind = this;
      right.kind = this;
    }

    static Brace = new Delimiters(Delimiter.Left.Brace, Delimiter.Right.Brace);
    static Bracket = new Delimiters(Delimiter.Left.Bracket, Delimiter.Right.Bracket);
    static Paren = new Delimiters(Delimiter.Left.Paren, Delimiter.Right.Paren);
  }

  /// Operators - Separators: , ;
  export class Separator extends Operator {
    declare private $separator: void;

    static Comma = new Separator(",");
    static Semi = new Separator(";");
  }

  /// Literals: "hi$ho" 0.23e5
  export class Literal extends TokenKind {
    declare private $literal: void;
  }

  export namespace Literal {
    export class String extends Literal {
      $stringLiteral?: TypeMarker;
    }

    export namespace String {
      export class Left extends String {
        declare private $stringLeft: void;

        kind!: String.Kind;
      }
      export class Right extends String {
        declare private $stringRight: void;

        kind!: String.Kind;
      }
      export class Text extends String {
        declare private $stringText: void;
      }
      export class Template extends String {
        declare private $stringTemplate: void;

        static VariableBegin = new Template("$");
        static ExprBegin = new Template("${");
        static ExprEnd = new Template("}");
      }

      export class Escape extends Text {
        declare private $stringEscape: void;

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

    export class Number extends Literal {
      $numberLiteral?: TypeMarker;
    }

    export namespace Number {
      export class Binary extends Literal {}
      export class Hex extends Literal {}
      export class Decimal extends Literal {}
    }

    export class Boolean extends Literal {
      $booleanLiteral?: TypeMarker;

      static True = new Boolean("true");
      static False = new Boolean("false");
    }
  }
}
