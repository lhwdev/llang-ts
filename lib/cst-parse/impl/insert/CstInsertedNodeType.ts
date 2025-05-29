import type { CstNode } from "../../../cst/CstNode.ts";
import { type CstImplicitNode, CstInsertedNode } from "../../CstSpecialNode.ts";
import type { CstParseIntrinsics } from "../../intermediate/CstParseIntrinsics.ts";
import type { CstIntermediateGroupBase } from "../CstIntermediateGroupBase.ts";
import type { CstIntermediateState } from "../CstIntermediateState.ts";
import { CstIntermediateTypeImpl } from "../CstIntermediateTypeImpl.ts";
import { CstParseIntrinsicsImpl } from "../CstParseIntrinsicsImpl.ts";
import { CstIntermediateInsertedItems } from "./CstIntermediateInsertedItems.ts";
import { CstIntermediateInsertedState } from "./CstIntermediateInsertedState.ts";
import { CstRestoredImplicitNode } from "./CstRestoredImplicitNode.ts";

export class CstInsertedNodeType<Node extends CstNode>
  extends CstIntermediateTypeImpl<typeof CstInsertedNode<Node>> {
  static Instance = new CstInsertedNodeType(CstInsertedNode<any>);

  override handleImplicitPrefix(
    self: CstIntermediateGroupBase<any>,
    implicitFn: () => CstNode | null,
    info: typeof CstInsertedNode,
  ): CstImplicitNode | null {
    const result = super.handleImplicitPrefix(self, implicitFn, info);
    if (result) {
      return result.map((n) => new CstRestoredImplicitNode(n.node, implicitFn));
    } else {
      return null;
    }
  }

  override createIntermediateState(
    meta: this["MetadataType"],
    parentState: CstIntermediateState<any>,
  ): CstIntermediateInsertedState<Node> {
    return new CstIntermediateInsertedState<Node>(
      parentState,
      meta,
      new CstIntermediateInsertedItems(meta),
    );
  }

  override createIntrinsics(
    info: typeof CstInsertedNode<Node>,
    meta: this["MetadataType"],
    state: CstIntermediateInsertedState<Node>,
  ): CstParseIntrinsics<typeof CstInsertedNode<Node>> {
    return CstParseIntrinsicsImpl.create(info, meta, state, {
      insertNode(node) {
        return state.insertNode(node as any) as any;
      },
    });
  }
}
