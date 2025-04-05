import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";
import type { CstList } from "../CstList.ts";
import { CstExpression } from "./CstExpression.ts";

export abstract class CstLiteral extends CstExpression {
  declare private $literal: void;

  abstract readonly isConst: boolean;
}

/// Const literals

export class CstNumberLiteral extends CstLiteral {
  declare private $numberLiteral: void;
  readonly value: number;

  constructor(
    readonly token: Token<Tokens.Literal.Number>,
  ) {
    super();

    this.value = parseInt(token.code.replaceAll("_", ""));
  }

  override get isConst(): boolean {
    return true;
  }
}

export class CstBooleanLiteral extends CstLiteral {
  declare private $booleanLiteral: void;
  readonly value: boolean;

  constructor(
    readonly token: Token<Tokens.Literal.Boolean>,
  ) {
    super();
    this.value = token.is(Tokens.Literal.Boolean.True) ? true : false;
  }

  override get isConst(): boolean {
    return true;
  }
}

export class CstStringLiteral extends CstLiteral {
  declare private $stringLiteral: void;

  constructor(
    readonly left: Token<Tokens.Literal.String.Left>,
    readonly items: CstList<CstStringLiteralItem>,
    readonly right: Token<Tokens.Literal.String.Right>,
    readonly value: string | null,
  ) {
    super();
  }

  get isConst(): boolean {
    return this.value !== null;
  }

  static from(
    left: Token<Tokens.Literal.String.Left>,
    items: CstList<CstStringLiteralItem>,
    right: Token<Tokens.Literal.String.Right>,
  ) {
    if (!items.every((item) => item instanceof CstStringLiteralText)) {
      return new CstStringLiteral(left, items, right, null);
    }

    const value = items.map((item) => {
      const token = item.token;
      if (token.is(Tokens.Literal.String.Escape)) {
        const mapping = {
          "\\0": "\0",
          "\\n": "\n",
          "\\r": "\r",
          "\\v": "\v",
          "\\t": "\t",
          "\\b": "\b",
          "\\f": "\f",
          "\\$": "$",
          '\\"': '"',
          "\\\\": "\\",
        } as Record<string, string>;
        const c = token.code;
        if (c.startsWith("\\x")) {
          return String.fromCodePoint(parseInt(c.slice(2), 16));
        }
        if (c.startsWith("\\u")) {
          return String.fromCodePoint(parseInt(c.slice(2), 16));
        }
        const mapped = mapping[c];
        if (mapped) return mapped;
      } else {
        return token.code;
      }
    }).join("");
    return new CstStringLiteral(left, items, right, value);
  }
}

export abstract class CstStringLiteralItem extends CstExpression {
  declare private $stringTemplateItem: void;
}

export class CstStringLiteralText extends CstStringLiteralItem {
  declare private $stringTemplateText: void;
  constructor(
    readonly token: Token<Tokens.Literal.String.Text>,
  ) {
    super();
  }
}

export class CstStringTemplateVariable extends CstStringLiteralItem {
  declare private $stringTemplateVariable: void;

  constructor(
    readonly token: Token<Tokens.Identifier>,
  ) {
    super();
  }
}

export class CstStringTemplateExpression extends CstStringLiteralItem {
  declare private $stringTemplateExpression: void;

  constructor(
    readonly token: Token<Tokens.Identifier>,
  ) {
    super();
  }
}
