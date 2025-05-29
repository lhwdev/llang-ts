import type { CstNode } from "../../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../../cst/CstNodeInfo.ts";
import { fmt } from "../../../utils/format.ts";
import type { CstSpecialNodeInfo } from "../../CstSpecialNode.ts";
import type { CstGroup } from "../../tree/CstGroup.ts";
import { CstIntermediateDebugImpl } from "../CstIntermediateDebugImpl.ts";
import type { CstIntermediateFlags } from "../CstIntermediateFlags.ts";
import type { CstIntermediateGroupBase } from "../CstIntermediateGroupBase.ts";
import { type CstErrorResult, CstIntermediateItems } from "../CstIntermediateItems.ts";
import type { CstIntermediateMetadata } from "../CstIntermediateMetadata.ts";
import { CstIntermediateState } from "../CstIntermediateState.ts";

export class CstIntermediateRootState extends CstIntermediateState<never> {
  override offset: number;

  constructor(
    override readonly meta: CstIntermediateMetadata<any>,
    override readonly items: CstIntermediateItems,
  ) {
    super();

    this.offset = meta.startOffset;
  }

  override get group(): null {
    return null;
  }
  override get error(): undefined {
    return undefined;
  }

  private noOpsError(): never {
    throw new Error("this operation is not implemented for root group.");
  }

  override get parentState(): this {
    return this;
  }

  override get slots(): never {
    return this.noOpsError();
  }

  override get flags(): CstIntermediateFlags | undefined {
    return undefined;
  }

  override get isExplicitNode(): boolean {
    return true;
  }

  override hintIsCurrent(_isCurrent: boolean, _isBegin: boolean): void {}

  override ensureInitialized() {
    this.items.lifecycle = CstIntermediateItems.Lifecycle.Initialized;
  }

  override beginChild<ChildInfo extends CstNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: ChildInfo,
  ): CstIntermediateGroupBase<InstanceType<ChildInfo>, ChildInfo> {
    this.ensureInitialized();
    return this.items.beginChild(self, info);
  }

  override beginSpecialChild<ChildInfo extends CstSpecialNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: ChildInfo,
  ): CstIntermediateGroupBase<InstanceType<ChildInfo>, ChildInfo> {
    this.ensureInitialized();
    return this.items.beginSpecialChild(self, info);
  }

  override endChild<Node extends CstNode>(
    child: CstIntermediateGroupBase<Node>,
    _result: CstGroup<Node> | CstErrorResult,
  ): void {
    if (this.offset !== child.meta.startOffset) {
      throw new Error("this.offset != child.startOffset");
    }
    this.offset = child.offset;

    if (child.debug instanceof CstIntermediateDebugImpl) {
      child.debug.flushLog();
    }
  }

  override skipCurrent(): null {
    return null;
  }

  override parseToken(): never {
    return this.noOpsError();
  }

  override beforeEnd(_node: never): never {
    return this.noOpsError();
  }

  override end(_self: CstIntermediateGroupBase<never>, _node: never): never {
    return this.noOpsError();
  }

  override endWithError(
    _self: CstIntermediateGroupBase<never>,
    error: unknown | null,
  ): null {
    this.ensureInitialized();

    if (error === undefined) {
      // TODO: ?
      throw new Error(
        fmt`${fmt.code`undefined`} error is used internally. Use other value.`.s,
      );
    }

    return null;
  }

  declare debug?: CstIntermediateDebugImpl | undefined;
}
