import type { CstNodeConstructor } from "../../cst/CstNodeInfo.ts";
import { fmt } from "../../utils/format.ts";
import { getContext } from "../CstParseContext.ts";
import { detailedParseError } from "../impl/errors.ts";
import type {
  CstConstraintNode,
  CstConstraintNodeInfo,
  CstConstraintNodeProps,
} from "./CstConstraintNode.ts";
import type { CstLazyNode } from "./CstLazyNode.ts";

/**
 * Inside ConstraintNode, `getContext().intrinsics[IntrinsicConstraintNode]` should return
 * {@link ConstraintIntrinsics}.
 */
export const IntrinsicConstraintNode = Symbol("IntrinsicConstraintNode");

export interface ConstraintIntrinsics {
  constraintNodeItem<Node extends CstConstraintNode>(
    info: CstConstraintNodeInfo<Node>,
  ): CstLazyNode<Node>;
}

export function getConstraintIntrinsics(): ConstraintIntrinsics {
  const intrinsics = (getContext().intrinsics as any)[IntrinsicConstraintNode];
  if (!intrinsics) throw new Error();
}

export function constraintNodeItem<Node extends CstConstraintNode>(
  info: CstConstraintNodeInfo<Node>,
): CstLazyNode<Node> {
  // this is not to memoize; this is a method to tell directly into
  // CstIntermediateConstraintRoot.
  return getContext().memoize(() => new ConstraintNodeItemMarker(info)).getValue();
}

export function constraintNodeInfo<
  Info extends CstNodeConstructor<CstConstraintNode>,
  Props extends CstConstraintNodeProps,
>(
  nodeInfo: Info,
  constraint: Props,
): Info & { constraint: Props } {
  const result = class extends nodeInfo {};
  Object.defineProperty(result, "name", { value: `${nodeInfo.name}*` });
  return Object.assign(result, { constraint });
}

export class ConstraintNodeItemMarker<Node extends CstConstraintNode> {
  constructor(
    readonly info: CstConstraintNodeInfo<Node>,
  ) {}

  value!: CstLazyNode<Node>;
  resolvedValue?: Node;

  getValue(): CstLazyNode<Node> {
    if (!this.value) {
      throw detailedParseError`
        ${fmt.symbol("scope")} of ${fmt.code("constraintNode()")} should be used for its \\
        direct children. \\
        
        Example: ${fmt.code("constraintNode((scope) => node(MyNode, () => scope.fn(...)))")}
      `;
    }
    return this.value;
  }
}
