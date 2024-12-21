import type { Token } from "../../token/Token.ts";
import type { Tokens } from "../../token/Tokens.ts";
import { CstType } from "./CstType.ts";
import type { CstTypeArguments } from "./CstTypeArguments.ts";

export class CstNamedType extends CstType {
  constructor(
    readonly names: Token<Tokens.Identifier>[],
    readonly typeArguments: CstTypeArguments | null,
  ) {
    super();
  }
}
