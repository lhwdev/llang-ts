import type { CstNode } from "../../cst/CstNode.ts";
import {
  CstConstraintNode,
  type CstConstraintNodeInfo,
  CstConstraintNodeProps,
} from "./CstConstraintNode.ts";

export class CstNoConstraintNode<Node> extends CstConstraintNode {
  declare private $special_constraint_noConstraint: void;

  constructor(readonly value: Node) {
    super();
  }
}

export class CstNoConstraintNodeProps<Node extends CstNode> extends CstConstraintNodeProps {
  constructor(readonly node: () => Node | null) {
    super();
  }
}

export type CstNoConstraintNodeInfo<Node extends CstNode> = CstConstraintNodeInfo<
  CstNoConstraintNode<Node>,
  CstNoConstraintNodeProps<Node>
>;
