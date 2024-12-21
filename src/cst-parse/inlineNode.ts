import type { CstNode } from "../cst/CstNode.ts";
import type { CstNodeInfo } from "../cst/CstNodeInfo.ts";
import { context } from "./CstParseContext.ts";

export function node<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: () => Node,
): Node {
  const child = context.beginChild(info);
  try {
    const node = fn();
    return child.end(node);
  } catch (e) {
    const result = child.endWithError(e);
    if (!result) throw e;
    return result;
  }
}

export function nullableNode<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: () => Node | null,
): Node | null {
  const child = context.beginChild(info);
  try {
    const node = fn();
    if (node) {
      return child.end(node);
    } else {
      return child.endWithError(null);
    }
  } catch (e) {
    const result = child.endWithError(e);
    if (!result) throw e;
    return result;
  }
}
