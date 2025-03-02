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

const whitespaceRegex = /^\s*/;
const allWhitespaceRegex = /^\s*$/;

export function dedent(lines: string[]): string[] {
  let indent = null;
  restart: while (true) {
    if (!lines.length) return [];
    if (allWhitespaceRegex.test(lines.at(-1)!)) {
      lines.pop();
      continue restart;
    }
    if (indent === null) indent = whitespaceRegex.exec(lines[0])![0];
    if (lines[0].length === indent.length) {
      lines.shift();
      indent = null;
      continue restart;
    }

    const result = [];
    let buffer = null;
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (!buffer) {
        if (!line.startsWith(indent)) {
          const other = whitespaceRegex.exec(line)![0];
          if (indent.startsWith(other)) {
            indent = other;
            continue restart;
          }
          return lines;
        }
        line = line.slice(indent.length);
      } else {
        line = line.trimStart();
      }
      line = line.trimEnd();

      if (line.endsWith("\\")) {
        buffer = (buffer ?? "") + line.slice(0, -1).trimEnd() + " ";
      } else {
        if (buffer !== null) {
          result.push(buffer + line);
          buffer = null;
        } else {
          result.push(line);
        }
      }
    }
    return result;
  }
}
