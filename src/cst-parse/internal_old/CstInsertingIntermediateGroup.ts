import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

export class CstInsertingIntermediateGroup extends CstIntermediateGroup {
  override createChild(info: CstNodeInfo<any>, offset: number): CstIntermediateGroup {
    return new CstInsertingIntermediateGroup(this, info, offset);
  }
}
