import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { CstParseIntrinsics } from "../intermediate/CstParseIntrinsics.ts";
import type { CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import type { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";
import type { CstIntermediateDebugImpl } from "./CstIntermediateDebugImpl.ts";

export class CstIntermediateGroupImpl<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> extends CstIntermediateGroupBase<Node, Info> {
  constructor(
    override readonly meta: CstIntermediateMetadata<Info>,
    override readonly state: CstIntermediateState<Node, Info>,
    override readonly intrinsics: CstParseIntrinsics<Info>, // TODO: better location?
  ) {
    super();
  }

  ///// Implementations

  override get type(): CstIntermediateType<Info> {
    return this.meta.type;
  }

  override get offset(): number {
    return this.state.offset;
  }

  override hintIsCurrent(isCurrent: boolean, isBegin: boolean): void {
    this.state.hintIsCurrent(isCurrent, isBegin);
  }

  /// Slots

  override nextSlot(): unknown {
    return this.state.slots.nextSlot();
  }

  override updateSlot<T>(value: T): T {
    return this.state.slots.updateSlot(value);
  }

  /// Building

  override beginChild<ChildInfo extends CstNodeInfo<any>>(
    info: ChildInfo,
  ): CstIntermediateGroup<InstanceType<ChildInfo>, ChildInfo> {
    return this.state.beginChild(this, info);
  }

  override beginSpecialChild<ChildInfo extends CstSpecialNodeInfo<any>>(
    info: ChildInfo,
  ): CstIntermediateGroup<InstanceType<ChildInfo>, ChildInfo> {
    return this.state.beginSpecialChild(this, info);
  }

  override skipCurrent(): Node | null {
    return this.state.skipCurrent();
  }

  override beforeEnd(node: Node): CstTree<Node> {
    return this.state.beforeEnd(node);
  }

  override end(node: Node): Node {
    return this.state.end(this, node);
  }

  override endWithError(error: unknown | null): Node | null {
    return this.state.endWithError(this, error);
  }

  override getParentForEnd(): CstIntermediateGroupBase<any> {
    return this.parent;
  }

  override get debug(): CstIntermediateDebugImpl | undefined {
    return this.state.debug;
  }
}
