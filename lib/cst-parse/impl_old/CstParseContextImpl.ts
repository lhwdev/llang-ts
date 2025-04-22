import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { FormatEntry } from "../../utils/format.ts";
import type { CstParseContext } from "../CstParseContext.ts";
import { ContextKeys, getContext, withContext } from "../CstParseContext.ts";
import type { useImplicitNode } from "../intrinsics.ts";
import type { CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import {
  type CstContextParent,
  CstContextParentSymbol,
  CstGroupParseContext,
} from "./CstGroupParseContext.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateRoot } from "./CstIntermediateRoot.ts";

export class CstParseContextImpl<Node extends CstNode> extends CstGroupParseContext<Node> {
  override parent: CstContextParent;
  current: CstIntermediateGroup;

  constructor(readonly tokenizer: CstTokenizerContext) {
    super();
    const c = new CstCodeContextImpl(tokenizer);
    const debug = {
      context: this,
      lines: [] as [number, FormatEntry][],
      log(entry: FormatEntry) {
        this.context.current.debugLog(entry);
      },
    };
    this.parent = { [CstContextParentSymbol]: true, c, debug };
    this.current = new CstIntermediateRoot(null);
  }

  provideRootContexts(
    { codeScopes, implicitNode }: {
      codeScopes: CstCodeScopes;
      implicitNode: Parameters<typeof useImplicitNode>[0];
    },
  ) {
    this.provideContext(ContextKeys.CodeScopes.provides(codeScopes));
    this.provideContext(ContextKeys.CodeScope.provides(codeScopes.normal()));
    this.provideContext(ContextKeys.ImplicitNode.provides(implicitNode));
  }

  withRootSelf<R>(fn: () => R): R {
    return withContext(this, fn);
  }

  /// Children management

  override withCurrent<R>(current: CstIntermediateGroup, fn: () => R): R {
    const previous = this.current;
    this.current = current;
    try {
      if (this === getContext()) {
        return fn();
      } else {
        return withContext(this, fn);
      }
    } finally {
      this.current = previous;
    }
  }

  override beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child> {
    const child = this.current.beginChild(info);
    const newContext = child.createUniqueContext(this);
    if (newContext) {
      return newContext as CstParseContext<Child>;
    } else {
      this.current = child;
      return this as unknown as CstParseContext<Child>;
    }
  }

  override end(node: Node): Node {
    const child = this.current;
    const parent = child.parentForPop();
    const result = child.end(node);
    this.current = parent;

    // if (parent instanceof CstIntermediateRoot) {
    //   for (const [depth, line] of this.debug.lines) {
    //     const indent = "  ".repeat(depth);
    //     console.log(indent + line.toString().replaceAll("\n", "\n" + indent));
    //   }
    //   this.debug.lines = [];
    // }

    return result;
  }

  override endWithError(error: unknown | null): Node | null {
    const child = this.current;
    const parent = child.parentForPop();
    const result = child.endWithError(error) as Node | null;
    this.current = parent;
    return result;
  }
}
