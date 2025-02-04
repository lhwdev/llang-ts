import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstGroup } from "./CstGroup.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";
import { CstPeekGroup } from "./CstPeekGroup.ts";

export class CstIntermediatePeek extends CstIntermediateNode {
  constructor(parent: CstIntermediateGroup, info: CstNodeInfo<any>) {
    super(parent, info);

    this.ensureSnapshotExists();
    this.allowImplicit = parent.allowImplicit;
  }

  protected override createChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    return new (this.childInstance(CstIntermediateNode))(this, info);
  }

  protected override createGroup<Node extends CstNode>(node: Node): CstGroup<Node> {
    return new CstPeekGroup(this, node);
  }

  override end<Node extends CstNode>(node: Node): Node {
    this.restoreToPrevious();
    return super.end(node);
  }

  protected override endSelf(_group: CstGroup): void {
    // do nothing
  }
}
