import type { Span } from "../token/Span.ts";
import { GetSpanSymbol, SpanGroupSymbol, type Spanned } from "../token/Spanned.ts";
import { dumpNode, dumpNodeEntries } from "../utils/debug.ts";
import { fmt, format, FormatObjectEntries, ToFormatString } from "../utils/format.ts";
import { CstTree, type CstTreeItem } from "./CstTree.ts";
import { Token } from "../token/Token.ts";
import { detailedError } from "../common/error.ts";
import { currentGroup } from "../cst-parse/intermediate/currentGroup.ts";

export class CstNode implements Spanned {
  declare private $cstNode: void;

  tree: CstTree<this> = currentGroup().beforeEnd(this) as CstTree<this>;

  constructor() {}

  get [GetSpanSymbol](): Span {
    return this.tree[GetSpanSymbol];
  }

  /// Utilities
  copy(newTree: CstTree = this.tree): this {
    const newNode = {} as any;
    for (const [key, value] of this.getOwnProperties()) {
      newNode[key] = value;
    }
    newNode.tree = newTree;
    Object.setPrototypeOf(newNode, Object.getPrototypeOf(this));
    return newNode;
  }

  map<Node extends CstNode>(fn: (node: this) => Node): Node {
    throw new Error(`TODO ${fn}`);
    // const tree = this.tree;
    // const context = {
    //   beforeEnd(node) {
    //     tree.node = node as any;
    //     return tree;
    //   },
    // } satisfies Partial<CstParseContext>;

    // Object.setPrototypeOf(context, getContext());
    // return withContext(context as unknown as CstParseContext, () => fn(this));
  }

  walkEach(
    fn: (
      item: CstTreeItem,
      property: { key: PropertyKey; value: Spanned; groupIndex?: number } | null,
    ) => void,
  ): void {
    const tree = this.tree;
    const items = tree.shadowedGroups ? tree.shadowedGroups.at(-1)!.items : tree.items;
    const properties: ({ key: PropertyKey; value: Spanned; groupIndex?: number } | null)[] = Array(
      items.length,
    );

    for (const entry of this.getOwnProperties()) {
      const [key, value] = entry;
      const findIndex = (property: Spanned) => {
        const span = property[GetSpanSymbol];
        for (const [index, item] of items.entries()) {
          if (span.start <= item.span.start) {
            if (!span.equals(item.span)) console.error("span mismatch", span, item);
            return index;
          }
        }
        return null;
      };
      const addProperty = (key: PropertyKey, property: Spanned) => {
        const index = findIndex(property);
        if (!index) {
          detailedError`
            ${fmt.symbol("property.span.start")} > ${fmt.symbol("this.span.start")}
            - ${fmt.brightYellow("property")} = ${property}
            - ${fmt.brightYellow("this")} = ${this}
          `;
          return;
        }
        properties[index] = { key, value: property };
      };

      if (typeof value === "object" && value && GetSpanSymbol in value) {
        if (SpanGroupSymbol in value) {
          const children: Spanned[] = value[SpanGroupSymbol];
          if (!children.length) continue;

          const start = findIndex(children[0]);
          if (!start) continue;
          for (const [index, child] of children.entries()) {
            const itemIndex = start + index;
            const item = items[itemIndex];
            if (!child[GetSpanSymbol].equals(item.span)) {
              console.error("span mismatch", child, item);
            }
            properties[itemIndex] = { key, value: child, groupIndex: index };
          }
        } else {
          addProperty(key, value);
        }
      } else if (Array.isArray(value) && value.findIndex((el) => GetSpanSymbol in el) !== -1) {
        throw new Error("use CstArray instead of normal array to contain CstNode or Token.");
        // return value.map((el) => GetSpanSymbol in el ? fn(el) : el);
      } else {
        return value;
      }
    }

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const property = properties[index];

      fn(item, property);
    }
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
          throw new Error(fmt`no item for ${span}; this=${this}, items=${previousItems}`.s);
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
    for (const [key, value] of this.getOwnProperties()) {
      newNode[key] = this.mapOwnProperty(key, value, mapItem);
    }
    newNode.tree = this.tree;
    Object.setPrototypeOf(newNode, Object.getPrototypeOf(this));
    return newNode;
  }

  protected mapOwnProperty(
    _key: PropertyKey,
    value: any,
    fn: <T extends Spanned>(span: T) => T,
  ): any {
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

  protected getOwnProperties(): readonly [PropertyKey, any][] {
    return Reflect.ownKeys(this)
      .filter((key) => key !== "tree")
      .map((key) => [key, (this as any)[key]]);
  }

  /// Formatting

  @format.representation
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
