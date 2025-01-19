import type { Token } from "../../token/Token.ts";
import type { TokenKind } from "../../token/TokenKind.ts";
import { Tokens } from "../../token/Tokens.ts";
import { CstNode } from "../CstNode.ts";

export enum OperatorPrecedence {
  // from lowest to highest

  Assignment, // = += -= *= /= %=
  Spread, // ...
  LogicOr, // ||
  LogicAnd, // &&
  Equality, // == != === !==
  Comparison, // < > <= >=
  NamedCheck, // in !in is !is
  IfFalsy, // ??
  Infix, // <identifier>
  Range, // ..= ..<
  Additive, // + -
  Multiplicative, // * / %
  TypeCast, // as as?
  Prefix, // + - !
  PropagateError, // ?
  Invoke, // expr() expr{} expr()
  Access, // . ?.
}

export abstract class CstOperator extends CstNode {
  declare private $operator: void;

  abstract precedence: OperatorPrecedence;
}

type Associativity = "both" | "left" | "right" | false;

/// Binary
export abstract class CstBinaryOperator extends CstOperator {
  declare private $binaryOperator: void;

  /**
   * - `"both"`: `a * b * c` = `(a * b) * c` = `a * (b * c)`
   * - `"left"`: `a * b * c` = `(a * b) * c`
   * - `"right"`: `a * b * c` = `a * (b * c)`
   * - `false`: expression such as `a * b * c` is invalid.
   */
  abstract associativity: Associativity;
}

export namespace CstBinaryOperator {
  export abstract class General extends CstBinaryOperator {}

  function general<Kind extends TokenKind>(
    kind: Kind,
    precedence: OperatorPrecedence,
    associativity: Associativity,
  ) {
    return class General extends CstBinaryOperator {
      readonly token: Token<Kind>;
      constructor(token: Token<Kind>) {
        super();
        this.token = token.as(kind);
      }

      override get precedence(): OperatorPrecedence {
        return precedence;
      }

      override get associativity(): Associativity {
        return associativity;
      }
    };
  }

  export class Add extends general(Tokens.Operator.Plus, OperatorPrecedence.Additive, "both") {}
  export class Subtract
    extends general(Tokens.Operator.Minus, OperatorPrecedence.Additive, "both") {}
  export class Access extends general(Tokens.Operator.Dot, OperatorPrecedence.Access, "left") {}

  export class Is extends general(Tokens.Keywords.Is, OperatorPrecedence.NamedCheck, false) {}

  export class Infix extends CstBinaryOperator {
    declare private $infix: void;

    constructor(readonly fn: Token<Tokens.Identifier>) {
      super();
    }

    override get precedence(): OperatorPrecedence {
      return OperatorPrecedence.Infix;
    }
    override get associativity(): Associativity {
      return "left";
    }
  }

  export class Not extends CstBinaryOperator {
    constructor(readonly base: CstBinaryOperator) {
      super();
    }

    override get associativity(): Associativity {
      return this.base.associativity;
    }

    override get precedence(): OperatorPrecedence {
      return this.base.precedence;
    }
  }
}

/// Unary
export abstract class CstUnaryOperator extends CstOperator {
  declare private $unaryOperator: void;

  constructor(readonly token: Token) {
    super();
  }

  /**
   * - `"left"`: +expr
   * - `"right"`: expr?
   */
  abstract direction: "left" | "right";
}

export namespace CstUnaryOperator {
  function general<Kind extends TokenKind>(
    kind: Kind,
    precedence: OperatorPrecedence,
    direction: "left" | "right",
  ) {
    return class General extends CstUnaryOperator {
      constructor(token: Token<Kind>) {
        super(token.as(kind));
      }

      override get direction() {
        return direction;
      }

      override get precedence(): OperatorPrecedence {
        return precedence;
      }
    };
  }

  export class Plus extends general(Tokens.Operator.Plus, OperatorPrecedence.Prefix, "left") {}
  export class Negate extends general(Tokens.Operator.Minus, OperatorPrecedence.Prefix, "left") {}
  export class Not extends general(Tokens.Operator.Not, OperatorPrecedence.Prefix, "left") {}
}
