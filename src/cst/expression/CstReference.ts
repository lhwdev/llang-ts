import type { Token } from "../../../lib/token/Token.ts";
import type { Tokens } from "../../token/Tokens.ts";
import { CstExpression } from "./CstExpression.ts";

export class CstReference extends CstExpression {
  declare private $reference: void;

  constructor(readonly name: Token<Tokens.Identifier>) {
    super();
  }
}
