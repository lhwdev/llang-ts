import { dim, rgb8 } from "./ansi.ts";
import { CstNode } from "../cst/CstNode.ts";
import { Span } from "../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../token/Spanned.ts";
import { TokenKind } from "../token/TokenKind.ts";
import {
  classToStringEntry,
  fmt,
  FormatEntries,
  formatFor,
  formatRaw,
  objectLiteralToStringEntry,
} from "./format.ts";
import { type FormatEntry, formatFn } from "./format.ts";
import { CstTree } from "../cst/CstTree.ts";

export function dumpNode(node: CstNode): string {
  return formatFn(null, () => dumpNodeEntry(node));
}

export function dumpNodeEntries(node: CstNode): ReadonlyArray<readonly [any, any]> {
  let group = node.tree;
  if (!group || !(group instanceof CstTree)) {
    return [
      ["$formatter_error", fmt.red`"no 'tree' property for CstNode, tree=${group}"`],
      ...Object.entries(node),
    ];
  }
  if (group.shadowedGroups) {
    group = group.shadowedGroups.at(-1)!;
  }
  return formatFor(node, () => {
    const other = new Map<string, any>();
    const spannedMap = new Map<string, Spanned>();

    for (const [key, value] of Object.entries(node)) {
      if (key == "tree") continue;
      if (typeof value === "object" && value) {
        if (GetSpanSymbol in value) {
          spannedMap.set(key, value as Spanned);
          continue;
        }

        if (Array.isArray(value) && value.length) {
          let offset = -1;
          for (const item of value) {
            if (!(GetSpanSymbol in item)) break;
            const span = item[GetSpanSymbol] as Span;
            if (offset == -1 || offset == span.start) {
              offset = span.end;
            } else {
              throw new Error(`${value} is misaligned; span is not continuous`);
            }
          }
          if (offset != -1) {
            const result = [...value] as any;
            result[GetSpanSymbol] = new Span(value[0][GetSpanSymbol].start, offset);
            spannedMap.set(key, result as Spanned);
            continue;
          }
        }
      }
      other.set(key, value);
    }

    const errors = [];

    // sort spanned and add missing items
    const span = group[GetSpanSymbol];
    const treeSpans = group.allSpans;
    const propertySpans = Array.from(
      spannedMap.entries()
        .map(([key, spanned]) => [key, spanned] as const),
    );

    let treeIndex = 0;
    let propertyIndex = 0;
    const spans: (readonly [string, Spanned])[] = [];
    if (treeSpans.length || propertySpans.length) {
      const mapTree = (
        spanned: Spanned,
        index: number,
      ): readonly [string, Spanned] => [`_tree_${index}`, spanned];

      let offset = Math.min(
        treeSpans.at(0)?.[GetSpanSymbol].start ?? Infinity,
        propertySpans.at(0)?.[1][GetSpanSymbol].start ?? Infinity,
      );
      const discontinuous = [];
      const skipped = new Set<Spanned>();

      const addSpan = (item: readonly [string, Spanned]) => {
        const spanned = item[1];
        const span = spanned[GetSpanSymbol];
        if (span.start !== offset) discontinuous.push(offset);
        spans.push(item);
        skipped.delete(spanned);
        offset = span.end;
      };

      let count = 0;
      while (true) {
        if (count++ > 10) break;
        const property = propertySpans.at(propertyIndex);
        const tree = treeSpans.at(treeIndex);

        if (!property && !tree) break;
        if (!tree) {
          addSpan(property!);
          propertyIndex++;
          continue;
        }
        if (!property) {
          addSpan(mapTree(tree!, treeIndex));
          treeIndex++;
          continue;
        }

        const propertySpan = property[1][GetSpanSymbol];
        if (propertySpan.start < offset) {
          propertyIndex++;
          skipped.add(property[1]);
          continue;
        }
        const treeSpan = tree[GetSpanSymbol];
        if (treeSpan.start < offset) {
          treeIndex++;
          skipped.add(tree);
          continue;
        }

        if (propertySpan.start === treeSpan.start) {
          if (propertySpan.start !== offset) discontinuous.push(offset);
          if (propertySpan.end === treeSpan.end) {
            addSpan(property);
            propertyIndex++;
            treeIndex++;
            continue;
          }
          if (propertySpan.end < treeSpan.end) {
            throw new Error("TODO");
          }
          // propertySpan.end > treeSpan.end
          // in case of SpanGroup, property may span over multiple tree spans
          addSpan(property);
          propertyIndex++;

          let treeOffset = offset;
          while (treeOffset < propertySpan.end) {
            const tree = treeSpans.at(treeIndex++);
            if (!tree) break;
            const span = tree[GetSpanSymbol];
            if (treeOffset !== span.start) discontinuous.push(treeOffset);
            treeOffset = span.end;
          }
          if (treeOffset > propertySpan.end) {
            discontinuous.push(treeOffset);
            treeIndex--;
          }
        } else {
          if (propertySpan.start < treeSpan.start) {
            if (propertySpan.start !== offset) discontinuous.push(offset);
            addSpan(property);
            propertyIndex++;
          } else {
            if (treeSpan.start !== offset) discontinuous.push(offset);
            addSpan(mapTree(tree, treeIndex));
            treeIndex++;
          }
        }
      }

      if (skipped.size) {
        errors.push(fmt`skipped ${fmt.raw(skipped.values().toArray().join())}`);
      }
      if (discontinuous.length) {
        errors.push(fmt`spans discontinuous at ${fmt.raw(discontinuous.join(", "))}`);
      }
    }

    // Check if span is continuous
    if (spans.length && !span.invalid) {
      const start = spans.at(0)![1][GetSpanSymbol].start;
      if (start !== -1 && span.start !== start) {
        errors.push(fmt`span.start ${span.start} != allSpans[0].span.start ${start}`);
      }
      const end = spans.at(-1)![1][GetSpanSymbol].end;
      if (end !== -1 && span.end !== end) {
        errors.push(fmt`span.end ${span.end} != allSpans[0].span.end ${end}`);
      }
    }

    return [
      ...errors.length ? [[fmt.red`_error`, fmt.red(FormatEntries.join(errors))] as const] : [],
      ...other.entries(),
      ...spans,
    ];
  });
}

export function dumpNodeEntry(node: CstNode): FormatEntry {
  return formatRaw({
    oneLine: false,
    important: (value) => value instanceof CstNode,
    handleObject: (value) => {
      if (value instanceof CstNode) return dumpNodeEntry(value);
      if (value instanceof CstTree) return dumpNodeEntry(value.node);
      return classToStringEntry(value, true);
    },
  }, () => {
    let name = node.constructor.name;
    if (!name) name = Object.getPrototypeOf(node).constructor.name;

    const list = new FormatEntries.list();
    list.push(new FormatEntries.value(rgb8(name, 19)));

    const group = objectLiteralToStringEntry(
      node,
      " = ",
      (entry) => new FormatEntries.group(["(", false], entry, [")", false]),
      (key, _value, list) => key.startsWith("_") ? new FormatEntries.style(dim, list) : list,
    );
    list.push(group);
    return list;
  });
}

export function tokenKindNames(kind: TokenKind): string[] {
  const parents = [];
  let kindType = Object.getPrototypeOf(kind);
  while (kindType && kindType.constructor !== TokenKind) {
    if (parents.length > 12) return ["<recursive>"];
    parents.push(kindType.constructor.name);
    kindType = Object.getPrototypeOf(kindType);
  }
  return parents.reverse();
}

export function tokenKindName(kind: TokenKind): string {
  return tokenKindNames(kind).join(".");
}
