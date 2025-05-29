import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { Token } from "../../token/Token.ts";
import type { CstImplicitNode, CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import type { CstGroup } from "../tree/CstGroup.ts";
import type { CstIntermediateDebugImpl } from "./CstIntermediateDebugImpl.ts";
import type { CstIntermediateFlags } from "./CstIntermediateFlags.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import type { CstErrorResult, CstIntermediateItems } from "./CstIntermediateItems.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateSlots } from "./CstIntermediateSlots.ts";

export abstract class CstIntermediateState<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> {
  abstract readonly parentState: CstIntermediateState<any>;
  abstract readonly meta: CstIntermediateMetadata<any>;
  abstract readonly items: CstIntermediateItems;
  abstract readonly slots: CstIntermediateSlots;

  abstract readonly group: CstGroup<Node, Info> | null;
  abstract readonly error?: CstErrorResult;

  abstract readonly flags?: CstIntermediateFlags;

  abstract readonly offset: number;

  abstract readonly isExplicitNode: boolean;

  abstract hintIsCurrent(isCurrent: boolean, isBegin: boolean): void;

  abstract ensureInitialized(): void;

  // deno-lint-ignore no-unused-vars
  reportImplicitNode(node: CstImplicitNode): void {
    // only exists for override
  }

  /// Children Management

  abstract beginChild<ChildInfo extends CstNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: ChildInfo,
  ): CstIntermediateGroupBase<InstanceType<ChildInfo>, ChildInfo>;

  abstract beginSpecialChild<ChildInfo extends CstSpecialNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: ChildInfo,
  ): CstIntermediateGroupBase<InstanceType<ChildInfo>, ChildInfo>;

  abstract endChild<Node extends CstNode>(
    child: CstIntermediateGroupBase<Node>,
    result: CstGroup<Node> | CstErrorResult,
  ): void;

  abstract reportToken(token: Token): void;

  /// Current Group

  abstract skipCurrent(): Node | null;

  abstract beforeEnd(node: Node): CstGroup<Node, Info>;

  abstract end(
    self: CstIntermediateGroupBase<Node, Info>,
    node: Node,
  ): Node;

  abstract endWithError(
    self: CstIntermediateGroupBase<Node, Info>,
    error: unknown | null,
  ): Node | null;

  abstract debug?: CstIntermediateDebugImpl;
}
