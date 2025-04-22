import type { CstNode } from "../../cst/CstNode.ts";
import { CstRootNode } from "../../cst/CstRootNode.ts";
import type { ContextKey, ContextValue } from "../CstParseContext.ts";
import type { CstGroup } from "./CstGroup.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";

export class CstIntermediateRoot extends CstIntermediateNode {
  override readonly parent: CstIntermediateRoot;

  constructor(readonly nodeInstance: typeof CstIntermediateNode | null) {
    const stub = { spanEnd: 0 } as CstIntermediateGroup;
    stub.contextualNode = stub;
    super(stub, CstRootNode);
    this.parent = this;
    this.contextualNode = this;
  }

  override parentForPop(): CstIntermediateGroup {
    throw new Error("cannot end root group");
  }

  override resolveContextOrNull<T>(key: ContextKey<T>): ContextValue<T> | null {
    return this.resolveContextOnSelf(key);
  }

  private mappedInstances = new Set<new (...args: any) => CstIntermediateGroup>();

  protected override childInstance<Ctor extends new (...args: any) => CstIntermediateGroup>(
    type: Ctor,
  ): Ctor {
    if (!this.nodeInstance) return type;
    if (type as any === CstIntermediateNode) return this.nodeInstance as any;

    if (this.mappedInstances.has(type)) return type;

    let current = type;
    while (current) {
      const prototype = Object.getPrototypeOf(current);
      if (prototype === CstIntermediateNode) {
        Object.setPrototypeOf(current, this.nodeInstance);
        break;
      } else {
        current = prototype;
      }
    }

    this.mappedInstances.add(type);
    return type;
  }

  override beforeEnd<Node extends CstNode>(_node: Node): CstGroup<Node> {
    throw new Error("cannot end root group");
  }

  override end<Node extends CstNode>(_node: Node): Node {
    throw new Error("cannot end root group");
  }
}
