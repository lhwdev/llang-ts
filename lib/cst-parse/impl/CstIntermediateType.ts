import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstImplicitNode } from "../CstSpecialNode.ts";
import { CstNodeType } from "../intermediate/CstNodeType.ts";
import type { CstParseIntrinsics } from "../intermediate/CstParseIntrinsics.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";

export abstract class CstIntermediateType<out Info extends CstNodeInfo<any>>
  extends CstNodeType<Info> {
  declare MetadataType: ReturnType<this["createMetadata"]>;
  declare StateType: ReturnType<this["createIntermediateState"]>;

  handleImplicitPrefix(
    self: CstIntermediateGroupBase<any>,
    implicitFn: () => CstNode | null,
    // deno-lint-ignore no-unused-vars
    info: Info,
  ): CstImplicitNode | null {
    return self.beginSpecialChild(CstImplicitNode).buildNullableNode(() => {
      const result = implicitFn();
      return result ? new CstImplicitNode(result) : null;
    });
  }

  get isExplicit(): boolean {
    return true;
  }

  get isRestorable(): boolean {
    return false;
  }

  abstract createMetadata(
    parent: CstIntermediateGroupBase<any>,
    info: Info,
  ): CstIntermediateMetadata<Info>;

  abstract createIntermediateState(
    meta: this["MetadataType"],
    parentState: CstIntermediateState<any>,
  ): CstIntermediateState<InstanceType<Info>, Info>;

  abstract createIntrinsics(
    info: Info,
    meta: this["MetadataType"],
    state: this["StateType"],
  ): CstParseIntrinsics<Info>;
}
