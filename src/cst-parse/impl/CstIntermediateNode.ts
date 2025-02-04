import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstConcreteGroup } from "./CstConcreteGroup.ts";
import type { CstGroup } from "./CstGroup.ts";
import { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

/**
 * This class works as a placeholder; when calling
 * CstIntermediateGroup.childInstance, it may find
 * {@link CstIntermediateNode} in prototype chain and replace it with arbitrary
 * class.
 */
export class CstIntermediateNode extends CstIntermediateGroup {
  protected override createChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    return new (this.childInstance(CstIntermediateNode))(this, info);
  }

  protected override createGroup<Node extends CstNode>(node: Node): CstGroup<Node> {
    return new CstConcreteGroup(this, node);
  }
}
