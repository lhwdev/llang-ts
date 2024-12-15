import { withContext } from "./cst-parse/CstParseContext.ts";
import { CstParseContextImpl } from "./cst-parse/internal/CstParseContextImpl.ts";
import { CstStringTokenizerContext } from "./cst-parse/internal/CstStringTokenizerContext.ts";
import { eof } from "./cst-parse/intrinsics.ts";
import { cstImplicitOrNull } from "./parser/cstImplicit.ts";
import { dumpNode } from "./utils/debug.ts";

const testCode = ` \n/* hi *///ho\n`;

const tokenizer = new CstStringTokenizerContext(testCode);
const context = new CstParseContextImpl<never>(tokenizer);

withContext(context, () => {
  while (!eof()) {
    const node = cstImplicitOrNull();
    if (node) {
      console.log(dumpNode(node));
    }
  }
});
