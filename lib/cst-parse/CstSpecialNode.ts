import { CstNode } from "../cst/CstNode.ts";
import type { CstNodeInfo } from "../cst/CstNodeInfo.ts";
import { CstParseIntrinsicKey } from "./intermediate/CstParseIntrinsics.ts";

export interface CstSpecialNodeInfo<Node extends CstNode> extends CstNodeInfo<Node> {}

export class CstSpecialNode extends CstNode {
  declare private $special: void;
}

export class CstPeekNode<Value> extends CstSpecialNode {
  declare private $special_peek: void;

  constructor(readonly value: Value) {
    super();
  }
}

export class CstImplicitNode extends CstSpecialNode {
  declare private $special_implicit: void;

  constructor(readonly node: CstNode) {
    super();
  }
}

export class CstInsertedNode<Node extends CstNode> extends CstSpecialNode {
  declare private $special_inserted: void;

  constructor(readonly value: Node) {
    super();
  }

  static intrinsic = new CstParseIntrinsicKey.Global<
    { insertNode<Child extends CstNode>(node: Child): Child }
  >("InsertedNode");
}

export class CstConstraintNodeRoot<Value> extends CstSpecialNode {
  declare private $special_repeat: void;

  constructor(readonly value: Value) {
    super();
  }
}
