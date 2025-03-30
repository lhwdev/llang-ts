import { dedent } from "../../common/error.ts";
import { red } from "../../utils/ansi.ts";
import { fmt } from "../../utils/format.ts";
import { debug } from "./debug.ts";

export function detailedParseError<E extends Error>(
  error: new (message?: string, options?: ErrorOptions) => E,
  options?: ErrorOptions,
): (strings: TemplateStringsArray, ...args: any[]) => E;

export function detailedParseError(strings: TemplateStringsArray, ...args: any[]): Error;

export function detailedParseError(a: any, ...args: any[]): any {
  if (typeof a === "function") {
    const options = args[0];
    return (strings: TemplateStringsArray, ...args: any[]) =>
      detailedParseErrorInternal(fmt(strings, ...args).s, a, options);
  }
  return detailedParseErrorInternal(fmt(a, ...args).s, Error);
}
function detailedParseErrorInternal<E extends Error>(
  str: string,
  error: new (message?: string, options?: ErrorOptions) => E,
  options?: ErrorOptions,
): E {
  const lines = dedent(str.split("\n"));

  debug.string("\x1b]1337;SetMark\x1b\\" + red("Error: ") + lines.join("\n"));
  return new error(lines[0], options);
}
