import type { Span } from "../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../token/Spanned.ts";
import { dumpNode, dumpNodeEntries } from "../utils/debug.ts";
import { format, FormatObjectEntries, ToFormatString } from "../utils/format.ts";
import { type CstParseContext, getContext, withContext } from "../cst-parse/CstParseContext.ts";
import { CstTree, type CstTreeItem } from "./CstTree.ts";
import { Token } from "../token/Token.ts";

export class CstNode implements Spanned {
  tree: CstTree<this> = getContext().beforeEnd(this) as CstTree<this>;

  constructor() {}

  declare private $cstNode: void;

  get [GetSpanSymbol](): Span {
    return this.tree[GetSpanSymbol];
  }

  /// Utilities
  copy(newTree: CstTree = this.tree): this {
    const newNode = {} as any;
    for (const key of Object.getOwnPropertyNames(this)) {
      newNode[key] = (this as any)[key];
    }
    for (const key of Object.getOwnPropertySymbols(this)) {
      newNode[key] = (this as any)[key];
    }
    newNode.tree = newTree;
    Object.setPrototypeOf(newNode, Object.getPrototypeOf(this));
    return newNode;
  }

  map<Node extends CstNode>(fn: (node: this) => Node): Node {
    const tree = this.tree;
    const context = {
      beforeEnd(node) {
        tree.node = node as any;
        return tree;
      },
    } satisfies Partial<CstParseContext>;

    Object.setPrototypeOf(context, getContext());
    return withContext(context as unknown as CstParseContext, () => fn(this));
  }

  mapEach(fn: <T extends CstTreeItem>(item: T) => T): this {
    if (this.tree.shadowedGroups) {
    }

    const previousAllItems = this.tree.items;
    const allItems = new Map<Spanned, CstTreeItem>(
      previousAllItems.map((item) => [item, fn(item)]),
    );

    const mapItem = <T extends Spanned>(span: T): T => {
      if (span instanceof Token) {
        return allItems.get(span) as unknown as T;
      }
      if (span instanceof CstNode) {
        return (allItems.get(span) as unknown as CstTree<T & CstNode>).node;
      }
      if (span instanceof CstTree) throw new Error("unexpected CstTree in node");
      return span;
    };

    const newNode = {} as any;
    for (const key of Object.getOwnPropertyNames(this)) {
      if (key === "tree") continue;
      newNode[key] = this.mapOwnProperty((this as any)[key], mapItem);
    }
    for (const key of Object.getOwnPropertySymbols(this)) {
      newNode[key] = this.mapOwnProperty((this as any)[key], mapItem);
    }
    newNode.tree = this.tree;
    Object.setPrototypeOf(newNode, Object.getPrototypeOf(this));
    return newNode;
  }

  protected mapOwnProperty(value: any, fn: <T extends Spanned>(span: T) => T): any {
    if (typeof value === "object" && value && GetSpanSymbol in value) {
      return fn(value);
    } else {
      return value;
    }
  }

  /// Formatting

  @format.print
  dump(): string {
    return dumpNode(this);
  }

  get [FormatObjectEntries](): readonly [any, any][] {
    return dumpNodeEntries(this);
  }

  toString(): string {
    return this.dump();
  }

  // Formatting for CstNodeInfo
  static [ToFormatString]() {
    return this.name;
  }
}
