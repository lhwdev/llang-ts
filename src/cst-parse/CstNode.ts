import type { Span } from "../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../token/Spanned.ts";
import { dumpNode, dumpNodeEntries, dumpNodeEntry } from "../utils/debug.ts";
import { FormatObjectEntries, ToFormatString } from "../utils/format.ts";
import { context } from "./CstParseContext.ts";
import type { CstTree } from "./CstTree.ts";

export class CstNode implements CstNode, Spanned {
  tree: CstTree = context.beforeEnd(this);

  constructor() {}

  get [GetSpanSymbol](): Span {
    return this.tree[GetSpanSymbol];
  }

  /// Formatting

  dump(): string {
    return dumpNode(this);
  }

  [ToFormatString]() {
    return dumpNodeEntry(this);
  }

  get [FormatObjectEntries](): readonly [any, any][] {
    return dumpNodeEntries(this);
  }

  toString(): string {
    return this.dump();
  }
}
