import { CstCodeContextLocal } from "../../lib/cst-code/CstCodeContextLocal.ts";
import { variableWrapper } from "../../lib/utils/variableWrapper.ts";
import type { CodeScopes } from "./scopes.ts";

export const codeScopes: CodeScopes = variableWrapper(() =>
  CstCodeContextLocal.current.codeScopes as any
);
