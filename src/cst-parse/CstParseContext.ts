import type { CstCodeContext, CstCodeScope } from "./CstCodeContext.ts";
import type { CstNode } from "./CstNode.ts";
import type { CstNodeInfo } from "./CstNodeInfo.ts";
import type { CstTree } from "./CstTree.ts";

let baseContext: CstParseContext<never> | null = null;

type RootContext = CstParseContext<never> & { base: CstParseContext<never> };

export const context: RootContext = new Proxy({}, {
  has: (_, p) => Reflect.has(baseContext!, p),
  get: (_, p, receiver) => p === "base" ? baseContext : Reflect.get(baseContext!, p, receiver),
  set: (_, p, newValue, receiver) => Reflect.set(baseContext!, p, newValue, receiver),
}) as RootContext;

export function withContext<R>(context: CstParseContext<never>, fn: () => R): R {
  const previous = baseContext;
  baseContext = context;
  try {
    return fn();
  } finally {
    baseContext = previous;
  }
}

export interface CstParseContext<Node extends CstNode> {
  /// Code parsing
  code<R>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

  noImplicitNodes(): void;

  /// Node management
  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child>;

  beforeEnd(node: CstNode): CstTree;

  end(node: Node): Node;

  endWithError(error: unknown): Node | null;
}
