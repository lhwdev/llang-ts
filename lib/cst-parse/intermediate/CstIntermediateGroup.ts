import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { Token } from "../../token/Token.ts";
import type { CstParseIntrinsics } from "./CstParseIntrinsics.ts";
import type { CstProvidableContextLocalMap } from "./CstContextLocal.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import type { CstNodeType } from "./CstNodeType.ts";
import { withGroupFn } from "./currentGroup.ts";

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

  abstract readonly items: readonly CstIntermediateItem[];

  abstract readonly currentOffset: number;

  // defined in ./CstParseContext.ts
  get withSelf(): <R>(fn: (self: this) => R) => R {
    return withGroupFn(this);
  }

  /// Slots

  static EmptySlot = Symbol("EmptySlot");

  abstract nextSlot(): unknown;
  abstract updateSlot<T>(value: T): T;

  /// Building

  abstract beginChild<Info extends CstNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info>;

  abstract beginSpecialChild<Info extends CstSpecialNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info>;

  abstract skipCurrent(): CstNode | null;

  abstract beforeEnd(node: Node): CstTree<Node>;

  abstract end(node: Node): Node;
  abstract endWithError(error: unknown | null): Node | null;

  abstract getParentForEnd(): CstIntermediateGroup<any>;
}

export interface CstIntermediateGroupItems {
  beginChild<Info extends CstNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info>;

  beginSpecialChild<Info extends CstSpecialNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info>;
}

export type CstIntermediateItem = CstIntermediateGroup<any> | Token;
