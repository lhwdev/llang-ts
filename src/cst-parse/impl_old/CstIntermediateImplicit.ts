import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { ContextKeys } from "../CstParseContext.ts";
import type { CstGroup } from "./CstGroup.ts";
import { CstImplicitGroup } from "./CstImplicitGroup.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";

export class CstIntermediateImplicit extends CstIntermediateNode {
  constructor(parent: CstIntermediateGroup, info: CstNodeInfo<any>) {
    super(parent, info);

    this.provideContext(ContextKeys.IsImplicit.provides(true));
  }

  protected override createGroup<Node extends CstNode>(node: Node): CstGroup<Node> {
    return new CstImplicitGroup(this, node);
  }
}
