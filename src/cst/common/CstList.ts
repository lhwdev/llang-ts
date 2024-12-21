import { CstNode } from "../CstNode.ts";
import type { CstNodeConstructor } from "../CstNodeInfo.ts";

export interface CstList<Item extends CstNode> extends CstNode {
  readonly items: Item[];
}

export function CstList<Item extends CstNode>(
  _itemType: CstNodeConstructor<Item>,
): CstNodeConstructor<CstList<Item>, [items: Item[]]> {
  return class extends CstNode {
    constructor(readonly items: Item[]) {
      super();
    }
  };
}
