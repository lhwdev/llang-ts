import { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { LazyValue } from "../../utils/Value.ts";
import { isInherited } from "../../utils/extends.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type {
  CstConstraintNodeInfo,
  CstMaybeNodeInfo,
  CstNoConstraintNodeInfo,
  CstRepeatNodeInfo,
} from "../CstConstraintNode.ts";
import {
  ConstraintNodeItemMarker,
  CstConstraintNode,
  CstMaybeNode,
  CstNoConstraintNode,
  CstRepeatNode,
} from "../CstConstraintNode.ts";
import type { CstCodeScope } from "../tokenizer/CstCodeScope.ts";
import type { CstGroup } from "./CstGroup.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";
import { CstArray } from "../../cst/CstArray.ts";
import { nullableNode, peek } from "../inlineNode.ts";
import { detailedParseError } from "./errors.ts";
import { fmt } from "../../utils/format.ts";
import { type CstNodeHintType, NodeHint, NodeHints } from "../CstParseContext.ts";
import { CstConstraintNodeRoot } from "../CstSpecialNode.ts";
import { intrinsics } from "../intrinsics.ts";

export class CstIntermediateConstraintRoot extends CstIntermediateNode {
  protected override createChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    return new (this.childInstance(CstIntermediateConstraints))(this, info);
  }

  override beforeEnd<Node extends CstNode>(node: Node): CstGroup<Node> {
    if (node.constructor === CstConstraintNodeRoot) return super.beforeEnd(node);

    const name = node.constructor.name;
    throw detailedParseError`
      Do not parse node directly inside ${fmt.code("constraintNode()")}.
      Use ${fmt.code(`constraintNode(${name}, () => ...)`)} variant, or insert another node \\
      inside: ${fmt.code(`constraintNode(() => node(${name}, () => ...))`)}.
    `;
  }
}

export class CstIntermediateConstraints extends CstIntermediateNode {
  constraints: Constraint<any>[] = [];
  constraintChainsMap = new Map<ConstraintChain, CstGroup>();
  constraintsResolved = false;

  override updateSlot<T>(value: T): T {
    if (value instanceof ConstraintNodeItemMarker) {
      if (this.constraintsResolved) {
        throw detailedParseError`
          Constraints already resolved; do not use returned LazyValue from ConstraintNodeScope until end.
          
          Wrong example: ${
          fmt.code(
            "constraintNode((s) => { const a = s.repeat().invoke(...); const b = s.maybe(a.value.hi); new MyNode(a, b) })",
          )
        }
          as it access a.value before calling any other parser, \\
          like ${fmt.code("cstNode()")} or ${fmt.code("s.maybe()")}.
        `;
      }

      const constraint = Constraint.create(value);
      this.constraints.push(constraint);
      value.value = LazyValue.of(() => {
        this.resolveConstraints();
        return value.resolvedValue!;
      });
      return value;
    }

    return super.updateSlot(value);
  }

  resolveConstraints() {
    if (this.constraintsResolved) return;
    if (!this.constraints.length) return;

    let previous = ConstraintChainNext.End;
    const chains: ConstraintChain[] = [];
    for (let index = this.constraints.length - 1; index >= 0; index--) {
      const constraint = this.constraints[index];
      const chain = new ConstraintChain(constraint, previous);
      chains.push(chain);
      previous = chain;
    }
    chains.reverse();

    // 'chains' is a reversed list
    this.withSelf(() => {
      for (let index = 0; index < chains.length; index++) {
        const chain = chains[index];
        chain.debugWholeChain = chains;
        const node = chain.resolve();
        if (!node) {
          throw detailedParseError`
            Cannot resolve constraint at children[${chains.length - index - 1}] of constraintNode.
            
          `;
        }
        chain.onResolved(node);
      }
    });
    this.constraintsResolved = true;
  }

  override code<R>(_scope: CstCodeScope, _fn: (code: CstCodeContext) => R): R {
    throw new Error("cannot use code() directly inside repeat; surround with other node");
  }

  override beginChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    const child = super.beginChild(info);
    child.ensureSnapshotExists();
    return child;
  }

  override createSpecialChild(info: CstNodeInfo<any>): CstIntermediateGroup | null {
    const parent = super.createSpecialChild(info);
    if (parent) return parent;

    if (!isInherited(info, CstConstraintNode)) return null;
    const type = Object.getPrototypeOf(info.prototype).constructor;
    switch (type) {
      case CstNoConstraintNode:
        return new (this.childInstance(CstIntermediateNoConstraint))(this, info as any);
      case CstMaybeNode:
        return new (this.childInstance(CstIntermediateMaybe))(this, info as any);
      case CstRepeatNode:
        return new (this.childInstance(CstIntermediateRepeat))(this, info as any);
    }
    throw new Error("unknown constraint node");
  }

  protected override createChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    throw detailedParseError`
      Cannot insert node ${info} into ${fmt.code("constraintNode()")}.
      Use ${fmt.code("scope.node()")} instead.
    `;
  }

  override beforeEnd<Node extends CstNode>(node: Node): CstGroup<Node> {
    this.resolveConstraints();
    return super.beforeEnd(node);
  }

  override endChild(child: CstGroup, from: CstIntermediateGroup): void {
    super.endChild(child, from);

    if (from instanceof CstIntermediateConstraint && from.constraintChain) {
      this.constraintChainsMap.set(from.constraintChain, child);
    }
  }
}

interface ConstraintNext {
  (): boolean;

  expectError(): never;

  // peek(): CstNode;
  // consume(node: CstNode): CstNode;
}

export abstract class Constraint<Info extends CstConstraintNodeInfo<any>> {
  constructor(
    readonly marker: ConstraintNodeItemMarker<InstanceType<Info>>,
    readonly info: Info,
  ) {}

  get props(): Info["constraint"] {
    return this.info.constraint;
  }

  abstract readonly elementName: string;

  abstract resolve(next: ConstraintNext): InstanceType<Info>;

  abstract test(next: ConstraintNext): boolean;

  static create<Node extends CstConstraintNode, Info extends CstConstraintNodeInfo<Node>>(
    marker: ConstraintNodeItemMarker<Node>,
  ): Constraint<Info> {
    const m = marker as any;
    const type = Object.getPrototypeOf(m.info.prototype).constructor;
    switch (type) {
      case CstNoConstraintNode:
        return new NodeConstraint(m, m.info) as any;
      case CstMaybeNode:
        return new MaybeConstraint(m, m.info) as any;
      case CstRepeatNode:
        return new RepeatConstraint(m, m.info) as any;
      default:
        throw new Error(`unknown constraint node type ${marker.info.name}`);
    }
  }
}

function extractName(fn: () => any): string {
  const name = fn.toString().match(/^\(\)=>(\w+)/)?.[1];
  return name || fn.name || "?";
}

export class NodeConstraint extends Constraint<CstNoConstraintNodeInfo<CstNode>> {
  override get elementName(): string {
    return extractName(this.props.node);
  }

  override resolve(_next: ConstraintNext): CstNoConstraintNode<CstNode> {
    const node = this.props.node();
    if (!node) {
      throw new Error("cannot satisfy condition");
    }
    return new CstNoConstraintNode(node);
  }

  override test(_next: ConstraintNext): boolean {
    return !!this.props.node();
  }
}

export class MaybeConstraint extends Constraint<CstMaybeNodeInfo<CstNode>> {
  override get elementName(): string {
    return extractName(this.props.node);
  }

  override resolve(next: ConstraintNext): CstMaybeNode<CstNode> {
    const { node, prefer } = this.props;
    if (prefer) {
      return new CstMaybeNode(node());
    } else {
      if (next()) {
        return new CstMaybeNode(null);
      } else {
        return new CstMaybeNode(node());
      }
    }
  }

  override test(next: ConstraintNext): boolean {
    const { node, prefer } = this.props;
    if (prefer) {
      const result = node();
      return result ? true : next();
    } else {
      if (next()) {
        return true;
      } else {
        return node() ? true : next();
      }
    }
  }
}

export class RepeatConstraint extends Constraint<CstRepeatNodeInfo<CstNode>> {
  override get elementName(): string {
    return extractName(this.props.element);
  }

  override resolve(next: ConstraintNext): CstRepeatNode<CstNode> {
    const { element, direction, limit: [min, max], separator } = this.props;

    const result = new CstArray<CstNode>();

    const consume = () =>
      nullableNode(CstNode, () => {
        intrinsics.debugName("consume");
        if (result.length && separator) {
          const sep = separator.fn();
          if (!sep) return null;
        }
        return element();
      });

    const forceConsume = () =>
      peek(() => {
        if (result.length && separator) {
          const sep = separator.fn();
          if (!sep) return "no separator";
        }
        return element() ? "?" : "no element";
      });

    while (result.length < min) {
      const node = consume();
      if (!node) {
        throw detailedParseError`
          Cannot satisfy minimum limit of repeat.
          - ${fmt.brightYellow("limit")}: ${fmt.underline`${min}`} <= n <= ${max}
          - ${fmt.brightYellow("available")}: ${result.length}
          - ${fmt.brightYellow("reason")}: ${fmt.raw(forceConsume())}
        `;
      }
      result.push(node);
    }

    switch (direction) {
      case "min": {
        if (separator) {
          while (result.length < max) {
            const node = nullableNode(CstNode, () => {
              if (!separator.trailing && next()) return null;
              const sep = separator.fn();
              if (!sep) return null;
              return element();
            });
            if (!node) break;
            result.push(node);
          }
          if (separator.trailing) {
            if (!next() && !separator.fn()) {
              next.expectError();
            }
          }
        } else {
          while (result.length < max) {
            if (next()) break;

            const node = element();
            if (!node) break;
            result.push(node);
          }
        }
        break;
      }
      case "max": {
        while (result.length < max) {
          const node = consume();
          if (!node) break;
          result.push(node);
        }
        break;
      }
      case "even": {
        throw new Error("TODO; my head is overheated");
      }
    }

    return new CstRepeatNode(result);
  }

  override test(next: ConstraintNext): boolean {
    const { element, direction, limit: [min, max], separator } = this.props;

    const result = new CstArray<CstNode>();

    const consume = () =>
      nullableNode(CstNode, () => {
        if (result.length && separator) {
          const sep = separator.fn();
          if (!sep) return null;
        }
        return element();
      });

    while (result.length < min) {
      const node = consume();
      if (!node) return false;
      result.push(node);
    }

    switch (direction) {
      case "min": {
        if (separator) {
          if (!separator.trailing && next()) return false;
          const sep = separator.fn();
          if (!sep) return false;
          if (!element()) return false;
        } else {
          while (result.length < max) {
            if (next()) break;

            const node = element();
            if (!node) break;
            result.push(node);
          }
        }
        break;
      }
      case "max": {
        if (!consume()) return false;
        break;
      }
      case "even": {
        throw new Error("TODO; my head is overheated");
      }
    }

    return true;
  }
}

class ConstraintChainMarker extends NodeHint<ConstraintChain> {
  declare private constraintChainMarker: void;
}

abstract class ConstraintChainNext {
  abstract readonly name: string;

  abstract readonly next: ConstraintChainNext;

  abstract readonly asNext: ConstraintNext;

  get chains(): ConstraintChainNext[] {
    const list = [];
    // deno-lint-ignore no-this-alias
    let current: ConstraintChainNext = this;
    while (current !== ConstraintChainNext.End) {
      list.push(current);
      current = current.next;
    }
    return list;
  }

  static End = new class extends ConstraintChainNext {
    name = "End";

    override get next(): ConstraintChainNext {
      return this;
    }

    override asNext: ConstraintNext = Object.assign(() => true, {
      expectError: () => {
        throw new Error("should never called");
      },
    });
  }();
}

class ConstraintChain extends ConstraintChainNext {
  value?: CstNode;
  declare debugWholeChain?: ConstraintChain[];

  constructor(
    readonly c: Constraint<any>,
    override readonly next: ConstraintChainNext,
  ) {
    super();
  }

  override get name(): string {
    return `${this.c.info.name}[${this.c.elementName}]`;
  }

  resolve(): CstNode | null {
    if (this.value) throw new Error("already resolved");
    return nullableNode(this.c.info, () => {
      try {
        intrinsics.debugName("cstConstraint");
        intrinsics.debugNodeName(this.name);
        intrinsics.hintSelf(new ConstraintChainMarker(this));
        return this.c.resolve(this.next.asNext);
      } catch (e) {
        const chains = this.debugWholeChain ?? this.chains;
        throw detailedParseError(Error, { cause: e })`
          while resolving constraint chain:
          - ${fmt.brightYellow("chain")}: \\
            ${this.debugWholeChain ? fmt`` : fmt`... ${fmt.gray("->")}`} ${
          fmt.join(
            chains.map((c) => c === this ? fmt.strikethrough(c.name) : fmt.raw(c.name)),
            fmt.gray` -> `,
          )
        }
        `;
      }
    });
  }

  onResolved(value: CstNode) {
    this.value = value;
    this.c.marker.resolvedValue = value;
    this.c.marker.value = LazyValue.resolved(value);
  }

  override asNext: ConstraintNext = Object.assign(() =>
    intrinsics.testNode(() => {
      intrinsics.debugName(`${this.c.info.name}.asNext`);
      intrinsics.hintSelf(new NodeHints.DebugImportance("hide"));
      return this.c.test(this.next.asNext);
    }), {
    expectError: () => {
      this.c.resolve(this.next.asNext);
      throw new Error(
        "CstIntermediate internal error: expectError can only be called when next() returned false.",
      );
    },
  });
}

class CstIntermediateConstraint extends CstIntermediateNode {
  constructor(
    override readonly parent: CstIntermediateConstraints,
    info: CstConstraintNodeInfo<any, any>,
  ) {
    super(parent, info);
  }

  constraintChain?: ConstraintChain;

  override hintType(hint: CstNodeHintType) {
    if (hint instanceof ConstraintChainMarker) {
      const value = hint.value;
      this.constraintChain = value;
      return;
    }
    super.hintType(hint);
  }
}

class CstIntermediateNoConstraint extends CstIntermediateConstraint {}

class CstIntermediateMaybe extends CstIntermediateConstraint {
  constructor(
    parent: CstIntermediateConstraints,
    override readonly info: CstMaybeNodeInfo<any>,
  ) {
    super(parent, info);
  }
}

class CstIntermediateRepeat extends CstIntermediateConstraint {
  constructor(
    parent: CstIntermediateConstraints,
    override readonly info: CstRepeatNodeInfo<any>,
  ) {
    super(parent, info);
  }
}
