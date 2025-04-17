import { fmt, FormatEntries, type FormatEntry } from "../../utils/format.ts";
import { getContext } from "../CstParseContext.ts";

export function debug(strings: TemplateStringsArray, ...args: any[]) {
  debug.raw(fmt(strings, ...args));
}

export namespace debug {
  export function raw(entry: FormatEntry) {
    (getContext() as any).debug.log(entry);
  }

  export function string(str: string) {
    raw(new FormatEntries.value(str));
  }
}

export const DebugFlags = {
  traceParser: true,
};
