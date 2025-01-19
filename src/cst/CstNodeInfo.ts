import type { CstNode } from "./CstNode.ts";

// Weird problem: Suppose A has abstract new () => T. If B extends A and
// declares new () => T, new b() says 'this is abstract': kinda weird

interface CstNodeCommon<out Node extends CstNode, Params extends unknown[] = any> {
  // TODO
  default?(): Node;

  nodeFlags?: {
    vital?: boolean;
  };
}

export type CstNodeInfo<Node extends CstNode, Params extends unknown[] = any> =
  & (abstract new (...args: Params) => Node)
  & CstNodeCommon<Node, Params>;

export type CstNodeConstructor<Node extends CstNode, Params extends unknown[] = any> =
  & (new (...args: Params) => Node)
  & CstNodeCommon<Node, Params>;
