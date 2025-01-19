import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstGroup } from "./CstGroup.ts";
import { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

export class CstIntermediateNode extends CstIntermediateGroup {
  override createChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    return new CstIntermediateNode(this, info);
  }

  override createGroup<Node extends CstNode>(node: Node): CstGroup<Node> {
    throw new Error("Method not implemented.");
  }
}
