import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstConstraintNodeRoot } from "../CstSpecialNode.ts";
import { node } from "../inlineNode.ts";
import { memoize } from "../intrinsics.ts";
import { CstConstraintScope } from "./CstConstraintScope.ts";

/**
 * Constraint node can be used to make complex, predicated based declarative
 * parser. Generally, all parsing is eager, meaning you cannot parse something
 * like `a* a`.
 */
export function constraintNode<R>(fn: (scope: CstConstraintScope) => R): R;

/**
 * Constraint node can be used to make complex, predicated based declarative
 * parser. Generally, all parsing is eager, meaning you cannot parse something
 * like `a* a`.
 */
export function constraintNode<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: (scope: CstConstraintScope) => Node,
): Node;

export function constraintNode<R>(a: any, b?: any): R {
  const constraintRoot = (fn: (scope: CstConstraintScope) => R) =>
    node(CstConstraintNodeRoot<R>, () => {
      const scope = memoize(() => new CstConstraintScope());
      return new CstConstraintNodeRoot(fn(scope));
    });

  if (b) {
    return constraintRoot((scope) => node(a, () => b(scope))).value;
  } else {
    return constraintRoot(a).value;
  }
}
