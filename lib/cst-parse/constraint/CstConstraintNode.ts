import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstSpecialNode } from "../CstSpecialNode.ts";

export abstract class CstConstraintNode extends CstSpecialNode {
  declare private $special_constraint: void;
}

export type CstConstraintNodeInfo<
  Node extends CstConstraintNode,
  Props extends CstConstraintNodeProps = CstConstraintNodeProps,
> = CstNodeInfo<Node> & {
  constraint: Props;
};

export class CstConstraintNodeProps {
  declare private $CstConstraintNodeProps: void;
}
