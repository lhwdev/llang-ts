import { withContext } from "./cst-parse/CstParseContext.ts";
import { detachedNode, node, peek } from "./cst-parse/inlineNode.ts";
import { CstParseContextImpl } from "./cst-parse/internal_old/CstParseContextImpl.ts";
import { CstStringTokenizerContext } from "./cst-parse/internal_old/CstStringTokenizerContext.ts";
import { insertNode } from "./cst-parse/intrinsics.ts";
import { cstLiteral } from "./cst-parser/expression/cstLiteral.ts";
import { CstSimpleCall, CstValueArguments } from "./cst/expression/CstCall.ts";

(Error as any).stackTraceLimit = Infinity;

const testCode = `"hello, world!" /*this is comment*/ 123`;

const tokenizer = new CstStringTokenizerContext(testCode);
const context = new CstParseContextImpl<never>(tokenizer);

withContext(context, () => {
  const str = peek(() => cstLiteral());
  const whoosh = detachedNode(
    CstSimpleCall,
    () =>
      new CstSimpleCall(
        insertNode(str),
        null,
        node(CstValueArguments, () => new CstValueArguments([])),
      ),
  );
  console.log(whoosh);
});
