import { CstImplicitNode } from "../../CstSpecialNode.ts";
import { CstIntermediateTypeImpl } from "../CstIntermediateTypeImpl.ts";

export class CstImplicitNodeType extends CstIntermediateTypeImpl<typeof CstImplicitNode> {
  static Instance = new CstImplicitNodeType(CstImplicitNode);

  override handleImplicitPrefix(): CstImplicitNode | null {
    return null;
  }

  override get isExplicit(): boolean {
    return false;
  }

  // override createIntermediateState -> createGroup
}
