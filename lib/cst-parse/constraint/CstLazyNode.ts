import type { Value } from "../../utils/Value.ts";

export class CstLazyNode<Node> implements Value<Node> {
  constructor(readonly back: Value<Node>) {}

  get value(): Node {
    return this.back.value;
  }

  map<U>(fn: (value: Node) => U): CstLazyNode<U> {
    return new CstLazyNode(this.back.map(fn));
  }
}
