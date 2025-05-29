import type { CstPeekNode } from "../../CstSpecialNode.ts";
import type { CstGroup } from "../../tree/CstGroup.ts";
import type { CstIntermediateGroupBase } from "../CstIntermediateGroupBase.ts";
import type { CstErrorResult, CstIntermediateItems } from "../CstIntermediateItems.ts";
import type { CstIntermediateState } from "../CstIntermediateState.ts";
import { CstIntermediateStateImpl } from "../CstIntermediateStateImpl.ts";
import type { CstPeekNodeMetadata } from "./CstPeekNodeType.ts";

type CstPeekInfo = typeof CstPeekNode<any>;

export class CstIntermediatePeekState
  extends CstIntermediateStateImpl<CstPeekNode<any>, CstPeekInfo> {
  override readonly meta: CstPeekNodeMetadata;

  constructor(
    parentState: CstIntermediateState<any>,
    meta: CstPeekNodeMetadata,
    items: CstIntermediateItems,
  ) {
    super(parentState, meta, items);
    this.meta = meta;

    this.items.acceptImplicit = parentState.items.acceptImplicit;
  }

  protected override createGroup(
    node: CstPeekNode<any>,
  ): CstGroup<CstPeekNode<any>, CstPeekInfo> {
    return new CstPeekGroup_();
  }

  protected override reportToParent(
    self: CstIntermediateGroupBase<CstPeekNode<any>, CstPeekInfo>,
    result: CstErrorResult | CstGroup<CstPeekNode<any>>,
  ): void {
    this.parentState.items.reportEndOfChild(self, result);
  }

  protected override reportGroupEnd(): void {
    this.discardSelf();
  }

  protected override discardIfPossible(_error: unknown | null): void {
    this.discardSelf();
  }
}
