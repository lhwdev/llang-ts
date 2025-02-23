import {
  AllFormats,
  bold,
  brightWhite,
  dim,
  gray,
  green,
  italic,
  magenta,
  red,
  rgb8,
  stripAnsiCode,
  yellow,
} from "./colors.ts";

type ParametersExcept0<F extends (...args: any) => any> = F extends
  (arg0: any, ...args: infer T) => any ? T
  : never;

interface FormatFn<F extends (value: string, ...args: any) => string> {
  (
    value: Entry | (() => Entry | string) | string,
    ...args: ParametersExcept0<F>
  ): Entry;
  (
    ...args: ParametersExcept0<F>
  ): (strings: TemplateStringsArray, ...args: any) => Entry;
  (
    ...args: ParametersExcept0<F>["length"] extends 0
      ? [strings: TemplateStringsArray, ...args: any]
      : never
  ): Entry;
}
type Formats = {
  [Key in keyof AllFormats]: FormatFn<AllFormats[Key]>;
};
interface Fmt extends Formats {
  (strings: TemplateStringsArray, ...args: any[]): Entry;
  (options?: Options): (strings: TemplateStringsArray, ...args: any[]) => Entry;

  raw(input: Entry | unknown): Entry;

  symbol(name: unknown): Entry;
  parameter(name: unknown): Entry;
  code(content: unknown): Entry;
  lazy(fn: (context: FormatContext) => Entry | string): Entry;

  join(entries: Entry[], separator?: Entry): Entry;

  classLike(name: string, content: Entry | string): Entry;
}

function mapInput(input: Entry | unknown): Entry {
  if (input instanceof Entry) return input;
  if (typeof input === "symbol") return new ValueEntry(input.toString());
  return new ValueEntry(`${input}`);
}

export const fmt: Fmt = Object.assign((a?: any, ...args: any): any => {
  if (Array.isArray(a)) {
    return fmtTemplate(a as any, ...args);
  } else {
    return (strings: TemplateStringsArray, ...args: any[]) =>
      formatRaw(a, () => fmtTemplate(strings, ...args));
  }
}, {
  raw: mapInput,

  symbol(name: unknown) {
    return this.yellow(`${name}`);
  },

  parameter(name: unknown) {
    return new ValueEntry(red(`${name}`));
  },

  code(content: unknown) {
    return new ValueEntry(rgb8(`${content}`, 110));
  },

  lazy(fn: (context: FormatContext) => Entry | string) {
    return new LazyEntry((context) => mapInput(fn(context)));
  },

  join(entries: Entry[], separator: Entry = new ValueEntry(", ")): Entry {
    return FormatEntries.join(entries, separator);
  },

  classLike(name: string, content: Entry | string) {
    const list = new ListEntry();
    list.push(
      new ValueEntry(
        name.includes("\x1b")
          ? name
          : content instanceof ObjectEntry && Options.important(content.value)
          ? bold(name)
          : name,
      ),
    );
    list.push(new GroupEntry(["(", false], mapInput(content), [")", false]));
    return list;
  },

  ...Object.fromEntries(
    Object.entries(AllFormats as Record<string, (value: string, ...args: any) => string>)
      .map(([key, fn]) => [key, (...args: any[]) => {
        if (fn.length === 1) {
          const strings = args[0];
          if (Array.isArray(strings) && typeof strings.at(0) === "string" && "raw" in strings) {
            return new StyleEntry(fn, fmt(strings as TemplateStringsArray, ...args.slice(1)));
          }
        }
        if (args.length === fn.length) {
          const [value, ...other] = args;
          if (value instanceof Entry) {
            return new StyleEntry((str) => fn(str, ...other), value);
          } else if (typeof value === "function") {
            return new StyleEntry(
              (str) => fn(str, ...other),
              new LazyEntry(() => {
                const v = value();
                return v instanceof Entry ? v : new ValueEntry(`${v}`);
              }),
            );
          } else {
            return new ValueEntry(fn(`${value}`, ...other));
          }
        } else {
          return (str: TemplateStringsArray, ...innerArgs: any) =>
            new StyleEntry((str) => fn(str, ...args), fmt(str, ...innerArgs));
        }
      }]),
  ) as any as Formats,
});

function fmtTemplate(strings: TemplateStringsArray, ...args: any[]): Entry {
  const list = new ListEntry();
  for (let i = 0; i < strings.length; i++) {
    if (i !== 0) list.push(valueToColorStringEntry(args[i - 1]));
    list.push(new ValueEntry(strings[i]));
  }
  return list;
}

export function format(value: any, options?: Options): string {
  return valueToColorString(value, options);
}

export function formatClass(value: any, options?: Options): string {
  return classToString(value, { ...options, handleObject: (v) => classToStringEntry(v, true) });
}

/// Format Symbols & Constants
export const ToFormatString = Symbol("ToFormatString"); // function: () => string
export const FormatObjectEntries = Symbol("FormatObjectEntries"); // value: get () => string
export const FormatClassName = Symbol("FormatClassName"); // value: get () => string
export const MaxWidth = 100;
export const Indent = "  ";

/// Format decorators
function formatSymbolDecorator(
  symbol: symbol,
  isValue: boolean,
  map: (value: any) => any = (value) => value,
): (
  value: any,
  context: ClassMethodDecoratorContext | ClassGetterDecoratorContext | ClassFieldDecoratorContext,
) => void {
  return (_value, context) => {
    if (isValue && context.kind === "method") {
      return context.addInitializer(function () {
        Object.defineProperty(this, symbol, {
          get() {
            return map(context.access.get(this).call(this));
          },
          enumerable: false,
        });
      });
    }
    context.addInitializer(function () {
      Object.defineProperty(this, symbol, {
        get: () => map(context.access.get(this)),
        enumerable: false,
      });
    });
  };
}

export namespace format {
  export const className = formatSymbolDecorator(FormatClassName, true);
  export const objectEntries = formatSymbolDecorator(FormatObjectEntries, true);

  export const print = formatSymbolDecorator(ToFormatString, false);
}

export const ObjectStack: object[] = [];

let SkipTrailing = false;

let Options = {
  oneLine: false,
  handleObject: (value: object): Entry => objectToStringEntry(value),
  important: (_value: object): boolean => true,
};

type Options = Partial<typeof Options>;

const TooLongError = {};

export interface FormatContext extends Record<string, any> {}

class OneLineOutput {
  constructor(
    public result = "",
    public length = 0,
  ) {}

  context: FormatContext = {} as any;

  print(str: string) {
    this.result += str;

    const length = this.length + stripAnsiCode(str).length;
    this.length = length;
    if (!Options.oneLine && length > MaxWidth) throw TooLongError;
  }

  forkChild() {
    return new OneLineOutput("", 0);
  }

  pushFork(child: OneLineOutput) {
    this.print(child.result);
  }
}

class MultiLineOutput {
  constructor(
    public result: string = "",
    public last: boolean | null = false,
  ) {}

  context: FormatContext = {} as any;

  print(line: string, [left, right]: [boolean | null, boolean | null] = [null, null]) {
    const newLine = this.last || left;

    if (newLine) {
      const depth = ObjectStack.length;
      this.result += "\n" + "  ".repeat(depth);
    }

    this.result += line;

    this.last = right;
  }

  forkChild() {
    return new MultiLineOutput("", this.last);
  }

  pushFork(from: MultiLineOutput) {
    this.result += from.result;
    this.last = from.last;
  }

  push(from: MultiLineOutput) {
    this.print(from.result);
  }
}

abstract class Entry {
  abstract oneLine(output: OneLineOutput): void;
  abstract multiLine(output: MultiLineOutput): void;

  toString() {
    return format(this);
  }

  get s() {
    return format(this);
  }
}

class GroupEntry extends Entry {
  constructor(
    readonly left: [string, spacing: boolean],
    readonly item: Entry,
    readonly right: [string, spacing: boolean],
  ) {
    super();
  }

  override oneLine(output: OneLineOutput) {
    const [left, leftSpacing] = this.left;
    const [right, rightSpacing] = this.right;
    output.print(gray(left));
    if (leftSpacing) output.print(" ");
    this.item.oneLine(output);
    if (rightSpacing) output.print(" ");
    output.print(gray(right));
  }

  override multiLine(output: MultiLineOutput): void {
    const oneLine = new OneLineOutput();
    oneLine.length += output.result.length - output.result.lastIndexOf("\n");
    try {
      this.oneLine(oneLine);
      output.print(oneLine.result);
    } catch (e) {
      if (e !== TooLongError) throw e;

      output.print(gray(this.left[0]), [false, true]);
      this.item.multiLine(output);
      output.print(gray(this.right[0]), [true, false]);
    }
  }
}

class ContextEntry<Key extends keyof FormatContext = keyof FormatContext> extends Entry {
  constructor(readonly context: [Key, FormatContext[Key]], readonly entry: Entry) {
    super();
  }

  withContext<T extends { context: FormatContext }>(output: T, block: (output: T) => void) {
    const [key, value] = this.context;
    const c = output.context;
    const previous = c[key];
    c[key] = value;
    try {
      block(output);
    } finally {
      c[key] = previous;
    }
  }

  override oneLine(output: OneLineOutput): void {
    this.withContext(output, (output) => {
      this.entry.oneLine(output);
    });
  }

  override multiLine(output: MultiLineOutput): void {
    this.withContext(output, (output) => {
      this.entry.multiLine(output);
    });
  }
}

class ValueEntry extends Entry {
  constructor(readonly text: string) {
    super();
  }

  override oneLine(output: OneLineOutput): void {
    output.print(this.text);
  }
  override multiLine(output: MultiLineOutput): void {
    output.print(this.text);
  }
}

class LazyEntry extends Entry {
  constructor(
    readonly calculate: (context: FormatContext) => Entry,
  ) {
    super();
  }

  override oneLine(output: OneLineOutput) {
    this.calculate(output.context).oneLine(output);
  }
  override multiLine(output: MultiLineOutput): void {
    this.calculate(output.context).multiLine(output);
  }
}

type Prop = { entry: Entry; space: [boolean | null, boolean | null] };

class ListEntry extends Entry {
  props: Prop[] = [];

  constructor(readonly defaultSpace: boolean = false) {
    super();
  }

  push(entry: Entry, space: [boolean | null, boolean | null] = [null, null]) {
    this.props.push({ entry, space });
  }

  override oneLine(output: OneLineOutput) {
    let previous: boolean | null = false;
    let props = this.props;
    if (props.at(-1) instanceof TrailingEntry) props = props.slice(0, -1);
    for (const { entry, space: [left, right] } of props) {
      if (previous !== null && left !== null ? previous && left : previous ?? left) {
        output.print(" ");
      }
      entry.oneLine(output);
      previous = right;
    }
  }

  override multiLine(output: MultiLineOutput): void {
    for (const prop of this.props) prop.entry.multiLine(output);
  }
}

class ObjectEntry extends Entry {
  props: Prop[] = [];

  constructor(readonly value: object) {
    super();
  }

  push(entry: Entry, space: [boolean | null, boolean | null] = [null, null]) {
    this.props.push({ entry, space });
  }

  override oneLine(output: OneLineOutput) {
    ObjectStack.push(this.value);
    try {
      let previous: boolean | null = false;
      const props = this.props;
      for (let index = 0; index < props.length; index++) {
        const isTrailing = index === props.length - 1;
        const { entry, space: [left, right] } = props[index];

        if (previous !== null && left !== null ? previous && left : previous ?? left) {
          output.print(" ");
        }
        if (isTrailing) {
          const previous = SkipTrailing;
          SkipTrailing = true;
          try {
            entry.oneLine(output);
          } finally {
            SkipTrailing = previous;
          }
        } else {
          entry.oneLine(output);
        }
        previous = right;
      }
    } finally {
      ObjectStack.pop();
    }
  }

  override multiLine(output: MultiLineOutput): void {
    ObjectStack.push(this.value);
    try {
      let isFirst = true;
      for (const prop of this.props) {
        if (!isFirst) output.last = true;
        prop.entry.multiLine(output);
        isFirst = false;
      }
    } finally {
      ObjectStack.pop();
    }
  }
}

class TrailingEntry extends ValueEntry {
  override oneLine(output: OneLineOutput): void {
    if (SkipTrailing) {
      SkipTrailing = false;
      return;
    }
    super.oneLine(output);
  }
}

class StyleEntry extends Entry {
  constructor(readonly style: (str: string) => string, readonly entry: Entry) {
    super();
  }

  override oneLine(output: OneLineOutput) {
    const child = output.forkChild();
    this.entry.oneLine(child);
    child.result = this.style(child.result);
    output.pushFork(child);
  }

  override multiLine(output: MultiLineOutput) {
    const child = output.forkChild();
    this.entry.multiLine(child);
    child.result = this.style(child.result);
    output.pushFork(child);
  }
}

export const FormatEntries = {
  value: ValueEntry,
  group: GroupEntry,
  context: ContextEntry,
  list: ListEntry,
  object: ObjectEntry,
  trailing: TrailingEntry,
  style: StyleEntry,

  join(entries: Entry[], separator: Entry = new ValueEntry(", ")) {
    const list = new ListEntry();
    let first = true;
    for (const entry of entries) {
      if (!first) list.push(separator);
      list.push(entry);
      first = false;
    }
    return list;
  },
};

export type FormatEntry = Entry;

export function valueToColorString(
  value: any,
  options?: Options,
): string {
  return formatFn(options, () => valueToColorStringEntry(value));
}

export function valueToColorStringEntry(
  value: any,
): Entry {
  let v;
  switch (typeof value) {
    case "number":
    case "boolean":
    case "bigint":
      v = yellow(value.toString());
      break;
    case "string":
      v = green(`${dim("'")}${JSON.stringify(value).slice(1, -1)}${dim("'")}`);
      break;
    case "symbol":
      v = magenta(value.toString());
      break;
    case "undefined":
    case "object":
      if (!value) {
        v = gray(value === null ? "null" : "undefined");
      } else if (ObjectStack.includes(value)) {
        v = italic("[recurse]");
      } else {
        if (value instanceof Entry) return value;

        let result;
        if (ToFormatString in value) {
          result = value[ToFormatString]();
        } else {
          result = Options.handleObject(value);
        }
        if (result instanceof Entry) return result;
        if (typeof result === "string") return new ValueEntry(result);
        throw new Error(`wrong result instance: ${result}`, { cause: result });
      }
      break;
    case "function": {
      if (ToFormatString in value) {
        const result = value[ToFormatString]();
        if (result instanceof Entry) return result;
        if (typeof result === "string") return new ValueEntry(result);
        throw new Error(`wrong result instance: ${result}`, { cause: result });
      }

      const str = `${value}`;
      let text;
      if (str.startsWith("class ")) {
        text = `class ${value.name}`;
      } else {
        text = `function ${value.name}`;
      }
      v = magenta(`${text}`);
      break;
    }
  }
  return new ValueEntry(v);
}

export function classPropertiesToString(
  data: object,
  options?: Options,
): string {
  return formatFn(options, () => classPropertiesToStringEntry(data));
}

export function classPropertiesToStringEntry(data: object): Entry {
  return objectLiteralToStringEntry(
    data,
    " = ",
    (entry) => new GroupEntry(["(", false], entry, [")", false]),
  );
}

export function classToString(
  data: object,
  options?: Options,
): string {
  return formatFn(options, () => classToStringEntry(data, true));
}

export function classToStringEntry(
  data: object,
  fallback: boolean = false,
): Entry {
  const name = FormatClassName in data
    ? `${data[FormatClassName]}`
    : data.constructor?.name ?? "Object";
  if (typeof name !== "string") {
    throw new Error(fmt`${fmt.parameter("name")} is ${name}; expected string`.s);
  }

  if (fallback) {
    if (Array.isArray(data)) return arrayToStringEntry(data);
    if (name === "Object") return objectLiteralToStringEntry(data);
  }

  const list = new ListEntry();
  list.push(
    new ValueEntry(name.includes("\x1b") ? name : Options.important(data) ? bold(name) : name),
  );
  const obj = objectLiteralToStringEntry(
    data,
    " = ",
    (entry) => new GroupEntry(["(", false], entry, [")", false]),
  );
  list.push(obj);
  return list;
}

export function objectToString(
  data: object,
  options?: Options,
): string {
  return formatFn(options, () => objectToStringEntry(data));
}

export function objectToStringEntry(data: object) {
  if (Array.isArray(data)) return arrayToStringEntry(data);
  const name = data.constructor?.name;
  if (!name || name === "Object") return objectLiteralToStringEntry(data);
  return classToStringEntry(data);
}

export function objectLiteralToString(
  data: object,
  options?: Options,
): string {
  return formatFn(options, () => objectLiteralToStringEntry(data));
}

export function objectLiteralToStringEntry(
  data: object,
  between: string = ": ",
  newGroup: (entry: ObjectEntry) => Entry = (entry) =>
    new GroupEntry(["{", true], entry, ["}", true]),
  mapItem?: (key: string, value: any, item: ListEntry) => Entry,
): Entry {
  const result = new ObjectEntry(data);

  if (ObjectStack.filter((v) => v === data).length > 2) return new ValueEntry("recurse");
  ObjectStack.push(data);

  try {
    const important = Options.important(data);
    for (const [key, value] of formatEntries(data)) {
      const k = fmt.raw(key);
      const item = new ListEntry();

      item.push(important ? new StyleEntry(brightWhite, k) : k);
      item.push(new ValueEntry(dim(between)));
      item.push(valueToColorStringEntry(value));
      item.push(new TrailingEntry(","));
      result.push(mapItem ? mapItem(`${key}`, value, item) : item, [true, true]);
    }
  } finally {
    ObjectStack.pop();
  }
  return newGroup(result);
}

export function formatEntries(data: object): ReadonlyArray<readonly [any, any]> {
  if (FormatObjectEntries in data) {
    return data[FormatObjectEntries] as any;
  }
  const keys = [...Object.getOwnPropertyNames(data), ...Object.getOwnPropertySymbols(data)];
  const entries: (readonly [any, any])[] = [];
  for (const key of keys) {
    const prop = Object.getOwnPropertyDescriptor(data, key);
    if (!prop) continue;
    if ("value" in prop) entries.push([key, prop.value]);
    else if ("get" in prop) entries.push([key, prop.get]);
  }
  (entries as any)[FormatObjectEntries] = entries;
  return entries;
}

export function arrayToStringEntry(
  data: any[],
): Entry {
  const result = new ObjectEntry(data);
  ObjectStack.push(data);

  try {
    for (const value of Object.values(data)) {
      const item = new ListEntry(false);
      item.push(valueToColorStringEntry(value), [true, false]);
      item.push(new TrailingEntry(dim(",")), [false, true]);
      result.push(item);
    }
  } finally {
    ObjectStack.pop();
  }
  return new GroupEntry(["[", false], result, ["]", false]);
}

export function formatFor<T>(value: any, fn: () => T): T {
  ObjectStack.push(value);
  try {
    return fn();
  } finally {
    ObjectStack.pop();
  }
}

export function formatRaw<T>(options: Options | undefined | null, fn: () => T): T {
  const previous = Options;
  Options = options ? { ...previous, ...options } : previous;
  try {
    return fn();
  } finally {
    Options = previous;
  }
}

export function formatFn(options: Options | undefined | null, fn: () => Entry): string {
  const previous = Options;
  Options = options ? { ...previous, ...options } : previous;
  try {
    const entry = fn();
    if (!(entry instanceof Entry)) {
      throw new TypeError(`fn did not return Entry, result=${entry} fn=${fn}`);
    }
    let r;
    try {
      const output = new OneLineOutput();
      entry.oneLine(output);
      r = output.result;
    } catch (e) {
      if (e !== TooLongError) throw e;
      const output = new MultiLineOutput();
      entry.multiLine(output);
      r = output.result;
    }
    return r;
  } finally {
    Options = previous;
  }
}
