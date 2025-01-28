import type { Token } from "../../token/Token.ts";
import type { Tokens } from "../../token/Tokens.ts";
import type { CstReadonlyArray } from "../CstArray.ts";
import { CstType } from "./CstType.ts";
import type { CstTypeArguments } from "./CstTypeArguments.ts";

export class CstNamedType extends CstType {
  declare private $namedType: void;

  constructor(
    readonly names: CstReadonlyArray<Token<Tokens.Identifier>>,
    readonly typeArguments: CstTypeArguments | null,
  ) {
    super();
  }
}
