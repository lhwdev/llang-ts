import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";

export interface CstIntermediateBehavior {
  findSpecialChildType<Info extends CstNodeInfo<any>>(info: Info): CstIntermediateType<Info>;
}
