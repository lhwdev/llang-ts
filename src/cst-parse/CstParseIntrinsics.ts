import type { CstNode } from "../cst/CstNode.ts";
import type { Spanned } from "../token/Spanned.ts";
import type { CstMutableList, CstMutableListInternal } from "./CstMutableList.ts";

export interface CstParseIntrinsics {
  markDiscardable(): void;
  markNullable(): void;
  markVital(reason?: Spanned): void;

  intrinsicListCreated<T extends Spanned>(list: CstMutableListInternal<T>): CstMutableList<T>;

  intrinsicListPushItem<T extends Spanned>(list: CstMutableListInternal<T>, item: T): void;

  intrinsicTestNode(node: () => CstNode | boolean | null): boolean;
}
