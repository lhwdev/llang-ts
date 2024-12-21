import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";
import { CstExpression } from "./CstExpression.ts";

export abstract class CstLiteral extends CstExpression {}

export class CstNumberLiteral extends CstLiteral {
  readonly value: number;

  constructor(
    readonly token: Token<Tokens.Literal.Number>,
  ) {
    super();

    this.value = parseInt(token.code.replaceAll("_", ""));
  }
}

export class CstBooleanLiteral extends CstLiteral {
  readonly value: boolean;

  constructor(
    readonly token: Token<Tokens.Literal.Boolean>,
  ) {
    super();
    this.value = token.is(Tokens.Literal.Boolean.True) ? true : false;
  }
}

export class CstStringLiteral extends CstLiteral {
  readonly value: string;

  constructor(
    readonly token: Token<Tokens.Literal.String.Text>,
  ) {
    super();
    this.value = token.code;
  }
}

export class CstStringTemplate extends CstLiteral {
  constructor(
    readonly items: readonly (CstStringTemplateText | CstExpression)[],
  ) {
    super();
  }
}

export class CstStringTemplateText extends CstExpression {
  constructor(
    readonly token: Token<Tokens.Literal.String.Text>,
  ) {
    super();
  }
}

export class CstStringTemplateVariable extends CstExpression {
  constructor(
    readonly token: Token<Tokens.Identifier>,
  ) {
    super();
  }
}
