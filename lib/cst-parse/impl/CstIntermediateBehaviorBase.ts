// deno-lint-ignore-file no-unused-vars
import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstImplicitNode, CstInsertedNode, CstPeekNode } from "../CstSpecialNode.ts";
import type { CstParseIntrinsics } from "../intermediate/CstParseIntrinsics.ts";
import type { CstIntermediateBehavior } from "./CstIntermediateBehavior.ts";
import type { CstIntermediateDebug } from "../intermediate/CstIntermediateDebug.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import { CstIntermediateGroupImpl } from "./CstIntermediateGroupImpl.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";
import { CstImplicitNodeType } from "./implicit/CstImplicitNodeType.ts";
import { CstInsertedNodeType } from "./insert/CstInsertedNodeType.ts";
import { CstPeekNodeType } from "./peek/CstPeekNodeType.ts";

export abstract class CstIntermediateBehaviorBase implements CstIntermediateBehavior {
  abstract readonly enableDebug?: boolean;

  abstract readonly defaultChildType: CstIntermediateType<any>;

  findSpecialChildType<Info extends CstNodeInfo<any>>(info: Info): CstIntermediateType<Info> {
    switch (info as CstNodeInfo<any>) {
      case CstImplicitNode:
        return CstImplicitNodeType.Instance as any;
      case CstPeekNode:
        return CstPeekNodeType.Instance as any;
      case CstInsertedNode:
        return CstInsertedNodeType.Instance as any;
      default:
        throw new Error(`unknown special node ${info.name}`);
    }
  }

  onBeginGroup(saved: boolean): void {}
  onEndGroup(): void {}
  onDiscardGroup(): void {}
  onEndGroupForError(): void {}

  createIntermediateGroup<Node extends CstNode, Info extends CstNodeInfo<Node> = CstNodeInfo<Node>>(
    meta: CstIntermediateMetadata<Info>,
    state: CstIntermediateState<Node, Info>,
    intrinsics: CstParseIntrinsics<Info>,
  ): CstIntermediateGroupBase<Node, Info> {
    return new CstIntermediateGroupImpl(meta, state, intrinsics);
  }
}
