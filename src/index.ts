import "./test/constraintNodeTest.ts";

// import { withContext } from "./cst-parse/CstParseContext.ts";
// import { CstParseContextImpl, CstStringTokenizerContext } from "./cst-parse/impl/index.ts";
// import { node, peek } from "./cst-parse/inlineNode.ts";
// import { insertNode } from "./cst-parse/intrinsics.ts";
// import { CodeScopesImpl } from "./cst-parse/tokenizer/scopes.ts";
// import { cstImplicitOrNull } from "./cst-parser/cstImplicit.ts";
// import { cstLiteral } from "./cst-parser/expression/cstLiteral.ts";
// import { CstArray } from "./cst/CstArray.ts";
// import {
//   CstSimpleCall,
//   type CstValueArgumentItem,
//   CstValueArguments,
// } from "./cst/expression/CstCall.ts";

// (Error as any).stackTraceLimit = Infinity;

// const testCode = `"hello, world!" /*this is comment*/ 123`;

// const tokenizer = new CstStringTokenizerContext(testCode);
// const context = new CstParseContextImpl<never>(tokenizer);

// context.provideRootContexts({
//   codeScopes: new CodeScopesImpl(tokenizer),
//   implicitNode: cstImplicitOrNull,
// });

// withContext(context, () => {
//   const str = peek(() => cstLiteral());
//   const whoosh = node(
//     CstSimpleCall,
//     () =>
//       new CstSimpleCall(
//         insertNode(str),
//         null,
//         node(CstValueArguments, () => new CstValueArguments(new CstArray<CstValueArgumentItem>())),
//       ),
//   );
//   console.log("==========================");
//   console.log(whoosh.dump());
// });
