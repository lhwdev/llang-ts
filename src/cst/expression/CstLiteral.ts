import type { Token } from "../../token/Token.ts";
import { Tokens } from "../../token/Tokens.ts";
import { CstExpression } from "./CstExpression.ts";

export abstract class CstLiteral extends CstExpression {
  declare private $literal: void;
}

export abstract class CstConstLiteral extends CstLiteral {
  declare private $constLiteral: void;
}

/// Const literals

export class CstNumberLiteral extends CstConstLiteral {
  declare private $numberLiteral: void;
  readonly value: number;

  constructor(
    readonly token: Token<Tokens.Literal.Number>,
  ) {
    super();

    this.value = parseInt(token.code.replaceAll("_", ""));
  }
}

export class CstBooleanLiteral extends CstConstLiteral {
  declare private $booleanLiteral: void;
  readonly value: boolean;

  constructor(
    readonly token: Token<Tokens.Literal.Boolean>,
  ) {
    super();
    this.value = token.is(Tokens.Literal.Boolean.True) ? true : false;
  }
}

export class CstStringLiteral extends CstConstLiteral {
  declare private $stringLiteral: void;
  readonly value: string;

  constructor(
    readonly items: CstStringTemplateText[],
  ) {
    super();
    this.value = items.map((item) => {
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
  }
}

/// String template literal

export class CstStringTemplate extends CstLiteral {
  declare private $stringTemplate: void;

  constructor(
    readonly items: readonly CstStringTemplateItem[],
  ) {
    super();
  }
}

export abstract class CstStringTemplateItem extends CstExpression {
  declare private $stringTemplateItem: void;
}

export class CstStringTemplateText extends CstStringTemplateItem {
  declare private $stringTemplateText: void;
  constructor(
    readonly token: Token<Tokens.Literal.String.Text>,
  ) {
    super();
  }
}

export class CstStringTemplateVariable extends CstStringTemplateItem {
  declare private $stringTemplateVariable: void;

  constructor(
    readonly token: Token<Tokens.Identifier>,
  ) {
    super();
  }
}

export class CstStringTemplateExpression extends CstStringTemplateItem {
  declare private $stringTemplateExpression: void;

  constructor(
    readonly token: Token<Tokens.Identifier>,
  ) {
    super();
  }
}
