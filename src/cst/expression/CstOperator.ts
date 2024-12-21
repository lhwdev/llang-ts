import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";

export abstract class CstOperator {}

/// Binary
export abstract class CstBinaryOperator extends CstOperator {
  abstract readonly token: Token;
}

export namespace CstBinaryOperator {
  export abstract class General extends CstBinaryOperator {}

  function general<Kind extends Tokens.Operator>(kind: Kind) {
    return class extends CstBinaryOperator {
      constructor(override readonly token: Token<Kind>) {
        super();
        token.as(kind);
      }
    };
  }

  export const Add = general(Tokens.Operator.Plus);
  export const Subtract = general(Tokens.Operator.Minus);

  export class Infix extends CstBinaryOperator {
    constructor(
      override readonly token: Token<Tokens.Identifier>,
    ) {
      super();
    }
  }
}

/// Unary
export abstract class CstUnaryOperator extends CstOperator {
  abstract readonly token: Token;
}

export namespace CstUnaryOperator {
  function general<Kind extends Tokens.Operator>(kind: Kind) {
    return class extends CstUnaryOperator {
      constructor(override readonly token: Token<Kind>) {
        super();
        token.as(kind);
      }
    };
  }

  export const Plus = general(Tokens.Operator.Plus);
  export const Negate = general(Tokens.Operator.Minus);
}

/// Invoke
export class CstInvokeOperator extends CstOperator {
  static Invoke = new CstInvokeOperator();
  static TrailingLambda = new CstInvokeOperator();
}
