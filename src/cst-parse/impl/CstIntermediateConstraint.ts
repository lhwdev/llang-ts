import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { isInherited } from "../../utils/extends.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type { CstParseContext } from "../CstParseContext.ts";
import type { CstConstraintNodeRoot } from "../CstSpecialNode.ts";
import type { CstRepeatNodeInfo } from "../constraintNode.ts";
import { CstConstraintNode, CstMaybeNode, CstRepeatNode } from "../constraintNode.ts";
import type { CstCodeScope } from "../tokenizer/CstCodeScope.ts";
import type { CstGroupItem } from "./CstGroup.ts";
import {
  CstChildParseContext,
  type CstParseContextParent,
  CstSingleGroupParseContext,
} from "./CstGroupParseContext.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";

export class CstIntermediateConstraintRoot extends CstIntermediateNode {
  readonly children: CstIntermediateConstraint[] = [];

  constructor(
    parent: CstIntermediateGroup,
    override readonly info: CstNodeInfo<CstConstraintNodeRoot<any>>,
  ) {
    super(parent, info);
  }

  override createUniqueContext(parent: CstParseContextParent): CstParseContext | null {
    return new ConstraintRootParseContext(parent, this);
  }

  override code<R>(_scope: CstCodeScope, _fn: (code: CstCodeContext) => R): R {
    throw new Error("cannot use code() directly inside repeat; surround with other node");
  }

  protected override addItem(item: CstGroupItem): void {
    if (!(item instanceof CstIntermediateConstraint)) {
      throw new Error(`cannot add ${item}`);
    }
    this.children.push(item);
  }

  override createSpecialChild(info: CstNodeInfo<any>): CstIntermediateGroup | null {
    if (!isInherited(info, CstConstraintNode)) return null;
    switch (info as any) {
      case CstMaybeNode:
        throw new Error("TODO");
    }
    if (isInherited(info, CstRepeatNode)) {
      return new CstIntermediateRepeat(this, info as unknown as CstRepeatNodeInfo<any>);
    }
    throw new Error("unknown constraint node");
  }

  protected override createChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    return new CstIntermediateConstraint(this, info);
  }
}

class CstIntermediateConstraint extends CstIntermediateNode {
  constructor(
    override readonly parent: CstIntermediateConstraintRoot,
    info: CstNodeInfo<any>,
  ) {
    super(parent, info);
  }
}

class CstIntermediateRepeat extends CstIntermediateConstraint {
  constructor(
    parent: CstIntermediateConstraintRoot,
    override readonly info: CstRepeatNodeInfo<any>,
  ) {
    super(parent, info);
  }
}

class ConstraintRootParseContext<Node extends CstConstraintNodeRoot<any>>
  extends CstSingleGroupParseContext<Node> {
  constructor(
    override readonly parent: CstParseContextParent,
    override readonly current: CstIntermediateGroup,
  ) {
    super();
  }

  override childContext(group: CstIntermediateGroup): CstParseContext<any> {
    return CstChildParseContext.create(this, group);
  }
}
