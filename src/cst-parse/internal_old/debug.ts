import { fmt } from "../../utils/format.ts";
import { getContext } from "../CstParseContext.ts";

export function debug(strings: TemplateStringsArray, ...args: any[]) {
  (getContext() as any).debug.log(fmt.entry(strings, ...args));
}
