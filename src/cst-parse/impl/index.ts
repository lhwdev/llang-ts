import {
  CstConstraintNodeRoot,
  CstDetachedNode,
  CstImplicitNode,
  CstInsertedNode,
  CstPeekNode,
  CstSpecialNode,
} from "../CstSpecialNode.ts";
import { isInherited } from "../../utils/extends.ts";
import { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateInsertionRoot } from "./CstIntermediateInsertion.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";
import { CstIntermediatePeek } from "./CstIntermediatePeek.ts";
import { CstIntermediateConstraintRoot } from "./CstIntermediateConstraint.ts";

CstIntermediateGroup.prototype.beginSpecialNode = function (info) {
  if (!isInherited(info, CstSpecialNode)) return null;
  switch (info as any) {
    case CstPeekNode:
      return new (this.childInstance(CstIntermediatePeek))(this, info);
    case CstDetachedNode:
      throw new Error("TODO");
    case CstImplicitNode:
      return new (this.childInstance(CstIntermediateNode))(this, info);

    default:
      return null;
  }
};

CstIntermediateGroup.prototype.createSpecialChild = function (info) {
  if (!isInherited(info, CstSpecialNode)) return null;
  switch (info as any) {
    case CstInsertedNode:
      return new (this.childInstance(CstIntermediateInsertionRoot))(this, info);
    case CstConstraintNodeRoot:
      return new (this.childInstance(CstIntermediateConstraintRoot))(this, info as any);

    default:
      throw new Error(`unknown special node ${info.name}`);
  }
};

CstIntermediateGroup.prototype.insertChild = function (node) {
  const child = this.beginChild(CstInsertedNode);
  if (!(child instanceof CstIntermediateInsertionRoot)) throw new Error("insertion not supported");
  return child.withSelf(() => child.skipping() ?? child.insertRoot(node));
};

export * from "./CstGroup.ts";
export * from "./CstIntermediateGroup.ts";
export * from "./CstIntermediateNode.ts";
export * from "./CstIntermediateRoot.ts";
export * from "./CstParseContextImpl.ts";
export * from "./CstStringTokenizerContext.ts";
