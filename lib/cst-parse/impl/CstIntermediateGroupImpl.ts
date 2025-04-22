import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { CstProvidableContextLocalMap } from "../intermediate/CstContextLocal.ts";
import type { CstParseIntrinsics } from "../intermediate/CstParseIntrinsics.ts";
import type { CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import type {
  CstIntermediateGroup,
  CstIntermediateItem,
} from "../intermediate/CstIntermediateGroup.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";
import { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";

export class CstIntermediateGroupImpl<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> extends CstIntermediateGroupBase<Node, Info> {
  constructor(
    override readonly meta: CstIntermediateMetadata<Info>,
    override readonly state: CstIntermediateState<Node>,
    override readonly intrinsics: CstParseIntrinsics<Info>, // TODO: better location?
  ) {
    super();
  }

  ///// Implementations

  override get parent(): CstIntermediateGroup<any> {
    return this.meta.parent;
  }

  override get type(): CstIntermediateType<Info> {
    return this.meta.type;
  }

  override get info(): Info {
    return this.meta.info;
  }

  override get contextMap(): CstProvidableContextLocalMap {
    return this.meta.contextMap;
  }

  override get items(): readonly CstIntermediateItem[] {
    return this.state.items.get();
  }

  override get currentOffset(): number {
    return this.state.offset;
  }

  /// Slots

  override nextSlot(): unknown {
    return this.state.slots.nextSlot();
  }

  override updateSlot<T>(value: T): T {
    return this.state.slots.updateSlot(value);
  }

  /// Building

  override beginChild<Info extends CstNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info> {
    return this.state.items.beginChild(this, info);
  }

  override beginSpecialChild<Info extends CstSpecialNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info> {
    return this.state.items.beginSpecialChild(this, info);
  }

  override skipCurrent(): CstNode | null {
    return this.state.items.skipCurrent();
  }

  override beforeEnd(node: Node): CstTree<Node> {
    return this.state.items.beforeEnd(node);
  }

  override end(node: Node): Node {
    return this.state.items.end(node);
  }

  override endWithError(error: unknown | null): Node | null {
    return this.state.items.endWithError(error);
  }

  override getParentForEnd(): CstIntermediateGroup<any> {
    return this.parent;
  }
}
