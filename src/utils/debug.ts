import { CstNode } from "../cst-parse/CstNode.ts";
import { Span } from "../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../token/Spanned.ts";
import { TokenKind } from "../token/TokenKind.ts";
import type { TokenKinds } from "../token/TokenKinds.ts";
import { classToStringEntry, FormatEntries, formatRaw, objectToStringEntry } from "./format.ts";
import { type FormatEntry, formatFn } from "./format.ts";
import { bold, dim } from "@std/fmt/colors";

export function dumpNode(node: CstNode): string {
  return formatFn(null, () => dumpNodeEntry(node));
}

export function dumpNodeEntries(node: CstNode): readonly [any, any][] {
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
  const span = node[GetSpanSymbol];
  const sortedSpan = Array.from(
    spannedMap.entries()
      .map(([key, spanned]) => [key, spanned, spanned[GetSpanSymbol]] as const),
  ).sort((a, b) => b[2].start - a[2].start);

  const spans: [string, Spanned][] = [];
  let tempSpansIndex = 0;
  let offset = span.start;

  let sortedIndex = 0;
  const allSpans = node.tree.allSpans;
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
}

export function dumpNodeEntry(node: CstNode): FormatEntry {
  return formatRaw({
    oneLine: false,
    important: (value) => value instanceof CstNode,
    handleObject: (value) => {
      if (value instanceof CstNode) return dumpNodeEntry(value);
      return classToStringEntry(value);
    },
  }, () => {
    const list = new FormatEntries.list();
    list.push(new FormatEntries.value(bold(node.constructor.name)));

    const group = objectToStringEntry(
      node,
      " = ",
      (entry) => new FormatEntries.group(["(", false], entry, [")", false]),
      (key, _value, list) => key.startsWith("_") ? new FormatEntries.style(dim, list) : list,
    );
    list.push(group);
    return list;
  });
}

export function tokenKindName(kind: TokenKind): string {
  const kindsName = (kinds: { constructor: TokenKinds }): string => {
    if (kinds.constructor === TokenKind) return "";
    return `${kindsName(Object.getPrototypeOf(kinds))}.${kinds.constructor.name}`;
  };
  return kindsName(Object.getPrototypeOf(kind)).slice(1);
}
