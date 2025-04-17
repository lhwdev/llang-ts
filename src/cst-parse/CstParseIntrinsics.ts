import type { CstNode } from "../cst/CstNode.ts";
import type { CstNodeInfo } from "../cst/CstNodeInfo.ts";
import type { Spanned } from "../token/Spanned.ts";
import type { CstMutableList, CstMutableListInternal } from "./CstMutableList.ts";
import type { CstSpecialNodeInfo } from "./CstSpecialNode.ts";

export interface CstParseIntrinsicsBase {
  markDiscardable(): void;
  markNullable(): void;
  markVital(reason?: Spanned): void;

  intrinsicListCreated<T extends Spanned>(list: CstMutableListInternal<T>): CstMutableList<T>;
  intrinsicListPushItem<T extends Spanned>(list: CstMutableListInternal<T>, item: T): void;

  intrinsicTestNode(node: () => CstNode | boolean | null): boolean;

  intrinsic<T>(key: CstParseIntrinsicKey<T>): T;
}

export type CstParseIntrinsics<Info extends CstNodeInfo<any> = CstNodeInfo<any>> =
  & CstParseIntrinsicsBase
  & {
    intrinsic: Info extends CstSpecialNodeInfo<any>
      ? Info["intrinsic"] extends CstParseIntrinsicKey<infer T> ? {
          (): T;
          <T>(key: CstParseIntrinsicKey<T>): T;
        }
      : (<T>(key: CstParseIntrinsicKey<T>) => T)
      : (<T>(key: CstParseIntrinsicKey<T>) => T);
  }
  & GlobalIntrinsics<Info>;

type GlobalIntrinsics<Info extends CstNodeInfo<any>> = Info extends CstSpecialNodeInfo<any>
  ? Info["intrinsic"] extends CstParseIntrinsicKey.Global<infer T> ? T : object
  : object;

export class CstParseIntrinsicKey<T> {
  declare private $parse_intrinsics: void;

  constructor(readonly name?: string) {}
}

export namespace CstParseIntrinsicKey {
  export class Global<T> extends CstParseIntrinsicKey<T> {
    declare private $parse_intrinsics_global: void;
  }
}
