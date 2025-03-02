import { type FormatEntry, FormatObjectEntries, formatRaw, objectToStringEntry } from "./format.ts";

export function inspectFully(obj: object, self: object = obj): FormatEntry {
  const keys = [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)];
  return formatRaw({ handleObject: (o) => inspectFully(o, self) }, () =>
    objectToStringEntry({
      [FormatObjectEntries]: [
        ...keys.map((k) => {
          if (typeof k === "string" && (k.startsWith("get") || k.startsWith("is"))) {
            const fn = (obj as any)[k];
            if (typeof fn === "function" && fn.length === 0) return [k, fn.call(self)];
          }
          return [k, (obj as any)[k]];
        }),
        ["__proto__", Object.getPrototypeOf(obj)],
      ],
    }));
}
