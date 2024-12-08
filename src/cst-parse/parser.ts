import type { CstNode } from "./CstNode.ts";
import type { CstNodeInfo } from "./CstNodeInfo.ts";
import { context } from "./CstParseContext.ts";

export interface CstParser<Params extends any[], Node extends CstNode> {
  info: CstNodeInfo<Node>;

  (...params: Params): Node;
}

export function rawParser<Params extends any[], Node extends CstNode>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => Node,
): CstParser<Params, Node> {
  return Object.assign(impl, {
    info,
  });
}

export function parser<Params extends any[], Node extends CstNode>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => Node,
): CstParser<Params, Node> {
  return rawParser(info, (...args) => {
    const child = context.beginChild(info);
    try {
      const node = impl(...args);
      return child.end(node);
    } catch (e) {
      const result = child.endWithError(e);
      if (!result) throw new Error("parse failed: TODO error message", { cause: e });
      return result;
    }
  });
}
