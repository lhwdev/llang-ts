import type { CstNode } from "./CstNode.ts";

export interface CstNodeInfo<out Node extends CstNode> {
  new (...args: any): Node;
}
