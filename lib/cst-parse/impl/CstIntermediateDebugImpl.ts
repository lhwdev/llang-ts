import { fmt, type FormatEntry } from "../../utils/format.ts";
import type { CstIntermediateDebug } from "../intermediate/CstIntermediateDebug.ts";
import type { CstIntermediateStateImpl } from "./CstIntermediateStateImpl.ts";

abstract class DebugLog {
  declare private $: void;
}
namespace DebugLog {
  export class Line extends DebugLog {
    constructor(readonly line: FormatEntry) {
      super();
    }
  }

  export class Group extends DebugLog {
    constructor(readonly logs: readonly DebugLog[]) {
      super();
    }
  }
}

export class CstIntermediateDebugImpl implements CstIntermediateDebug {
  constructor(
    private state: CstIntermediateStateImpl<any>,
  ) {
    const meta = state.meta;
    this.debugName = meta.info.name;
  }

  debugName: string;

  get debugNameEntry(): FormatEntry {
    return fmt`${fmt.white(this.debugName)}`;
  }

  private lines?: DebugLog[];

  log(str: TemplateStringsArray, ...args: any): void {
    if (!this.lines) this.lines = [];
    this.lines.push(new DebugLog.Line(fmt(str, ...args)));
  }

  flushLog(): void {
    const flush = (depth: number, lines: readonly DebugLog[]) => {
      const indent = "  ".repeat(depth);
      for (const line of lines) {
        if (line instanceof DebugLog.Line) {
          console.log(line.line.s.split("\n").map((l) => `${indent}${l}`).join("\n"));
        } else if (line instanceof DebugLog.Group) {
          flush(depth + 1, line.logs);
        }
      }
    };
    if (this.lines) flush(0, this.lines);
  }

  end(parent?: CstIntermediateDebug) {
    if (!(parent instanceof CstIntermediateDebugImpl)) return;
    if (this.lines) {
      if (!parent.lines) parent.lines = [];
      parent.lines.push(new DebugLog.Group(this.lines));
    }
    this.lines = undefined;
  }
}
