import type { CstNode } from "../../cst/CstNode.ts";
import { CstGroup } from "./CstGroup.ts";

export class CstPeekGroup<Node extends CstNode> extends CstGroup<Node> {
  override get isRead(): boolean {
    return false;
  }

  override get isAttached(): boolean {
    return false;
  }
}
