import type { CstNode } from "../../cst/CstNode.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import { CstGroup } from "./CstGroup.ts";

export class CstInsertedGroup<Node extends CstNode> extends CstGroup<Node> {
  _source!: CstTree<Node>;

  override get source(): CstTree<Node> {
    return this._source;
  }
}

export class CstInsertedGroupRoot<Node extends CstNode> extends CstInsertedGroup<Node> {}
