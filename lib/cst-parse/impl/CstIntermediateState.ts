import type { CstNode } from "../../cst/CstNode.ts";
import type { CstIntermediateItems } from "./CstIntermediateItems.ts";
import type { CstIntermediateSlots } from "./CstIntermediateSlots.ts";

export class CstIntermediateState<out Node extends CstNode> {
  protected _offset: number;

  constructor(
    readonly items: CstIntermediateItems<Node>,
    readonly slots: CstIntermediateSlots,
    startOffset: number,
  ) {
    this._offset = startOffset;
  }

  get offset() {
    return this._offset;
  }
}
