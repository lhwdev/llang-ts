import { CstNode } from "../cst-parse/CstNode.ts";
import type { Token } from "../token/Token.ts";

export class CstLeaf extends CstNode {
  constructor(readonly token: Token) {
    super();
  }
}
