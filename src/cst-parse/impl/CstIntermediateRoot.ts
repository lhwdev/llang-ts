import { CstRootNode } from "../../cst/CstRootNode.ts";
import type { ContextKey, ContextValue } from "../CstParseContext.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";

export class CstIntermediateRoot extends CstIntermediateNode {
  override readonly parent: CstIntermediateRoot;

  constructor() {
    const stub = { spanEnd: 0 } as CstIntermediateGroup;
    stub.contextualNode = stub;
    super(stub, CstRootNode);
    this.parent = this;
  }

  override resolveContextOrNull<T>(_key: ContextKey<T>): ContextValue<T> | null {
    return null;
  }
}
