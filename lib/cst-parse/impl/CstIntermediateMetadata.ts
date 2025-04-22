import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstProvidableContextLocalMap } from "../intermediate/CstContextLocal.ts";
import type { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";
import { CstProvidableContextLocalMapImpl } from "./CstProvidableContextLocalMapImpl.ts";

export abstract class CstIntermediateMetadata<Info extends CstNodeInfo<any>> {
  contextMap: CstProvidableContextLocalMap;

  constructor(
    readonly parent: CstIntermediateGroup<any>,
    readonly info: Info,
    readonly startOffset: number,
  ) {
    this.contextMap = new CstProvidableContextLocalMapImpl(this.parent.contextMap.source);
  }

  abstract readonly type: CstIntermediateType<Info>;

  static defaultFactory<Info extends CstNodeInfo<any>>(type: CstIntermediateType<Info>) {
    return class extends CstIntermediateMetadata<Info> {
      override get type(): CstIntermediateType<Info> {
        return type;
      }
    };
  }
}
