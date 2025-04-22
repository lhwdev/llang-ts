import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstTree, type CstTreeItem } from "../../cst/CstTree.ts";
import type { Spanned } from "../../token/Spanned.ts";
import { Token } from "../../token/Token.ts";

export class CstInsertedGroup extends CstTree {
  constructor(
    override readonly source: CstTree,
    override items: readonly CstTreeItem[],
  ) {
    super();

    this.children = this.items.filter((item) => item instanceof CstTree);
    this.tokens = this.items.filter((item) => item instanceof Token);
  }

  override node!: CstNode;

  override get info(): CstNodeInfo<any> {
    return this.source.info;
  }

  override get isAttached(): boolean {
    return true; // maybe need revisit
  }

  override children: readonly CstTree[];
  override tokens: readonly Token[];

  override get allSpans(): readonly Spanned[] {
    return this.items;
  }

  override get span() {
    return this.source.span;
  }
}
