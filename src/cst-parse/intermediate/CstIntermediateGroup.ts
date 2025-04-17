import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { Token } from "../../token/Token.ts";
import type { CstParseIntrinsics } from "../CstParseIntrinsics.ts";
import type { CstProvidableContextLocalMap } from "../CstContextLocal.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { CstSpecialNodeInfo } from "../CstSpecialNode.ts";

export abstract class CstIntermediateGroup<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> {
  declare private $: void;

  abstract readonly info: Info;

  abstract readonly contextMap: CstProvidableContextLocalMap;

  abstract readonly items: readonly CstIntermediateItem[];

  abstract readonly intrinsics: CstParseIntrinsics<Info>;

  // defined in ./CstParseContext.ts
  declare readonly withSelf: <R>(fn: (group: this) => R) => R;

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

export type CstIntermediateItem = CstIntermediateGroup<any> | Token;

export namespace CstIntermediateGroup {
  // defined in ./CstParseContext.ts
  export declare const current: CstIntermediateGroup<CstNode>;
}
