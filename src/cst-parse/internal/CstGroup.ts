import type { CstNode } from "../CstNode.ts";
import type { CstNodeInfo } from "../CstNodeInfo.ts";
import type { CstNodeHintType } from "../CstParseContext.ts";
import type { CstTree } from "../CstTree.ts";
import type { CstCodeScope } from "../tokenizer/CstCodeScope.ts";

export class CstGroup implements CstTree {
  constructor(
    readonly parent: CstGroup,
    readonly info: CstNodeInfo<any>,
    readonly spanFrom: number,
    readonly children: CstTree[],
  ) {
    this.spanTo = spanFrom;
    this.codeScope = parent.codeScope;
  }

  spanTo: number;

  type?: CstNodeHintType;
  disableImplicit?: true;
  allowImplicit?: boolean;
  codeScope?: CstCodeScope;

  node: CstNode | null = null;
  error: unknown | null = null;

  extendSpan(to: number) {
    if (to < this.spanTo) throw new Error("why span decreased");
    this.spanTo = to;
  }

  endWithError(error: unknown) {
    this.error = error;
    return null;
  }
}
