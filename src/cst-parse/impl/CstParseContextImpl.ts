import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { Token } from "../../token/Token.ts";
import type { FormatEntry } from "../../utils/format.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type {
  ContextKey,
  ContextValue,
  CstNodeHintType,
  CstParseContext,
} from "../CstParseContext.ts";
import { ContextKeys, getContext, withContext } from "../CstParseContext.ts";
import type { useImplicitNode } from "../intrinsics.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateRoot } from "./CstIntermediateRoot.ts";

export class CstParseContextImpl<Node extends CstNode> implements CstParseContext<Node> {
  c: CstCodeContextImpl;
  current: CstIntermediateGroup;

  constructor(readonly tokenizer: CstTokenizerContext) {
    this.c = new CstCodeContextImpl(tokenizer);
    this.current = new CstIntermediateRoot();
  }

  debug = {
    context: this,
    lines: [] as [number, FormatEntry][],
    log(entry: FormatEntry) {
      this.lines.push([this.context.current.debugDepth, entry]);
    },
  };

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

  /// Code parsing

  get codeScopes(): CstCodeScopes {
    return this.current.resolveContext(ContextKeys.CodeScopes).value;
  }

  code<R extends Token>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope | null, fn: (code: CstCodeContext) => R): R;
  code<R>(
    a: CstCodeScope | null | ((code: CstCodeContext) => R),
    b?: (code: CstCodeContext) => R,
  ): R {
    let scope;
    let fn;

    const current = this.current;
    if (b) {
      const givenScope = a as CstCodeScope | null;
      if (givenScope) {
        scope = givenScope;
      } else {
        scope = current.resolveContext(ContextKeys.CodeScope).value;
      }
      fn = b;
    } else {
      scope = current.resolveContext(ContextKeys.CodeScope).value;
      fn = a as (code: CstCodeContext) => R;
    }

    return current.code(scope, fn);
  }

  /// Children management

  withCurrent<R>(current: CstIntermediateGroup, fn: () => R): R {
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

  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child> {
    this.current = this.current.beginChild(info);
    return this as unknown as CstParseContext<Child>;
  }

  hintType(type: CstNodeHintType): void {
    this.current.hintType(type);
  }

  provideContext(value: ContextValue<any>): void {
    this.current.provideContext(value);
  }

  resolveContext<T>(key: ContextKey<T>): ContextValue<T> {
    return this.current.resolveContext(key);
  }

  beforeEnd(node: Node): CstTree<Node> {
    return this.current.beforeEnd(node);
  }

  end(node: Node): Node {
    const child = this.current;
    const parent = child.parentForPop();
    const result = child.end(node);
    this.current = parent;

    if (parent instanceof CstIntermediateRoot) {
      for (const [depth, line] of this.debug.lines) {
        const indent = "  ".repeat(depth);
        console.log(indent + line.toString().replaceAll("\n", "\n" + indent));
      }
      this.debug.lines = [];
    }

    return result;
  }

  endWithError(error: unknown | null): Node | null {
    const child = this.current;
    this.current = child.parent;
    return child.endWithError(error) as Node | null;
  }

  insertChild<Child extends CstNode>(node: Child): Child {
    return this.current.insertChild(node);
  }
}
