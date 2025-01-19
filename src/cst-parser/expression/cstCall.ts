import { parser } from "../../cst-parse/parser.ts";
import { CstCall, CstGetCall, CstLambdaCall, CstSimpleCall } from "../../cst/expression/CstCall.ts";
import type { CstExpression } from "../../cst/expression/CstExpression.ts";

export const cstCall = parser(CstCall, (fn: CstExpression) => {});

export const cstSimpleCall = parser(CstSimpleCall, (fn: CstExpression) => {});

export const cstLambdaCall = parser(CstLambdaCall, (fn: CstExpression) => {});

export const cstGetCall = parser(CstGetCall, (fn: CstExpression) => {});
