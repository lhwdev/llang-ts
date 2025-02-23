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
  }
}

export type CstNodeHintType = "discardable" | "nullable" | object;

export interface CstParseContext<out Node extends CstNode = CstNode> {
  /// Code parsing
  code<R extends Token>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

  codeScopes: CstCodeScopes;

  /// Node management
  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child>;
  skipping(): Node | null;

  hintType(type: CstNodeHintType): void;

  memoize<T>(calculate: () => T, dependencies?: unknown[]): T;

  provideContext(value: ContextValue<any>): void;
  resolveContext<T>(key: ContextKey<T>): ContextValue<T>;

  beforeEnd(node: Node): CstTree<Node>;

  end(node: Node): Node;

  endWithError(error: unknown | null): Node | null;

  insertChild<Child extends CstNode>(node: Child): Child;
}

export class ContextKey<T> {
  declare private $ContextKey: void;

  constructor(readonly name?: string) {}

  provides(value: T): ContextValue<T> {
    return new ContextValue(this, value);
  }
}

export class ContextValue<T> {
  declare private $ContextValue: void;

  constructor(
    readonly key: ContextKey<T>,
    readonly value: T,
  ) {}
}

export namespace ContextKeys {
  export const ImplicitNode = new ContextKey<
    CstParser<CstNode, (() => CstNode | null)> | null
  >("ImplicitNode");

  export const IsImplicit = new ContextKey<boolean>("IsImplicit");

  export const CodeScopes = new ContextKey<CstCodeScopes>("CodeScopes");
  export const CodeScope = new ContextKey<CstCodeScope>("CodeScope");
}
