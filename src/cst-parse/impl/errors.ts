import { fmt } from "../../utils/format.ts";

export function detailedParseError(strings: TemplateStringsArray, ...args: any[]): Error {
  const lines = dedent(fmt(strings, ...args).split("\n"));

  for (const line of lines) console.error(line);
  return new Error(lines[0]);
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
      if (!line.startsWith(indent)) {
        const other = whitespaceRegex.exec(line)![0];
        if (indent.startsWith(other)) {
          indent = other;
          continue restart;
        }
        return lines;
      }
      line = line.slice(indent.length).trimEnd();
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
