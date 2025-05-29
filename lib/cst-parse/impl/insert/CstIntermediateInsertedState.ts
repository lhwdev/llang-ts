import type { CstNode } from "../../../cst/CstNode.ts";
import type { CstImplicitNode, CstInsertedNode } from "../../CstSpecialNode.ts";
import type { CstGroup } from "../../tree/CstGroup.ts";
import { CstIntermediateStateImpl } from "../CstIntermediateStateImpl.ts";

export class CstIntermediateInsertedState<Node extends CstNode>
  extends CstIntermediateStateImpl<CstInsertedNode<Node>, typeof CstInsertedNode<Node>> {
  override reportImplicitNode(node: CstImplicitNode): void {
    // only exists for override
  }

  insertNode(source: Node): Node {
  }

  protected override createGroup(
    node: CstInsertedNode<Node>,
  ): CstGroup<CstInsertedNode<Node>, typeof CstInsertedNode<Node>> {
    return new CstInsertedGroup_(node);
  }
}
