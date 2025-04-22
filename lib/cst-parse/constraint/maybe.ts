import type { CstNode } from "../../cst/CstNode.ts";
import {
  CstConstraintNode,
  type CstConstraintNodeInfo,
  CstConstraintNodeProps,
} from "./CstConstraintNode.ts";

export class CstMaybeNode<Node extends CstNode> extends CstConstraintNode {
  declare private $special_constraint_maybe: void;

  constructor(readonly item: Node | null) {
    super();
  }
}

export class CstMaybeNodeProps<Node extends CstNode> extends CstConstraintNodeProps {
  constructor(
    readonly node: () => Node | null,
    readonly prefer: boolean,
  ) {
    super();
  }
}

export type CstMaybeNodeInfo<Node extends CstNode> = CstConstraintNodeInfo<
  CstMaybeNode<Node>,
  CstMaybeNodeProps<Node>
>;
