import type { Token } from "../token/Token.ts";
import type { TokenKind } from "../token/TokenKind.ts";
import type { CstCodeContext } from "./CstCodeContext.ts";
import type { CstCodeScope } from "./tokenizer/CstCodeScope.ts";
import { CstCodeContextLocal } from "./CstCodeContextLocal.ts";

// export namespace memoize {
//   export const OnRemembered = Symbol("OnRemembered");
//   export const OnForgotten = Symbol("OnForgotten");
// }

export function code<R>(fn: (code: CstCodeContext) => R): R;
export function code<R>(scope: CstCodeScope | null, fn: (code: CstCodeContext) => R): R;
/**
 * One invocation of `code` should only parse one token in general. Implicit
 * nodes can be inserted between `code`.
 */

export function code<R>(a: any, b?: any): R {
  if (b) {
    return CstCodeContextLocal.current.code(a, b);
  } else {
    return CstCodeContextLocal.current.code(null, a);
  }
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
