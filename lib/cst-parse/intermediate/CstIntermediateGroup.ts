import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstParseIntrinsics } from "./CstParseIntrinsics.ts";
import type { CstProvidableContextLocalMap } from "./CstContextLocal.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import type { CstNodeType } from "./CstNodeType.ts";
import {
  currentGroup,
  currentGroupOrNull,
  intrinsicBeginGroup,
  intrinsicEndGroup,
  withGroupFn,
} from "./currentGroup.ts";
import type { CstGroupItem } from "../tree/CstGroup.ts";
import type { CstIntermediateDebug } from "./CstIntermediateDebug.ts";

export abstract class CstIntermediateGroup<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> implements CstIntermediateGroupItems {
  declare private $intermediateGroup: void;

  abstract readonly parent: CstIntermediateGroup<any>;

  abstract readonly type: CstNodeType<Info>;

  abstract readonly info: Info;

  abstract readonly contextMap: CstProvidableContextLocalMap;

  abstract readonly intrinsics: CstParseIntrinsics<Info>;

  abstract readonly items: readonly CstGroupItem[];

  abstract readonly offset: number;

  // defined in ./CstParseContext.ts
  get withSelf(): <R>(fn: (self: this) => R) => R {
    return withGroupFn(this);
  }

  // deno-lint-ignore no-unused-vars
  hintIsCurrent(isCurrent: boolean, isBegin: boolean) {}

  isCurrent(): boolean {
    return this === currentGroup();
  }

  buildNode(fn: (self: this) => Node): Node {
    const parent = currentGroupOrNull();
    intrinsicBeginGroup(this);
    try {
      const skip = this.skipCurrent();
      if (skip) return skip;

      const node = fn(this);
      return this.end(node);
    } catch (e) {
      const result = this.endWithError(e);
      if (!result) throw e;
      return result;
    } finally {
      intrinsicEndGroup(parent);
    }
  }

  buildNullableNode(fn: (self: this) => Node | null): Node | null {
    const parent = currentGroupOrNull();
    intrinsicBeginGroup(this);
    try {
      const skip = this.skipCurrent();
      if (skip) return skip;

      this.intrinsics.markNullable();
      const node = fn(this);
      return node ? this.end(node) : this.endWithError(node);
    } catch (e) {
      const result = this.endWithError(e);
      if (!result) throw e;
      return result;
    } finally {
      intrinsicEndGroup(parent);
    }
  }

  as<T extends CstIntermediateGroup<Node, Info>>(type: abstract new (...args: any) => T): T {
    if (!(this instanceof type)) {
      throw new TypeError();
    }
    return this;
  }

  /// Slots

  static EmptySlot = Symbol("EmptySlot");

  abstract nextSlot(): unknown;
  abstract updateSlot<T>(value: T): T;

  /// Building

  abstract beginChild<ChildInfo extends CstNodeInfo<any>>(
    info: ChildInfo,
  ): CstIntermediateGroup<InstanceType<ChildInfo>, ChildInfo>;

  abstract beginSpecialChild<ChildInfo extends CstSpecialNodeInfo<any>>(
    info: ChildInfo,
  ): CstIntermediateGroup<InstanceType<ChildInfo>, ChildInfo>;

  abstract skipCurrent(): Node | null;

  abstract beforeEnd(node: Node): CstTree<Node>;

  abstract end(node: Node): Node;
  abstract endWithError(error: unknown | null): Node | null;

  abstract getParentForEnd(): CstIntermediateGroup<any>;

  abstract readonly debug?: CstIntermediateDebug;
}

export interface CstIntermediateGroupItems {
  beginChild<Info extends CstNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info>;

  beginSpecialChild<Info extends CstSpecialNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info>;
}
