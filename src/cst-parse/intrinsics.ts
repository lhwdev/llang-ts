import { variableWrapper } from "../utils/variableWrapper.ts";
import type { CstCodeContext } from "./CstCodeContext.ts";
import { context } from "./CstParseContext.ts";
import type { CstCodeScope, CstCodeScopes } from "./tokenizer/CstCodeScope.ts";

export function code<R>(fn: (code: CstCodeContext) => R): R;
export function code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

/**
 * One invocation of `code` should only parse one token in general. Implicit
 * nodes can be inserted between `code`.
 */
export function code<R>(a: any, b?: any): R {
  return context.code(a, b);
}

export const codeScopes: CstCodeScopes = variableWrapper(() => context.codeScopes);

/**
 * Enforce no implicit nodes are inserted within this node.
 * Should be called before accessing this context, like using {@link code} or
 * calling other parser function.
 */
export function noImplicitNodes() {
  context.noImplicitNodes();
}
