import type { Token } from "../token/Token.ts";
import type { CstCodeContext } from "./CstCodeContext.ts";
import type { CstNode } from "../cst/CstNode.ts";
import type { CstNodeInfo } from "../cst/CstNodeInfo.ts";
import type { CstTree } from "../cst/CstTree.ts";
import type { CstCodeScope, CstCodeScopes } from "./tokenizer/CstCodeScope.ts";
import type { CstParser } from "./parser.ts";

let baseContext: CstParseContext | null = null;

export function getContext(): CstParseContext {
  return baseContext!;
}

export function withContext<R>(context: CstParseContext<any>, fn: () => R): R {
  const previous = baseContext;
  if (previous === context) return fn();

  baseContext = context;
  try {
    return fn();
  } finally {
    baseContext = previous;
    (context as any).flushLog();
  }
}

export type CstNodeHintType = "discardable";

export interface CstParseContext<out Node extends CstNode = CstNode> {
  /// Code parsing
  code<R extends Token>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

  codeScopes: CstCodeScopes;

  /// Node management
  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child>;

  hintType(type: CstNodeHintType): void;

  provideContext(value: ContextValue<any>): void;

  beforeEnd(node: Node): CstTree<Node>;

  end(node: Node): Node;

  endWithError(error: unknown | null): Node | null;

  insertChild<Child extends CstNode>(node: Child): Child;
}

export class ContextKey<T> {
  constructor(readonly name?: string) {}

  provides(value: T): ContextValue<T> {
    return { key: this, value };
  }
}

export interface ContextValue<T> {
  key: ContextKey<T>;
  value: T;
}

export namespace ContextKeys {
  export const ImplicitNode = new ContextKey<
    CstParser<CstNode, (() => CstNode | null)> | null
  >("ImplicitNode");

  export const IsImplicit = new ContextKey<boolean>("IsImplicit");

  export const CodeScopes = new ContextKey<CstCodeScopes>("CodeScopes");
}
