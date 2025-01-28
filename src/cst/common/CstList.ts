import { CstNode } from "../CstNode.ts";
import type { CstReadonlyArray } from "../CstArray.ts";
import type { CstNodeConstructor } from "../CstNodeInfo.ts";

export interface CstList<Item extends CstNode> extends CstNode {
  readonly items: CstReadonlyArray<Item>;
}

export function CstList<Item extends CstNode>(
  _itemType: CstNodeConstructor<Item>,
): CstNodeConstructor<CstList<Item>, [items: CstReadonlyArray<Item>]> {
  const info = class extends CstNode {
    constructor(readonly items: CstReadonlyArray<Item>) {
      super();
    }
  };
  Object.defineProperty(info, "name", { value: `CstList<${_itemType.name}>` });
  return info;
}
