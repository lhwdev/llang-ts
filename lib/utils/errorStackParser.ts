// deno-lint-ignore-file ban-types
////////////////////////////////////////////////////////////////////////////////////////////////////
// stackframe
// Copied & Modified from https://github.com/stacktracejs/stackframe/tree/e07cfd43e89b0565f41856e9285d154aee6c0be3

import { fmt, format, type FormatEntry } from "./format.ts";

// Copyright (c) 2017 Eric Wendelin and other contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

export interface StackFrameOptions {
  isConstructor?: boolean;
  isEval?: boolean;
  isNative?: boolean;
  isToplevel?: boolean;
  columnNumber?: number | string;
  lineNumber?: number | string;
  fileName?: string;
  function?: Function;
  functionName?: string;
  source?: string;
  args?: any[];
  thisArg?: any;
  typeName?: string;
  evalOrigin?: StackFrame;
}

export abstract class StackFrame {
  abstract readonly isConstructor?: boolean;
  abstract readonly isEval?: boolean;
  abstract readonly isNative?: boolean;
  abstract readonly isToplevel?: boolean;
  abstract readonly columnNumber?: number;
  abstract readonly lineNumber?: number;
  abstract readonly fileName?: string;
  abstract readonly function?: Function;
  abstract readonly functionName?: string;
  abstract readonly source?: string;
  abstract readonly args?: any[];
  abstract readonly thisArg?: any;
  abstract readonly typeName?: string;
  abstract readonly evalOrigin?: StackFrame;

  static from(obj: StackFrameOptions) {
    return new class extends StackFrame {
      readonly isConstructor?: boolean;
      readonly isEval?: boolean;
      readonly isNative?: boolean;
      readonly isToplevel?: boolean;
      readonly columnNumber?: number;
      readonly lineNumber?: number;
      readonly fileName?: string;
      readonly function?: Function;
      readonly functionName?: string;
      readonly source?: string;
      readonly args?: any[];
      readonly thisArg?: any;
      readonly typeName?: string;
      readonly evalOrigin?: StackFrame;

      constructor(obj: StackFrameOptions) {
        super();
        this.isConstructor = obj.isConstructor;
        this.isEval = obj.isEval;
        this.isNative = obj.isNative;
        this.isToplevel = obj.isToplevel;
        this.columnNumber = Number(obj.columnNumber);
        this.lineNumber = Number(obj.lineNumber);
        this.fileName = obj.fileName;
        this.function = obj.function;
        this.functionName = obj.functionName;
        this.source = obj.source;
        this.args = obj.args;
        this.thisArg = obj.thisArg;
        this.typeName = obj.typeName;
        this.evalOrigin = obj.evalOrigin;
      }
    }(obj);
  }

  static fromString(str: string): StackFrame {
    const argsStartIndex = str.indexOf("(");
    const argsEndIndex = str.lastIndexOf(")");

    const functionName = str.substring(0, argsStartIndex);
    const args = str.substring(argsStartIndex + 1, argsEndIndex).split(",");
    const locationString = str.substring(argsEndIndex + 1);
    let parts, fileName, lineNumber, columnNumber;

    if (locationString.indexOf("@") === 0) {
      parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString)!;
      fileName = parts[1];
      lineNumber = parts[2];
      columnNumber = parts[3];
    }

    return StackFrame.from({
      functionName,
      args: args || undefined,
      fileName,
      lineNumber,
      columnNumber,
    });
  }

  toString() {
    const fileName = this.fileName ?? "";
    const lineNumber = this.lineNumber ?? "";
    const columnNumber = this.columnNumber ?? "";
    const functionName = this.functionName;
    if (this.isEval) {
      if (fileName) {
        return `[eval] (${fileName}:${lineNumber}:${columnNumber})`;
      }
      return `[eval]:${lineNumber}:${columnNumber}`;
    }
    if (functionName) {
      return `${functionName} (${fileName}:${lineNumber}:${columnNumber})`;
    }
    return `${fileName}:${lineNumber}:${columnNumber}`;
  }

  @format.representation
  toEntry(): FormatEntry {
    const fileName = this.fileName && fmt.cyan(this.fileName);
    const lineNumber = this.lineNumber && fmt.yellow`${this.lineNumber}`;
    const columnNumber = this.columnNumber && fmt.yellow`${this.columnNumber}`;
    const functionName = this.functionName && fmt.bold(fmt.italic(this.functionName));
    if (this.isEval) {
      if (fileName) {
        return fmt`[eval] (${fileName}:${lineNumber}:${columnNumber})`;
      }
      return fmt`[eval]:${lineNumber}:${columnNumber}`;
    }
    if (functionName) {
      return fmt`${functionName} (${fileName}:${lineNumber}:${columnNumber})`;
    }
    return fmt`${fileName}:${lineNumber}:${columnNumber}`;
  }

  dump(): string {
    return this.toEntry().s;
  }
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// error-stack-parser
// Copied & Modified from https://github.com/stacktracejs/error-stack-parser/tree/9f33c224b5d7b607755eb277f9d51fcdb7287e24

// Copyright (c) 2017 Eric Wendelin and other contributors
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of
// this software and associated documentation files (the "Software"), to deal in
// the Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
// of the Software, and to permit persons to whom the Software is furnished to do
// so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

const FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+:\d+/;
const CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
const SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;

/**
 * Given an Error object, extract the most information from it.
 */
export function getCallStackFrames(): Array<StackFrame> {
  if ("captureStackTrace" in Error) {
    const ErrorInstance = Error as any;
    const _prepareStackTrace: any = ErrorInstance.prepareStackTrace;
    try {
      let result: V8CallSite[] | null = null;
      ErrorInstance.prepareStackTrace = (_error: Error, callSites: V8CallSite[]) => {
        const callSitesWithoutCurrent = callSites.slice(1);
        result = callSitesWithoutCurrent;
        return callSitesWithoutCurrent;
      };

      new Error().stack;
      if (result) {
        return (result as V8CallSite[]).map((site) => new V8CallSiteFrame(site));
      }
    } finally {
      ErrorInstance.prepareStackTrace = _prepareStackTrace;
    }
  }

  const error = new Error();
  let frames;
  if (
    "stacktrace" in error || "opera#sourceloc" in error
  ) {
    frames = parseOpera(error);
  } else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) {
    frames = parseV8OrIE(error);
  } else if (error.stack) {
    frames = parseFFOrSafari(error);
  } else {
    throw new Error("Cannot parse given Error object");
  }
  return frames.slice(1);
}

// Separate line and column numbers from a string of the form: (URI:Line:Column)
function extractLocation(urlLike: string) {
  // Fail-fast but return locations like "(native)"
  if (urlLike.indexOf(":") === -1) {
    return [urlLike];
  }

  const regExp = /(.+?)(?::(\d+))?(?::(\d+))?$/;
  const parts = regExp.exec(urlLike.replace(/[()]/g, ""));
  return parts ? [parts[1], parts[2] || undefined, parts[3] || undefined] : null;
}

function parseV8OrIE(error: Error) {
  const filtered = error.stack!.split("\n").filter((line) => !!line.match(CHROME_IE_STACK_REGEXP));

  return filtered.map((line) => {
    if (line.indexOf("(eval ") > -1) {
      // Throw away eval information until we implement stacktrace.js/stackframe#8
      line = line.replace(/eval code/g, "eval").replace(/(\(eval at [^()]*)|(,.*$)/g, "");
    }
    let sanitizedLine = line.replace(/^\s+/, "").replace(/\(eval code/g, "(").replace(
      /^.*?\s+/,
      "",
    );

    // capture and preseve the parenthesized location "(/foo/my bar.js:12:87)" in
    // case it has spaces in it, as the string is split on \s+ later on
    const location = sanitizedLine.match(/ (\(.+\)$)/);

    // remove the parenthesized location from the line, if it was matched
    sanitizedLine = location ? sanitizedLine.replace(location[0], "") : sanitizedLine;

    // if a location was matched, pass it to extractLocation() otherwise pass all sanitizedLine
    // because this line doesn't have function name
    const locationParts = extractLocation(location ? location[1] : sanitizedLine)!;
    const functionName = location && sanitizedLine || undefined;
    const fileName = ["eval", "<anonymous>"].indexOf(locationParts[0]!) > -1
      ? undefined
      : locationParts[0];

    return StackFrame.from({
      functionName,
      fileName,
      lineNumber: locationParts[1],
      columnNumber: locationParts[2],
      source: line,
    });
  });
}

function parseFFOrSafari(error: Error) {
  const filtered = error.stack!.split("\n").filter((line) =>
    !line.match(SAFARI_NATIVE_CODE_REGEXP)
  );

  return filtered.map((line) => {
    // Throw away eval information until we implement stacktrace.js/stackframe#8
    if (line.indexOf(" > eval") > -1) {
      line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, ":$1");
    }

    if (line.indexOf("@") === -1 && line.indexOf(":") === -1) {
      // Safari eval frames only have function names and nothing else
      return StackFrame.from({
        functionName: line,
      });
    } else {
      const functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
      const matches = line.match(functionNameRegex);
      const functionName = matches && matches[1] ? matches[1] : undefined;
      const locationParts = extractLocation(line.replace(functionNameRegex, ""))!;

      return StackFrame.from({
        functionName,
        fileName: locationParts[0],
        lineNumber: locationParts[1],
        columnNumber: locationParts[2],
        source: line,
      });
    }
  });
}

function parseOpera(e: any) {
  if (
    !e.stacktrace || (e.message.indexOf("\n") > -1 &&
      e.message.split("\n").length > e.stacktrace.split("\n").length)
  ) {
    return parseOpera9(e);
  } else if (!e.stack) {
    return parseOpera10(e);
  } else {
    return parseOpera11(e);
  }
}

function parseOpera9(e: any) {
  const lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
  const lines = e.message.split("\n");
  const result = [];

  for (let i = 2, len = lines.length; i < len; i += 2) {
    const match = lineRE.exec(lines[i]);
    if (match) {
      result.push(
        StackFrame.from({
          fileName: match[2],
          lineNumber: match[1],
          source: lines[i],
        }),
      );
    }
  }

  return result;
}

function parseOpera10(e: any) {
  const lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
  const lines = e.stacktrace.split("\n");
  const result = [];

  for (let i = 0, len = lines.length; i < len; i += 2) {
    const match = lineRE.exec(lines[i]);
    if (match) {
      result.push(
        StackFrame.from({
          functionName: match[3] || undefined,
          fileName: match[2],
          lineNumber: match[1],
          source: lines[i],
        }),
      );
    }
  }

  return result;
}

// Opera 10.65+ Error.stack very similar to FF/Safari
function parseOpera11(error: Error) {
  const filtered = error.stack!.split("\n").filter((line) =>
    !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/)
  );

  return filtered.map((line) => {
    const tokens = line.split("@");
    const locationParts = extractLocation(tokens.pop()!)!;
    const functionCall = tokens.shift() || "";
    const functionName = functionCall
      .replace(/<anonymous function(: (\w+))?>/, "$2")
      .replace(/\([^)]*\)/g, "") || undefined;
    let argsRaw;
    if (functionCall.match(/\(([^)]*)\)/)) {
      argsRaw = functionCall.replace(/^[^(]+\(([^)]*)\)$/, "$1");
    }
    const args = (argsRaw === undefined || argsRaw === "[arguments not available]")
      ? undefined
      : argsRaw.split(",");

    return StackFrame.from({
      functionName,
      args: args,
      fileName: locationParts[0],
      lineNumber: locationParts[1],
      columnNumber: locationParts[2],
      source: line,
    });
  });
}

interface V8CallSite {
  /**
	Returns the value of `this`.
	*/
  getThis(): unknown | undefined;

  /**
	Returns the type of `this` as a string. This is the name of the function stored in the constructor field of `this`, if available, otherwise the object's `[[Class]]` internal property.
	*/
  getTypeName(): string | null;

  /**
	Returns the current function.
	*/
  getFunction(): Function | undefined;

  /**
	Returns the name of the current function, typically its `name` property. If a name property is not available an attempt will be made to try to infer a name from the function's context.
	*/
  getFunctionName(): string | null;

  /**
	Returns the name of the property of `this` or one of its prototypes that holds the current function.
	*/
  getMethodName(): string | undefined;

  /**
	Returns the name of the script if this function was defined in a script.
	*/
  getFileName(): string | null;

  /**
	Returns the current line number if this function was defined in a script.
	*/
  getLineNumber(): number | null;

  /**
	Returns the current column number if this function was defined in a script.
	*/
  getColumnNumber(): number | null;

  /**
	Returns a string representing the location where `eval` was called if this function was created using a call to `eval`.
	*/
  getEvalOrigin(): string | undefined;

  /**
	Returns `true` if this is a top-level invocation, that is, if it's a global object.
	*/
  isToplevel(): boolean;

  /**
	Returns `true` if this call takes place in code defined by a call to `eval`.
	*/
  isEval(): boolean;

  /**
	Returns `true` if this call is in native V8 code.
	*/
  isNative(): boolean;

  /**
	Returns `true` if this is a constructor call.
	*/
  isConstructor(): boolean;

  /**
	Returns `true` if this call is asynchronous (i.e. `await`, `Promise.all()`, or `Promise.any()`).
	*/
  isAsync(): boolean;

  /**
	Returns `true` if this is an asynchronous call to `Promise.all()`.
	*/
  isPromiseAll(): boolean;

  /**
	Returns the index of the promise element that was followed in `Promise.all()` or `Promise.any()` for async stack traces, or `null` if the `CallSite` is not an asynchronous `Promise.all()` or `Promise.any()` call.
	*/
  getPromiseIndex(): number | null;
}

class V8CallSiteFrame extends StackFrame {
  constructor(readonly site: V8CallSite) {
    super();
  }

  override get isConstructor(): boolean | undefined {
    return this.site.isConstructor();
  }
  override get isEval(): boolean | undefined {
    return this.site.isEval();
  }
  override get isNative(): boolean | undefined {
    return this.site.isNative();
  }
  override get isToplevel(): boolean | undefined {
    return this.site.isToplevel();
  }
  override get columnNumber(): number | undefined {
    return this.site.getColumnNumber() ?? undefined;
  }
  override get lineNumber(): number | undefined {
    return this.site.getLineNumber() ?? undefined;
  }
  override get fileName(): string | undefined {
    return this.site.getFileName() ?? undefined;
  }
  override get function(): Function | undefined {
    return this.site.getFunction() ?? undefined;
  }
  override get functionName(): string | undefined {
    return this.site.getFunctionName() ?? undefined;
  }
  override get source(): string | undefined {
    return undefined;
  }
  override get args(): any[] | undefined {
    return undefined;
  }
  override get thisArg(): any | undefined {
    return this.site.getThis();
  }
  override get typeName(): string | undefined {
    return this.site.getTypeName() ?? undefined;
  }
  override get evalOrigin(): StackFrame | undefined {
    // TODO
    // return this.site.getEvalOrigin() ?? undefined;
    return undefined;
  }
}
