import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstProvidableContextLocalMap } from "../intermediate/CstContextLocal.ts";
import { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import type { CstGroupItem } from "../tree/CstGroup.ts";
import type { CstIntermediateDebugImpl } from "./CstIntermediateDebugImpl.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";

export abstract class CstIntermediateGroupBase<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> extends CstIntermediateGroup<Node, Info> {
  abstract readonly meta: CstIntermediateMetadata<Info>;
  abstract readonly state: CstIntermediateState<Node, Info>;

  override get parent(): CstIntermediateGroupBase<any> {
    return this.meta.parent;
  }

  override get info(): Info {
    return this.meta.info;
  }

  override get contextMap(): CstProvidableContextLocalMap {
    return this.meta.contextMap;
  }

  override get items(): readonly CstGroupItem[] {
    return this.state.items.get();
  }

  asType<Type extends CstIntermediateType<ChildInfo>, ChildInfo extends Info>(
    type: Type,
  ):
    & this
    & CstIntermediateGroupBase<
      InstanceType<ChildInfo>,
      ChildInfo & CstNodeInfo<InstanceType<ChildInfo>>
    >
    & { meta: Type["MetadataType"]; state: Type["StateType"] } {
    if (this.type === type) return this as any;

    throw new TypeError();
  }

  abstract override getParentForEnd(): CstIntermediateGroupBase<any>;

  abstract override debug?: CstIntermediateDebugImpl | undefined;
}
