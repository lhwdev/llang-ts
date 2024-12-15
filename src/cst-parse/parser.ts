import type { CstNode } from "./CstNode.ts";
import type { CstNodeInfo } from "./CstNodeInfo.ts";
import { context } from "./CstParseContext.ts";

export interface CstParser<Node extends CstNode> {
  info: CstNodeInfo<Node>;
}

export function rawParser<Params extends any[], Node extends CstNode, R>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => R,
): CstParser<Node> & ((...args: Params) => R) {
  return Object.assign(impl, {
    info,
  });
}

export function parser<Params extends any[], Node extends CstNode>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => Node,
): CstParser<Node> & ((...args: Params) => Node) {
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

export function nullableParser<Params extends any[], Node extends CstNode>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => Node | null,
): CstParser<Node> & ((...args: Params) => Node | null) {
  return rawParser(info, (...args) => {
    const child = context.beginChild(info);
    try {
      const node = impl(...args);
      if (node) {
        return child.end(node);
      } else {
        return child.endWithError(null);
      }
    } catch (e) {
      const result = child.endWithError(e);
      if (!result) throw new Error("parse failed: TODO error message", { cause: e });
      return result;
    }
  });
}
