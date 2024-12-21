import { withContext } from "./cst-parse/CstParseContext.ts";
import { CstParseContextImpl } from "./cst-parse/internal/CstParseContextImpl.ts";
import { CstStringTokenizerContext } from "./cst-parse/internal/CstStringTokenizerContext.ts";
import { eof } from "./cst-parse/intrinsics.ts";
import { cstLiteral } from "./parser/expression/cstLiteral.ts";

(Error as any).stackTraceLimit = Infinity;

const testCode = `"hello, world!" /*this is comment*/ 123`;

const tokenizer = new CstStringTokenizerContext(testCode);
const context = new CstParseContextImpl<never>(tokenizer);

withContext(context, () => {
  while (!eof()) {
    const node = cstLiteral();
    if (node) {
      console.log(node.dump());
    }
  }
});
