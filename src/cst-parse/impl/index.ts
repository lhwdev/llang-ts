import {
  CstDetachedNode,
  CstImplicitNode,
  CstPeekNode,
  CstSpecialNode,
} from "../../cst/CstSpecialNode.ts";
import { isInherited } from "../../utils/extends.ts";
import { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

export * from "./CstGroup.ts";
export * from "./CstIntermediateGroup.ts";
export * from "./CstIntermediateNode.ts";
export * from "./CstIntermediateRoot.ts";
export * from "./CstParseContextImpl.ts";
export * from "./CstStringTokenizerContext.ts";

CstIntermediateGroup.prototype.beginSpecialNode = function (info) {
  if (!isInherited(info, CstSpecialNode)) return null;
  switch (info) {
    case CstPeekNode:
      throw new Error("TODO");
    case CstDetachedNode:
      throw new Error("TODO");
    case CstImplicitNode:
      return null;
    default:
      throw new Error(`unknown special node ${info.name}`);
  }
};
