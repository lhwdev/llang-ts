import { CstNode } from "./CstNode.ts";

export class CstSpecialNode extends CstNode {
  declare private $special: void;
}

export class CstPeekNode<Value> extends CstSpecialNode {
  declare private $special_peek: void;

  constructor(readonly value: Value) {
    super();
  }
}

export class CstDetachedNode<Value> extends CstSpecialNode {
  declare private $special_detached: void;

  constructor(readonly value: Value) {
    super();
  }
}

export class CstInsertedNode<Node extends CstNode> extends CstSpecialNode {
  declare private $special_inserted: void;

  constructor(readonly value: Node) {
    super();
  }
}

export class CstImplicitNode extends CstSpecialNode {
  declare private $special_implicit: void;
}
