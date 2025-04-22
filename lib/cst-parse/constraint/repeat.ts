import type { CstList } from "../../cst/CstList.ts";
import type { CstNode } from "../../cst/CstNode.ts";
import { memoize } from "../intrinsics.ts";
import {
  CstConstraintNode,
  type CstConstraintNodeInfo,
  CstConstraintNodeProps,
} from "./CstConstraintNode.ts";
import type { CstLazyNode } from "./CstLazyNode.ts";
import { constraintNodeInfo, constraintNodeItem } from "./intrinsics.ts";

export class CstRepeatNode<Node extends CstNode> extends CstConstraintNode {
  declare private $special_constraint_repeat: void;

  constructor(readonly items: CstList<Node>) {
    super();
  }
}

export class CstRepeatNodeProps<Node extends CstNode> extends CstConstraintNodeProps {
  constructor(
    readonly element: () => Node | null,
    readonly direction: "min" | "max" | "even",
    readonly limit: [number, number],
    readonly separator?: { trailing: boolean; fn: () => CstNode | null },
  ) {
    super();
  }
}

export type CstRepeatNodeInfo<Node extends CstNode> = CstConstraintNodeInfo<
  CstRepeatNode<Node>,
  CstRepeatNodeProps<Node>
>;

/// Scope

type RepeatNodeFn<Node extends CstNode> = () => Node | null;

export class CstConstraintRepeatScope {
  private countRange: [number, number] = [0, Infinity];
  private betweenNode?: { trailing: boolean; fn: () => CstNode | null };

  constructor() {}

  limitCount(minimum: number, maximum: number): this {
    this.countRange = [minimum, maximum];
    return this;
  }

  atLeast(minimum: number): this {
    this.countRange[0] = minimum;
    return this;
  }

  atMost(maximum: number): this {
    this.countRange[1] = maximum;
    return this;
  }

  between(fn: () => CstNode | null, options?: { trailing?: boolean }): this {
    this.betweenNode = {
      fn,
      trailing: options?.trailing ?? true,
    };
    return this;
  }

  /// invocation

  private invokeFn<Node extends CstNode>(
    direction: CstRepeatNodeProps<Node>["direction"],
    fn: RepeatNodeFn<Node>,
  ): CstLazyNode<CstList<Node>> {
    const info = memoize(() =>
      constraintNodeInfo(
        CstRepeatNode<Node>,
        new CstRepeatNodeProps<Node>(fn, direction, this.countRange, this.betweenNode),
      )
    );
    return constraintNodeItem(info)
      .map((node) => node.items);
  }

  invoke<Node extends CstNode>(fn: RepeatNodeFn<Node>): CstLazyNode<CstList<Node>> {
    return this.invokeFn("even", fn);
  }

  invokeMinimum<Node extends CstNode>(fn: RepeatNodeFn<Node>): CstLazyNode<CstList<Node>> {
    return this.invokeFn("min", fn);
  }

  invokeMaximum<Node extends CstNode>(fn: RepeatNodeFn<Node>): CstLazyNode<CstList<Node>> {
    return this.invokeFn("max", fn);
  }
}
