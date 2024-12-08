import { context } from "./CstParseContext.ts";
import type { CstTree } from "./CstTree.ts";

export class CstNode implements CstNode {
  tree: CstTree = context.beforeEnd(this);

  constructor() {}
}
