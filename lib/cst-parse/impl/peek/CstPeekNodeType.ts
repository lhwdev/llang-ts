import type { CstNode } from "../../../cst/CstNode.ts";
import { CstPeekNode } from "../../CstSpecialNode.ts";
import type { CstContextLocal } from "../../intermediate/CstContextLocal.ts";
import { Contexts } from "../contexts.ts";
import type { CstIntermediateGroupBase } from "../CstIntermediateGroupBase.ts";
import { CstIntermediateItems } from "../CstIntermediateItems.ts";
import { CstIntermediateMetadata } from "../CstIntermediateMetadata.ts";
import type { CstIntermediateState } from "../CstIntermediateState.ts";
import { CstIntermediateTypeImpl } from "../CstIntermediateTypeImpl.ts";
import { CstIntermediatePeekState } from "./CstIntermediatePeekState.ts";

export class CstPeekNodeType extends CstIntermediateTypeImpl<typeof CstPeekNode> {
  static Instance = new CstPeekNodeType(CstPeekNode);

  override handleImplicitPrefix(
    _parent: CstIntermediateGroupBase<any>,
    _implicitFn: () => CstNode | null,
    _info: typeof CstPeekNode,
  ): null {
    return null;
  }

  override get isExplicit(): boolean {
    return false;
  }

  override get isRestorable(): boolean {
    return true;
  }

  override createMetadata(
    parent: CstIntermediateGroupBase<any>,
    info: typeof CstPeekNode,
  ): CstPeekNodeMetadata {
    if (info !== CstPeekNode) throw new Error("input != CstPeekNode");
    return new CstPeekNodeMetadata(parent, this);
  }

  override createIntermediateState(
    meta: CstPeekNodeMetadata,
    parentState: CstIntermediateState<any>,
  ): CstIntermediateState<CstPeekNode<any>, typeof CstPeekNode> {
    return new CstIntermediatePeekState(parentState, meta, new CstIntermediateItems(meta));
  }
}

export class CstPeekNodeMetadata extends CstIntermediateMetadata<typeof CstPeekNode> {
  readonly implicitFn: (() => CstNode | null) | null;

  constructor(
    parent: CstIntermediateGroupBase<any>,
    type: CstPeekNodeType,
  ) {
    super(parent, type, CstPeekNode);

    this.implicitFn = parent.meta.resolveContextOrNull(Contexts.ImplicitNode)?.value ?? null;

    const contextMap = this._contextMap;
    contextMap.provideContext = function (value: CstContextLocal<any>): void {
      if (value.key === Contexts.ImplicitNode) {
        throw new Error("trying to provide implicit directly inside peek node");
      }
      return contextMap.provideContext(value);
    };
  }
}
