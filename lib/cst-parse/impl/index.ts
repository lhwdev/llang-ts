import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import { CstIntermediateGroupImpl } from "./CstIntermediateGroupImpl.ts";
import { CstIntermediateItems } from "./CstIntermediateItems.ts";
import type { CstIntermediateBehavior } from "./CstIntermediateBehavior.ts";
import { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import { CstIntermediateSlots } from "./CstIntermediateSlots.ts";
import { CstIntermediateState } from "./CstIntermediateState.ts";
import { CstParseIntrinsicsImpl } from "./CstParseIntrinsicsImpl.ts";

export function createIntermediateGroup<
  Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
>(parent: CstIntermediateGroup<any>, info: Info) {
  const behavior: CstIntermediateBehavior = {
    findSpecialChildType(info) {
      throw new Error("TODO");
    },
  };
  const startOffset = parent.currentOffset;
  const meta = new CstIntermediateMetadata(
    parent,
    info,
    startOffset,
  );
  const state = new CstIntermediateState(
    new CstIntermediateItems(behavior),
    new CstIntermediateSlots(),
    startOffset,
  );
  return new CstIntermediateGroupImpl(
    meta,
    state,
    CstParseIntrinsicsImpl.create(info, meta, state),
  );
}
