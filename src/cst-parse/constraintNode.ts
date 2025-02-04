import { CstArray, type CstReadonlyArray } from "../cst/CstArray.ts";
import { CstNode } from "../cst/CstNode.ts";
import { CstConstraintNodeRoot, CstSpecialNode } from "./CstSpecialNode.ts";
import { node } from "./inlineNode.ts";
import { memoize } from "./intrinsics.ts";

/**
 * Constraint node can be used to make complex, predicated based declarative
 * parser. Generally, all parsing is eager, meaning you cannot parse something
 * like `a* a`.
 */
export function constraintNode<R>(fn: (scope: ConstraintNodeScope) => R): R {
  return node(CstConstraintNodeRoot<R>, () => new CstConstraintNodeRoot(fn(sConstraintNodeScope)))
    .value;
}

export class ConstraintNodeScope {
  maybe<Node extends CstNode>(fn: () => Node | null): Node | null {
    return node(CstMaybeNode<Node>, () => new CstMaybeNode(fn())).item;
  }

  repeat(): ConstraintRepeatScope {
    return new ConstraintRepeatScope();
  }
}

type RepeatNodeFn<Node extends CstNode> = () => Node | null;

export class ConstraintRepeatScope {
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

  private invoke<Node extends CstNode>(
    direction: CstRepeatNodeProps["direction"],
    fn: RepeatNodeFn<Node>,
  ): CstReadonlyArray<Node> {
    const info = memoize(() => repeatNodeInfo<Node>({ direction, constraint: this.countRange }));
    return node(info, () => new CstRepeatNode<Node>(repeatImpl(fn, this.betweenNode))).items;
  }

  even<Node extends CstNode>(fn: RepeatNodeFn<Node>): CstReadonlyArray<Node> {
    return this.invoke("even", fn);
  }

  minimize<Node extends CstNode>(fn: RepeatNodeFn<Node>): CstReadonlyArray<Node> {
    return this.invoke("min", fn);
  }

  maximize<Node extends CstNode>(fn: RepeatNodeFn<Node>): CstReadonlyArray<Node> {
    return this.invoke("max", fn);
  }
}

const sConstraintNodeScope = new ConstraintNodeScope();

export abstract class CstConstraintNode extends CstSpecialNode {
  declare private $special_constraint: void;
}

/// Maybe

export class CstMaybeNode<Node extends CstNode> extends CstConstraintNode {
  declare private $special_constraint_maybe: void;

  constructor(readonly item: Node | null) {
    super();
  }
}

/// Repeat

function repeatImpl<Node extends CstNode>(
  fn: RepeatNodeFn<Node>,
  between?: { trailing: boolean; fn: () => CstNode | null },
): CstReadonlyArray<Node> {
  if (between && between.trailing === false) {
    const list = new CstArray<Node>();
    for (let index = 0;; index++) {
      const n = node(CstRepeatNoTrailingItem<Node | null>, () => {
        if (index !== 0) between.fn();
        return new CstRepeatNoTrailingItem(fn());
      });
      const result = n.value;
      if (result) {
        list.push(result);
      } else {
        break;
      }
    }
    return list;
  }

  const list = new CstArray<Node>();
  while (true) {
    const node = fn();
    if (node) {
      if (between && !between.fn()) break;
      list.push(node);
    } else {
      break;
    }
  }
  return list;
}

export class CstRepeatNode<Node extends CstNode> extends CstConstraintNode {
  declare private $special_constraint_repeat: void;

  constructor(readonly items: CstReadonlyArray<Node>) {
    super();
  }
}

class CstRepeatNoTrailingItem<Value> extends CstNode {
  constructor(readonly value: Value) {
    super();
  }
}

interface CstRepeatNodeProps {
  direction: "min" | "max" | "even";
  constraint: [number, number];
}

export type CstRepeatNodeInfo<Node extends CstNode> =
  & typeof CstRepeatNode<Node>
  & CstRepeatNodeProps;

function repeatNodeInfo<Node extends CstNode>(
  info: CstRepeatNodeProps,
): CstRepeatNodeInfo<Node> {
  const result = class extends CstRepeatNode<Node> {};
  return Object.assign(result, info);
}
