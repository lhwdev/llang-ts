import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import type { CstIntermediateItem } from "../intermediate/CstIntermediateGroup.ts";
import type { CstIntermediateBehavior } from "./CstIntermediateBehavior.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import { CstIntermediateGroupImpl } from "./CstIntermediateGroupImpl.ts";
import { CstIntermediateSlots } from "./CstIntermediateSlots.ts";
import { CstIntermediateState } from "./CstIntermediateState.ts";
import { CstIntermediateType } from "./CstIntermediateType.ts";
import { CstParseIntrinsicsImpl } from "./CstParseIntrinsicsImpl.ts";

export class CstIntermediateItems<out Node extends CstNode> {
  constructor(
    protected readonly behavior: CstIntermediateBehavior,
    protected value: CstIntermediateItem[] = [],
  ) {}

  get(): readonly CstIntermediateItem[] {
    return this.value;
  }

  protected findChildType<Info extends CstNodeInfo<any>>(_info: Info): CstIntermediateType<Info> {
    return CstIntermediateType.Default as any;
  }

  protected findSpecialChildType<Info extends CstNodeInfo<any>>(
    info: Info,
  ): CstIntermediateType<Info> {
    return this.behavior.findSpecialChildType(info);
  }

  beginChild<Info extends CstNodeInfo<any>>(
    parent: CstIntermediateGroupBase<any>,
    info: Info,
  ): CstIntermediateGroupBase<InstanceType<Info>, Info> {
    const type = this.findChildType(info);
    const startOffset = parent.state.offset;
    const meta = type.createMetadata(parent, info, startOffset);
    const state = new CstIntermediateState<InstanceType<Info>>(
      new CstIntermediateItems(parent.state.items.behavior),
      new CstIntermediateSlots(),
      startOffset,
    );
    const intrinsics = CstParseIntrinsicsImpl.create(info, meta, state);
    return new CstIntermediateGroupImpl(meta, state, intrinsics);
  }

  beginSpecialChild<Info extends CstSpecialNodeInfo<any>>(
    parent: CstIntermediateGroupBase<any>,
    info: Info,
    skipImplicit?: "IDK",
  ): CstIntermediateGroupBase<InstanceType<Info>, Info>;

  skipCurrent(): CstNode | null;

  beforeEnd(node: Node): CstTree<Node>;

  end(node: Node): Node;
  endWithError(error: unknown | null): Node | null;
}
