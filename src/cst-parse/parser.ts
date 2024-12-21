import { yellow } from "@std/fmt/colors";
import type { CstNode } from "../cst/CstNode.ts";
import type { CstNodeInfo } from "../cst/CstNodeInfo.ts";
import { node, nullableNode } from "./inlineNode.ts";

export interface CstParser<Node extends CstNode> {
  info: CstNodeInfo<Node>;
}

function parserName(info: CstNodeInfo<any>): string {
  const name = info.name;
  if (!name.length) return "";
  return yellow(name[0].toLowerCase() + name.slice(1));
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
  Object.defineProperty(impl, "name", { value: parserName(info) });
  return rawParser(info, (...args) => {
    return node(info, () => impl(...args));
  });
}

export function nullableParser<Params extends any[], Node extends CstNode>(
  info: CstNodeInfo<Node>,
  impl: (...args: Params) => Node | null,
): CstParser<Node> & ((...args: Params) => Node | null) {
  Object.defineProperty(impl, "name", { value: parserName(info) });
  return rawParser(info, (...args) => {
    return nullableNode(info, () => impl(...args));
  });
}
