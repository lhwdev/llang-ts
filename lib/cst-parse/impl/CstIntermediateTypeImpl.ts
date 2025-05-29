import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstParseIntrinsics } from "../intermediate/CstParseIntrinsics.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import { CstIntermediateItems } from "./CstIntermediateItems.ts";
import { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import { CstIntermediateStateImpl } from "./CstIntermediateStateImpl.ts";
import { CstIntermediateType } from "./CstIntermediateType.ts";
import { CstParseIntrinsicsImpl } from "./CstParseIntrinsicsImpl.ts";

export class CstIntermediateTypeImpl<out Info extends CstNodeInfo<any>>
  extends CstIntermediateType<Info> {
  createMetadata(
    parent: CstIntermediateGroupBase<any>,
    info: Info,
  ): CstIntermediateMetadata<Info> {
    return new CstIntermediateMetadata(parent, this, info);
  }

  createIntermediateState(
    meta: this["MetadataType"],
    parentState: CstIntermediateState<any>,
  ): CstIntermediateState<InstanceType<Info>, Info> {
    return new CstIntermediateStateImpl(parentState, meta, new CstIntermediateItems(meta));
  }

  createIntrinsics(
    info: Info,
    meta: this["MetadataType"],
    state: this["StateType"],
  ): CstParseIntrinsics<Info> {
    return CstParseIntrinsicsImpl.create(info, meta, state);
  }
}
