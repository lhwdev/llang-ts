import type { CstNode } from "../../cst/CstNode.ts";
import { CstRootNode } from "../../cst/CstRootNode.ts";
import type { CstGroup } from "./CstGroup.ts";
import { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";

export class CstRootGroup extends CstIntermediateGroup {
  constructor() {
    super({} as CstIntermediateGroup, CstRootNode, 0);
    this.parent = this;
  }

  protected illegalOnRoot(): never {
    throw new Error("trying to insert child into root group");
  }

  override beforeEnd(_node: CstNode): CstGroup {
    this.illegalOnRoot();
  }

  override end(_node: CstNode): CstGroup {
    this.illegalOnRoot();
  }
}
