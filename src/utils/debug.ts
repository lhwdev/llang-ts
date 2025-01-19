import { dim, rgb8 } from "./colors.ts";
import { CstNode } from "../cst/CstNode.ts";
import { Span } from "../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../token/Spanned.ts";
import { TokenKind } from "../token/TokenKind.ts";
import {
  classToStringEntry,
  FormatEntries,
  formatFor,
  formatRaw,
  objectLiteralToStringEntry,
} from "./format.ts";
import { type FormatEntry, formatFn } from "./format.ts";
import { CstGroup } from "../cst-parse/internal_old/CstGroup.ts";

export function dumpNode(node: CstNode): string {
  return formatFn(null, () => dumpNodeEntry(node));
}

export function dumpNodeEntries(node: CstNode): readonly [any, any][] {
  let group = node.tree;
  if (group instanceof CstGroup && group.shadowedGroups) {
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

    // sort spanned and add missing items
    let span: Pick<Span, "start" | "end"> = group[GetSpanSymbol];
    const sortedSpan = Array.from(
      spannedMap.entries()
        .map(([key, spanned]) => [key, spanned, spanned[GetSpanSymbol]] as const),
    ).sort((a, b) => b[2].start - a[2].start);
    const allSpans = group.allSpans;

    if (allSpans.length > 0) {
      const start = allSpans[0][GetSpanSymbol].start;
      const end = allSpans.at(-1)![GetSpanSymbol].end;
      if (start !== span.start || end != span.end) {
        console.error(
          `dump(${node.constructor.name}): span misaligned inferred=${start}..<${end} actual=${span}`,
        );
        console.error(allSpans);
      }
      span = { start, end };
    }

    const spans: [string, Spanned][] = [];
    let tempSpansIndex = 0;
    let offset = span.start;

    let sortedIndex = 0;
    let allSpansIndex = 0;
    while (offset < span.end) {
      if (sortedIndex < sortedSpan.length) {
        const [key, value, span] = sortedSpan[sortedIndex];
        if (offset >= span.start) {
          if (offset == span.start) {
            spans.push([key, value]);
            offset = span.end;
          }
          sortedIndex++;
          continue;
        }

        // offset < span.start: find other spanned from tree
      }

      // we have missing ones
      while (
        allSpansIndex < allSpans.length && allSpans[allSpansIndex][GetSpanSymbol].start < offset
      ) {
        allSpansIndex++;
      }
      const spanned = allSpans[allSpansIndex];
      const span = spanned[GetSpanSymbol];
      if (span.start !== offset) {
        throw new Error("whoosh mismatch");
      }
      spans.push([`_tree_${tempSpansIndex++}`, spanned]);
      offset = span.end;
      allSpansIndex++;
    }
    if (offset != span.end) throw new Error("offset != span.end");

    return [
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
      if (value instanceof CstGroup) return dumpNodeEntry(value.node);
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
