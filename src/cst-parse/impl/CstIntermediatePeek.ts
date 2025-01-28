import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstGroup } from "./CstGroup.ts";
import { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";
import { CstPeekGroup } from "./CstPeekGroup.ts";

export class CstIntermediatePeek extends CstIntermediateGroup {
  constructor(parent: CstIntermediateGroup, info: CstNodeInfo<any>) {
    super(parent, info);
    this.ensureSnapshotExists();
  }

  protected override createChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    return new CstIntermediateNode(this, info);
  }

  protected override createGroup<Node extends CstNode>(node: Node): CstGroup<Node> {
    return new CstPeekGroup(this, node);
  }

  override end<Node extends CstNode>(node: Node): Node {
    this.c.restore(this.snapshot!);
    return super.end(node);
  }

  protected override endSelf(_group: CstGroup): void {
    // do nothing
  }
}
