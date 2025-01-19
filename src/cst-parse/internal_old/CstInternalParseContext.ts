import type { CstNode } from "../../cst/CstNode.ts";
import type { CstParseContext } from "../CstParseContext.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";

export interface CstInternalParseContext<Node extends CstNode> extends CstParseContext<Node> {
  readonly tokenizer: CstTokenizerContext;
}
