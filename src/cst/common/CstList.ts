import { CstNode } from "../CstNode.ts";
import type { CstReadonlyArray } from "../CstArray.ts";

export class CstList<Item extends CstNode> extends CstNode {
  constructor(readonly items: CstReadonlyArray<Item>) {
    super();
  }
}
