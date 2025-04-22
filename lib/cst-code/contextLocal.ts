import type { CstCodeContext } from "../cst-parse/CstCodeContext.ts";
import { CstContextLocalKey } from "../cst-parse/intermediate/CstContextLocal.ts";
import { useContext } from "../cst-parse/intrinsics.ts";
import type { CstCodeScope } from "./tokenizer/CstCodeScope.ts";

export abstract class CstCodeContextLocal {
  static Key = new CstContextLocalKey<CstCodeContextLocal>("CstCodeContextLocal");
  static get current(): CstCodeContextLocal {
    return useContext(this.Key);
  }

  abstract code<R>(scope: CstCodeScope | null, fn: (code: CstCodeContext) => R): R;

  abstract readonly codeScopes: unknown;
}
