import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { Span } from "../../token/Span.ts";
import type { CstNodeType } from "../intermediate/CstNodeType.ts";

export abstract class CstGroupMetadata<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> {
  abstract readonly type: CstNodeType<Info>;
  abstract readonly info: Info;

  abstract readonly span: Span;
}
