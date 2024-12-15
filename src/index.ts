import { withContext } from "./cst-parse/CstParseContext.ts";
import { CstParseContextImpl } from "./cst-parse/internal/CstParseContextImpl.ts";
import { CstStringTokenizerContext } from "./cst-parse/internal/CstStringTokenizerContext.ts";
import { eof, noImplicitNodes } from "./cst-parse/intrinsics.ts";
import { cstImplicitOrNull } from "./parser/cstImplicit.ts";

(Error as any).stackTraceLimit = Infinity;

const testCode = ` \n/* hi *///ho\n `;

const tokenizer = new CstStringTokenizerContext(testCode);
const context = new CstParseContextImpl<never>(tokenizer);

withContext(context, () => {
  noImplicitNodes();
  while (!eof()) {
    const node = cstImplicitOrNull();
    if (node) {
      console.log(node.dump());
    }
  }
});
