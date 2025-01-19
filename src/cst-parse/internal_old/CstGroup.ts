import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstTree, type CstTreeItem } from "../../cst/CstTree.ts";
import { Span } from "../../token/Span.ts";
import type { Spanned } from "../../token/Spanned.ts";
import type { Token } from "../../token/Token.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

// Some note: why I used `declare property ...` instead of normal?
// To align behavior with recent ecmascript class, all properties of TS class
// are initialized with undefined, even if being optional property and not
// assigned with value. To save some memory, I decided to use `declare`.

export class CstGroup extends CstTree {
  constructor(
    intermediate: CstIntermediateGroup,
    override readonly node: CstNode,
  ) {
    super();

    this.isAttached = intermediate.isAttached ?? true;

    this.info = intermediate.info;
    this.span = new Span(intermediate.spanStart, intermediate.spanEnd);
    this.children = intermediate.children;
    this.tokens = intermediate.tokens;
    this.items = intermediate.allItems;
  }

  override info: CstNodeInfo<any>;

  declare private _source?: CstTree;
  override get source(): CstTree {
    return this._source ?? this;
  }

  override isAttached: boolean;

  override span: Span;
  override children: readonly CstTree[];
  override tokens: readonly Token[];
  override items: readonly CstTreeItem[];

  override get allSpans(): readonly Spanned[] {
    return this.items;
  }

  // Used to support returning as-is parser
  declare shadowedGroups?: CstTree[];

  realizeOffsetForEmpty(offset: number) {
    console.log(`realizeOffsetForEmpty this=${this.node.tree.constructor.name}`);
    if (!this.span.invalid) throw new Error("should be only called for invalid group");
    const span = new Span(offset, offset);

    const visit = (tree: CstTree) => {
      if (tree instanceof CstGroup) tree.span = span;
      for (const child of tree.children) {
        if (child.isAttached) visit(child);
      }
    };
    visit(this);
  }
}
