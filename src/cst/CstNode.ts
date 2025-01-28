import type { Span } from "../token/Span.ts";
import { GetSpanSymbol, SpanGroupSymbol, type Spanned } from "../token/Spanned.ts";
import { dumpNode, dumpNodeEntries } from "../utils/debug.ts";
import { fmt, format, FormatObjectEntries, ToFormatString } from "../utils/format.ts";
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
    const tree = this.tree;
    // TODO: is this handling right? or maybe order of mapping inner group ->
    // mapping its content is right
    const previousItems = tree.shadowedGroups ? tree.shadowedGroups.at(-1)!.items : tree.items;
    const allItems = new Map<Spanned, CstTreeItem>(
      previousItems.map((item) => [item, fn(item)]),
    );

    const mapItem = <T extends Spanned>(span: T): T => {
      const getItem = (key: Spanned): any => {
        const item = allItems.get(key);
        if (!item) {
          throw new Error(fmt`no item for ${span}; this=${this}, items=${previousItems}`);
        }
        return item;
      };
      if (span instanceof Token) {
        return getItem(span) as T;
      }
      if (span instanceof CstNode) {
        return (getItem(span.tree) as CstTree<T & CstNode>).node;
      }
      if (span instanceof CstTree) throw new Error("unexpected CstTree in node");
      console.error("unsupported span", span);
      throw new Error("TODO: unsupported span");
      // return span;
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
      if (SpanGroupSymbol in value) {
        return value[SpanGroupSymbol].map(fn);
      }
      return fn(value);
    } else if (Array.isArray(value) && value.findIndex((el) => GetSpanSymbol in el) !== -1) {
      throw new Error("use CstArray instead of normal array to contain CstNode or Token.");
      // return value.map((el) => GetSpanSymbol in el ? fn(el) : el);
    } else {
      return value;
    }
  }

  /// Formatting

  @format.print
  dump(): string {
    return dumpNode(this);
  }

  get [FormatObjectEntries](): ReadonlyArray<readonly [any, any]> {
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
