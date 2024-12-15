import {
  bold,
  brightWhite,
  dim,
  gray,
  green,
  italic,
  magenta,
  stripAnsiCode,
  yellow,
} from "@std/fmt/colors";

export function format(value: any, options?: Options): string {
  return valueToColorString(value, options);
}

export const ToFormatString = Symbol("ToFormatString");
export const FormatObjectEntries = Symbol("FormatObjectEntries");
export const MaxWidth = 80;
export const Indent = "  ";

export const ObjectStack: object[] = [];

let SkipTrailing = false;

let Options = {
  oneLine: false,
  handleObject: (value: object): Entry => objectToStringEntry(value),
  important: (_value: object): boolean => true,
};

type Options = Partial<typeof Options>;

const TooLongError = {};

class OneLineOutput {
  constructor(
    public result = "",
    public length = 0,
  ) {}

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
}

class GroupEntry extends Entry {
  constructor(
    readonly left: [string, spacing: boolean],
    readonly item: ObjectEntry,
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

class ValueEntry extends Entry {
  constructor(readonly text: string) {
    super();
  }

  override oneLine(output: OneLineOutput) {
    output.print(this.text);
  }
  override multiLine(output: MultiLineOutput): void {
    output.print(this.text);
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
  list: ListEntry,
  object: ObjectEntry,
  trailing: TrailingEntry,
  style: StyleEntry,
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
        let result;
        if (ToFormatString in value) {
          result = value[ToFormatString]();
        } else {
          result = Options.handleObject(value);
        }
        if (typeof result === "string") return new ValueEntry(result);
        if (result instanceof Entry) return result;
        throw new Error(`wrong result instance: ${result}`, { cause: result });
      }
      break;
    case "function": {
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

export function classPropertiesToStringEntry(
  data: object,
): Entry {
  return objectToStringEntry(
    data,
    " = ",
    (entry) => new GroupEntry(["(", false], entry, [")", false]),
  );
}

export function classToString(
  data: object,
  options?: Options,
): string {
  return formatFn(options, () => classPropertiesToStringEntry(data));
}

export function classToStringEntry(
  data: object,
): Entry {
  const list = new ListEntry();
  const name = data.constructor?.name ?? "Object";
  if (name == "Object") {
    return objectToStringEntry(data);
  }
  list.push(new ValueEntry(bold(name)));
  const obj = objectToStringEntry(
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

export function objectToStringEntry(
  data: object,
  between: string = ": ",
  newGroup: (entry: ObjectEntry) => Entry = (entry) =>
    new GroupEntry(["{", true], entry, ["}", true]),
  mapItem?: (key: string, value: any, item: ListEntry) => Entry,
): Entry {
  if (Array.isArray(data)) return arrayToStringEntry(data);
  const result = new ObjectEntry(data);
  ObjectStack.push(data);

  try {
    const important = Options.important(data);
    for (const [key, value] of formatEntries(data)) {
      const item = new ListEntry(false);
      item.push(new ValueEntry(`${important ? brightWhite(key) : key}${dim(between)}`), [
        true,
        false,
      ]);
      item.push(valueToColorStringEntry(value), [false, false]);
      item.push(new TrailingEntry(","), [false, true]);
      result.push(mapItem ? mapItem(key, value, item) : item);
    }
  } finally {
    ObjectStack.pop();
  }
  return newGroup(result);
}

export function formatEntries(data: object): readonly [any, any][] {
  if (FormatObjectEntries in data) {
    return data[FormatObjectEntries] as any;
  }
  return Object.entries(data);
}

export function arrayToStringEntry(
  data: any[],
): Entry {
  const result = new ObjectEntry(data);
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

export function formatRaw(options: Options | undefined | null, fn: () => Entry): Entry {
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
