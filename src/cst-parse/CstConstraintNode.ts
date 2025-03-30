import type { CstList } from "../cst/CstList.ts";
import type { CstNode } from "../cst/CstNode.ts";
import type { CstNodeConstructor, CstNodeInfo } from "../cst/CstNodeInfo.ts";
import { fmt } from "../utils/format.ts";
import type { LazyValue } from "../utils/Value.ts";
import { getContext } from "./CstParseContext.ts";
import { CstConstraintNodeRoot, CstSpecialNode } from "./CstSpecialNode.ts";
import { detailedParseError } from "./impl/errors.ts";
import { node } from "./inlineNode.ts";
import { memoize } from "./intrinsics.ts";

/**
 * Constraint node can be used to make complex, predicated based declarative
 * parser. Generally, all parsing is eager, meaning you cannot parse something
 * like `a* a`.
 */
export function constraintNode<R>(fn: (scope: ConstraintNodeScope) => R): R;

/**
 * Constraint node can be used to make complex, predicated based declarative
 * parser. Generally, all parsing is eager, meaning you cannot parse something
 * like `a* a`.
 */
export function constraintNode<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: (scope: ConstraintNodeScope) => Node,
): Node;

export function constraintNode<R>(a: any, b?: any): R {
  if (b) {
    return node(
      CstConstraintNodeRoot<R>,
      () => new CstConstraintNodeRoot(node(a, () => b(sConstraintNodeScope))),
    )
      .value;
  } else {
    return node(CstConstraintNodeRoot<R>, () => new CstConstraintNodeRoot(a(sConstraintNodeScope)))
      .value;
  }
}

export class ConstraintNodeItemMarker<Node extends CstConstraintNode> {
  constructor(
    readonly info: CstConstraintNodeInfo<Node>,
  ) {}

  value!: LazyValue<Node>;
  resolvedValue?: Node;

  getValue(): LazyValue<Node> {
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

function constraintNodeItem<Node extends CstConstraintNode>(
  info: CstConstraintNodeInfo<Node>,
): LazyValue<Node> {
  // this is not to memoize; this is a method to tell directly into
  // CstIntermediateConstraintRoot.
  return getContext().memoize(() => new ConstraintNodeItemMarker(info)).getValue();
}

function constraintNodeInfo<
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

export class ConstraintNodeScope {
  node<Node extends CstNode>(fn: () => Node | null): LazyValue<Node> {
    const info = memoize(() =>
      constraintNodeInfo(CstNoConstraintNode<Node>, new CstNoConstraintNodeProps(fn))
    );
    return constraintNodeItem(info)
      .map((node) => node.value);
  }

  maybe<Node extends CstNode>(prefer: boolean, fn: () => Node | null): LazyValue<Node | null> {
    const info = memoize(() =>
      constraintNodeInfo(CstMaybeNode<Node>, new CstMaybeNodeProps(fn, prefer))
    );
    return constraintNodeItem(info)
      .map((node) => node.item);
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

  /// invocation

  private invokeFn<Node extends CstNode>(
    direction: CstRepeatNodeProps<Node>["direction"],
    fn: RepeatNodeFn<Node>,
  ): LazyValue<CstList<Node>> {
    const info = memoize(() =>
      constraintNodeInfo(
        CstRepeatNode<Node>,
        new CstRepeatNodeProps<Node>(fn, direction, this.countRange, this.betweenNode),
      )
    );
    return constraintNodeItem(info)
      .map((node) => node.items);
  }

  invoke<Node extends CstNode>(fn: RepeatNodeFn<Node>): LazyValue<CstList<Node>> {
    return this.invokeFn("even", fn);
  }

  invokeMinimum<Node extends CstNode>(fn: RepeatNodeFn<Node>): LazyValue<CstList<Node>> {
    return this.invokeFn("min", fn);
  }

  invokeMaximum<Node extends CstNode>(fn: RepeatNodeFn<Node>): LazyValue<CstList<Node>> {
    return this.invokeFn("max", fn);
  }
}

const sConstraintNodeScope = new ConstraintNodeScope();

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

/// Maybe

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

/// Repeat

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
