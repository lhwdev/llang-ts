import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { isInherited } from "../../utils/extends.ts";

export abstract class CstNodeType<Info extends CstNodeInfo<any>> {
  declare private $nodeType: void;

  constructor(readonly baseInfo: Info) {}

  isType<Other extends CstNodeInfo<any>>(
    type: CstNodeType<Other> | Other,
  ): this is CstNodeType<Other> {
    if (type instanceof CstNodeType) {
      return isInherited(type.baseInfo, this.baseInfo);
    } else {
      return isInherited(type, this.baseInfo);
    }
  }
}
