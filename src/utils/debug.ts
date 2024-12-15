import { CstNode } from "../cst-parse/CstNode.ts";
import { TokenKind } from "../token/TokenKind.ts";
import type { TokenKinds } from "../token/TokenKinds.ts";
import { classPropertiesToStringEntry, FormatEntries } from "./format.ts";
import { format, type FormatEntry } from "./format.ts";
import { bold } from "@std/fmt/colors";

export function dumpNode(node: CstNode): string {
  return format({
    oneLine: false,
    handleObject: (value) => {
      if (value instanceof CstNode) return dumpNodeEntry(value);
      return classPropertiesToStringEntry(value);
    },
  }, () => dumpNodeEntry(node));
}

export function dumpNodeEntry(node: CstNode): FormatEntry {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(node)) {
    if (key == "tree") continue;
    result[key] = value;
  }

  const list = new FormatEntries.list();
  list.push(new FormatEntries.value(bold(node.constructor.name)));
  list.push(classPropertiesToStringEntry(result));
  return list;
}

export function tokenKindName(kind: TokenKind): string {
  const kindsName = (kinds: { constructor: TokenKinds }): string => {
    if (kinds.constructor === TokenKind) return "";
    return `${kindsName(Object.getPrototypeOf(kinds))}.${kinds.constructor.name}`;
  };
  return kindsName(Object.getPrototypeOf(kind)).slice(1);
}
