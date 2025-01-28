import {
  CstDetachedNode,
  CstImplicitNode,
  CstInsertedNode,
  CstPeekNode,
  CstSpecialNode,
} from "../../cst/CstSpecialNode.ts";
import { isInherited } from "../../utils/extends.ts";
import { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateInsertionRoot } from "./CstIntermediateInsertion.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";
import { CstIntermediatePeek } from "./CstIntermediatePeek.ts";

CstIntermediateGroup.prototype.beginSpecialNode = function (info) {
  if (!isInherited(info, CstSpecialNode)) return null;
  switch (info) {
    case CstPeekNode:
      return new CstIntermediatePeek(this, info);
    case CstDetachedNode:
      throw new Error("TODO");
    case CstInsertedNode:
      return new CstIntermediateInsertionRoot(this, info);
    case CstImplicitNode:
      return new CstIntermediateNode(this, info);
    default:
      throw new Error(`unknown special node ${info.name}`);
  }
};

CstIntermediateGroup.prototype.insertChild = function (node) {
  const child = this.beginChild(CstInsertedNode);
  if (!(child instanceof CstIntermediateInsertionRoot)) throw new Error("insertion not supported");
  return child.withSelf(() => child.insertRoot(node));
};

export * from "./CstGroup.ts";
export * from "./CstIntermediateGroup.ts";
export * from "./CstIntermediateNode.ts";
export * from "./CstIntermediateRoot.ts";
export * from "./CstParseContextImpl.ts";
export * from "./CstStringTokenizerContext.ts";
