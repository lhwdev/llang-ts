import type { Span } from "../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../token/Spanned.ts";
import { dumpNode, dumpNodeEntries } from "../utils/debug.ts";
import { format, FormatObjectEntries } from "../utils/format.ts";
import { context } from "../cst-parse/CstParseContext.ts";
import type { CstTree } from "./CstTree.ts";

export class CstNode implements CstNode, Spanned {
  tree: CstTree = context.beforeEnd(this);

  constructor() {}

  get [GetSpanSymbol](): Span {
    return this.tree[GetSpanSymbol];
  }

  /// Formatting

  @format.print
  dump(): string {
    return dumpNode(this);
  }

  get [FormatObjectEntries](): readonly [any, any][] {
    return dumpNodeEntries(this);
  }

  toString(): string {
    return this.dump();
  }
}
