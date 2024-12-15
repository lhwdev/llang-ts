import { variableWrapper } from "../utils/variableWrapper.ts";
import type { CstCodeContext } from "./CstCodeContext.ts";
import { getContext } from "./CstParseContext.ts";
import type { CstCodeScope, CstCodeScopes } from "./tokenizer/CstCodeScope.ts";

export function code<R>(fn: (code: CstCodeContext) => R): R;
export function code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

/**
 * One invocation of `code` should only parse one token in general. Implicit
 * nodes can be inserted between `code`.
 */
export function code<R>(a: any, b?: any): R {
  return getContext().code(a, b);
}

export function eof(): boolean {
  return code((c) => c.eof());
}

export const codeScopes: CstCodeScopes = variableWrapper(() => getContext().codeScopes);

/**
 * Enforce no implicit nodes are inserted within this node.
 * Should be called before accessing this context, like using {@link code} or
 * calling other parser function.
 */
export function noImplicitNodes() {
  getContext().noImplicitNodes();
}
