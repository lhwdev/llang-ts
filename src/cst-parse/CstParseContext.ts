import { variableWrapper } from "../utils/variableWrapper.ts";
import type { CstCodeContext } from "./CstCodeContext.ts";
import type { CstNode } from "./CstNode.ts";
import type { CstNodeInfo } from "./CstNodeInfo.ts";
import type { CstTree } from "./CstTree.ts";
import type { CstCodeScope, CstCodeScopes } from "./tokenizer/CstCodeScope.ts";

type RootContext = CstParseContext<never>;
let baseContext: RootContext | null = null;

export const context: RootContext = variableWrapper(() => baseContext!);

export function getContext(): RootContext {
  return baseContext!;
}

export function withContext<R>(context: CstParseContext<never>, fn: () => R): R {
  const previous = baseContext;
  baseContext = context;
  try {
    return fn();
  } finally {
    baseContext = previous;
  }
}

export type CstNodeHintType = "discardable";

export interface CstParseContext<Node extends CstNode> {
  /// Code parsing
  code<R>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

  codeScopes: CstCodeScopes;
  pushCodeScope(scope: CstCodeScope): void;

  /// Node management
  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child>;

  hintType(type: CstNodeHintType): void;

  noImplicitNodes(): void;

  beforeEnd(node: CstNode): CstTree;

  end(node: Node): Node;

  endWithError(error: unknown): Node | null;
}
