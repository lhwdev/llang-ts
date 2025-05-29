import { cstImplicitList } from "../cst-parser/cstImplicit.ts";
import { testCstParse } from "./common.ts";

const testCode = `
  /* hi */  /*ho*/
`.trim();

testCstParse(testCode, () => {
  cstImplicitList();
});
