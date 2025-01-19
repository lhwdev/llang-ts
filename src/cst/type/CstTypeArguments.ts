import type { Token } from "../../token/Token.ts";
import type { Tokens } from "../../token/Tokens.ts";
import { CstNode } from "../CstNode.ts";
import type { CstType } from "./CstType.ts";

export class CstTypeArguments extends CstNode {
  declare private $typeArguments: void;

  constructor(
    readonly items: readonly [name: Token<Tokens.Identifier> | null, value: CstType][],
  ) {
    super();
  }

  get(name: string): CstType | null;
  get(index: number): CstType | null;
  get(index: string | number): CstType | null {
    if (typeof index === "number") {
      return this.items.at(index)?.[1] ?? null;
    } else {
      for (const [key, value] of this.items) {
        if (key?.code === index) return value;
      }
      return null;
    }
  }
}
