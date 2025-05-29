import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstParseIntrinsics } from "../intermediate/CstParseIntrinsics.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";

export interface CstIntermediateBehavior {
  readonly defaultChildType: CstIntermediateType<any>;

  findSpecialChildType<Info extends CstNodeInfo<any>>(info: Info): CstIntermediateType<Info>;

  onBeginGroup(saved: boolean): void;

  onEndGroup(): void;
  onDiscardGroup(): void;
  onEndGroupForError(): void;

  createIntermediateGroup<
    Node extends CstNode,
    Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
  >(
    meta: CstIntermediateMetadata<Info>,
    state: CstIntermediateState<Node, Info>,
    intrinsics: CstParseIntrinsics<Info>,
  ): CstIntermediateGroupBase<Node, Info>;

  enableDebug?: boolean;
}
