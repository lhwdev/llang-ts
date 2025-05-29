import type { CstNode } from "../../../cst/CstNode.ts";
import { CstImplicitNode } from "../../CstSpecialNode.ts";

export class CstRestoredImplicitNode extends CstImplicitNode {
  constructor(node: CstNode, readonly implicitFn: () => CstNode | null) {
    super(node);
  }
}
