import { withContext } from "../cst-parse/CstParseContext.ts";
import { CstParseContextImpl, CstStringTokenizerContext } from "../cst-parse/impl/index.ts";
import { CodeScopesImpl } from "../cst-parse/tokenizer/scopes.ts";
import { cstImplicitList } from "../cst-parser/cstImplicit.ts";
import { fmt } from "../utils/format.ts";

(Error as any).stackTraceLimit = Infinity;

export function testCstParse(testCode: string, fn: () => void) {
  const tokenizer = new CstStringTokenizerContext(testCode);
  const context = new CstParseContextImpl<never>(tokenizer);

  context.provideRootContexts({
    codeScopes: new CodeScopesImpl(tokenizer),
    implicitNode: cstImplicitList,
  });

  const startTime = performance.now();
  try {
    withContext(context, fn);
  } finally {
    console.log(fmt`parsing took ${Math.round((performance.now() - startTime) * 100) / 100} ms`.s);
  }
}
