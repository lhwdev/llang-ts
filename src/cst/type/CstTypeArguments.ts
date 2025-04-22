import type { Token } from "../../../lib/token/Token.ts";
import type { Tokens } from "../../token/Tokens.ts";
import { CstNode } from "../../../lib/cst/CstNode.ts";
import type { CstList } from "../../../lib/cst/CstList.ts";
import type { CstType } from "./CstType.ts";

export class CstTypeArguments extends CstNode {
  declare private $typeArguments: void;

  constructor(
    readonly items: CstList<CstTypeArgumentItem>,
  ) {
    super();
  }

  get(name: string): CstType | null;
  get(index: number): CstType | null;
  get(index: string | number): CstType | null {
    if (typeof index === "number") {
      return this.items.at(index)?.value ?? null;
    } else {
      for (const { name, value } of this.items) {
        if (name?.code === index) return value;
      }
      return null;
    }
  }
}

export class CstTypeArgumentItem extends CstNode {
  constructor(readonly name: Token<Tokens.Identifier> | null, readonly value: CstType) {
    super();
  }
}
