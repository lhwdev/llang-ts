import type { CstNode } from "../cst/CstNode.ts";
import type { Token } from "../token/Token.ts";
import type { TokenKind } from "../token/TokenKind.ts";
import { variableWrapper } from "../utils/variableWrapper.ts";
import type { CstCodeContext } from "./CstCodeContext.ts";
import { type ContextKey, ContextKeys, type ContextValue, getContext } from "./CstParseContext.ts";
import type { CstParser } from "./parser.ts";
import type { CstCodeScope, CstCodeScopes } from "./tokenizer/CstCodeScope.ts";

export function memoize<T>(calculate: () => T, dependencies?: unknown[]): T {
  return getContext().memoize(calculate, dependencies);
}

export function code<R>(fn: (code: CstCodeContext) => R): R;
export function code<R>(scope: CstCodeScope | null, fn: (code: CstCodeContext) => R): R;

/**
 * One invocation of `code` should only parse one token in general. Implicit
 * nodes can be inserted between `code`.
 */
export function code<R>(a: any, b?: any): R {
  return getContext().code(a, b);
}

export namespace code {
  export function consume<Kind extends TokenKind>(
    token: Token<Kind>,
    scope?: CstCodeScope,
  ): Token<Kind> {
    return code(scope ?? null, (c) => c.consume(token));
  }
}

export function endOfCode(): boolean {
  return code((c) => c.end());
}

export const codeScopes: CstCodeScopes = variableWrapper(() => getContext().codeScopes);

export function insertNode<Node extends CstNode>(node: Node): Node {
  return getContext().insertChild(node);
}

export function provideContext(value: ContextValue<any>): void {
  getContext().provideContext(value);
}

export function useContext<T>(key: ContextKey<T>): T {
  return getContext().resolveContext(key).value;
}

export function useImplicitNode(
  parser: CstParser<CstNode, ((...args: any) => CstNode | null)> | null,
): void {
  getContext().provideContext(ContextKeys.ImplicitNode.provides(parser));
}

/**
 * Enforce no implicit nodes are inserted within this node.
 * Should be called before accessing this context, like using {@link code} or
 * calling other parser function.
 */
export function noImplicitNodes() {
  useImplicitNode(null);
}

export function enableDiscard() {
  getContext().hintType("discardable");
}
