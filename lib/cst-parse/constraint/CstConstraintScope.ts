import type { CstList } from "../../cst/CstList.ts";
import type { CstNode } from "../../cst/CstNode.ts";
import { memoize } from "../intrinsics.ts";
import type { CstLazyNode } from "./CstLazyNode.ts";
import { constraintNodeInfo, constraintNodeItem } from "./intrinsics.ts";
import { CstMaybeNode, CstMaybeNodeProps } from "./maybe.ts";
import { CstNoConstraintNode, CstNoConstraintNodeProps } from "./noConstraint.ts";
import { CstConstraintRepeatScope } from "./repeat.ts";

export class CstConstraintScope {
  partial<Node extends CstNode>(
    fn: (scope: CstConstraintScope) => CstLazyNode<Node>,
  ): CstLazyNode<Node> {
  }

  node<Node extends CstNode>(fn: () => Node | null): CstLazyNode<Node> {
    const info = memoize(() =>
      constraintNodeInfo(CstNoConstraintNode<Node>, new CstNoConstraintNodeProps(fn))
    );
    return constraintNodeItem(info)
      .map((node) => node.value);
  }

  maybe<Node extends CstNode>(prefer: boolean, fn: () => Node | null): CstLazyNode<Node | null> {
    const info = memoize(() =>
      constraintNodeInfo(CstMaybeNode<Node>, new CstMaybeNodeProps(fn, prefer))
    );
    return constraintNodeItem(info)
      .map((node) => node.item);
  }

  repeat(): CstConstraintRepeatScope;
  repeat<Node extends CstNode>(fn: () => Node | null): CstLazyNode<CstList<Node>>;
  repeat(fn?: any): any {
    if (fn) {
      return this.repeat().invoke(fn);
    }
    return new CstConstraintRepeatScope();
  }
}
