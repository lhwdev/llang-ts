import type { CstNode } from "../cst/CstNode.ts";
import { CstDetachedNode, CstPeekNode } from "./CstSpecialNode.ts";
import type { CstNodeConstructor, CstNodeInfo } from "../cst/CstNodeInfo.ts";
import { getContext, withContext } from "./CstParseContext.ts";
import { CstParserSymbol } from "./parser.ts";

/// NOTE: if you update code of node() or nullableNode(), you should also modify parser.ts.

export function node<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: () => Node,
): Node {
  const context = getContext();
  const child = context.beginChild(info);
  const skip = child.skipping();
  if (skip) return skip;
  try {
    const node = context === child ? fn() : withContext(child, fn);
    return child.end(node);
  } catch (e) {
    const result = child.endWithError(e);
    if (!result) throw e;
    return result;
  }
}
node[CstParserSymbol] = true;

export function nullableNode<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: () => Node | null,
): Node | null {
  const context = getContext();
  const child = context.beginChild(info);
  const skip = child.skipping();
  if (skip) return skip;
  child.hintType("nullable");
  try {
    const node = context === child ? fn() : withContext(child, fn);
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
nullableNode[CstParserSymbol] = true;

export function discardableNode<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: () => Node,
): Node | null {
  const context = getContext();
  const child = context.beginChild(info);
  const skip = child.skipping();
  if (skip) return skip;
  child.hintType("discardable");
  try {
    const node = context === child ? fn() : withContext(child, fn);
    return child.end(node);
  } catch (e) {
    // TODO
    return child.endWithError(e);
  }
}
discardableNode[CstParserSymbol] = true;

export function detachMap<Node extends CstNode, I, R>(
  n: CstNodeConstructor<{ value: R } & CstNode, [R]>,
  nodeFn: (info: CstNodeInfo<Node>, fn: () => I) => R,
): (info: CstNodeInfo<Node>, fn: () => I) => R {
  return (info, fn) => node(n, () => new n(nodeFn(info, fn))).value;
}

export function peek<R>(fn: () => R): R {
  return node(CstPeekNode<R>, () => new CstPeekNode(fn())).value;
}

export function peekNode<Node extends CstNode>(info: CstNodeInfo<Node>, fn: () => Node): Node {
  return node(CstPeekNode<Node>, () => new CstPeekNode(node(info, fn))).value;
}

export function peekNullable<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: () => Node | null,
): Node | null {
  return node(CstPeekNode<Node>, () => new CstPeekNode(nullableNode(info, fn))).value;
}

export function detached<R>(fn: () => R): R {
  return node(CstDetachedNode<R>, () => new CstDetachedNode(fn())).value;
}

export function detachedNode<Node extends CstNode>(info: CstNodeInfo<Node>, fn: () => Node): Node {
  return node(CstDetachedNode<Node>, () => new CstDetachedNode(node(info, fn))).value;
}

export function detachedNullable<Node extends CstNode>(
  info: CstNodeInfo<Node>,
  fn: () => Node | null,
): Node | null {
  return node(CstDetachedNode<Node>, () => new CstDetachedNode(nullableNode(info, fn))).value;
}
