import type { CstNode } from "../cst/CstNode.ts";
import type { Spanned } from "../token/Spanned.ts";

export interface CstParseIntrinsics {
  markDiscardable(): void;
  markNullable(): void;
  markVital(reason?: Spanned): void;

  intrinsicTestNode(node: () => CstNode | boolean | null): boolean;
}
