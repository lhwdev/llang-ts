import type { CstNode } from "../../cst/CstNode.ts";
import type { Spanned } from "../../token/Spanned.ts";
import type { CstMutableList, CstMutableListInternal } from "../CstMutableList.ts";
import type {
  CstParseIntrinsicKey,
  CstParseIntrinsics,
  CstParseIntrinsicsBase,
} from "../intermediate/CstParseIntrinsics.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";

export class CstParseIntrinsicsImpl<Info extends CstNodeInfo<any>>
  implements CstParseIntrinsicsBase {
  static create<Info extends CstNodeInfo<any> & { intrinsic?: CstParseIntrinsicKey<never> }>(
    info: Info,
    meta: CstIntermediateMetadata<Info>,
    state: CstIntermediateState<any>,
  ): CstParseIntrinsicsImpl<Info> & CstParseIntrinsics<Info> {
    if (info.intrinsic) throw new Error("never expected intrinsic");
    return new CstParseIntrinsicsImpl(meta, state, () => null) as any;
  }

  constructor(
    readonly meta: CstIntermediateMetadata<Info>,
    readonly state: CstIntermediateState<any>,
    readonly getIntrinsic: <T>(key: CstParseIntrinsicKey<T> | null) => T | null,
  ) {}

  markVital(reason?: Spanned): void {}

  intrinsicListCreated<T extends Spanned>(list: CstMutableListInternal<T>): CstMutableList<T> {
    throw new Error("TODO");
  }
  intrinsicListPushItem<T extends Spanned>(list: CstMutableListInternal<T>, item: T): void {}

  intrinsicTestNode(node: () => CstNode | boolean | null): boolean {
    return !!node();
  }

  intrinsic<T>(key: CstParseIntrinsicKey<T>): T;
  intrinsic(): never;
  intrinsic<T>(key?: CstParseIntrinsicKey<T>): T {
    const intrinsic = this.getIntrinsic(key ?? null);
    if (!intrinsic) throw new Error(`could not find intrinsic for ${key}`);
    return intrinsic;
  }
}
