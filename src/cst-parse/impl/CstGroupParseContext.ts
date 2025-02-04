import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { Token } from "../../token/Token.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type {
  ContextKey,
  ContextValue,
  CstNodeHintType,
  CstParseContext,
} from "../CstParseContext.ts";
import { ContextKeys, getContext, withContext } from "../CstParseContext.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import type { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import { type CstIntermediateGroup, EmptySlot } from "./CstIntermediateGroup.ts";

export interface CstContextParent {
  c: CstCodeContextImpl;
  debug: unknown;
}

export type CstParseContextParent<Node extends CstNode = CstNode> =
  & CstParseContext<Node>
  & CstContextParent;

export abstract class CstGroupParseContext<Node extends CstNode>
  implements CstParseContext<Node>, CstContextParent {
  abstract readonly parent: CstContextParent;
  abstract readonly current: CstIntermediateGroup;

  get c(): CstCodeContextImpl {
    return this.parent.c;
  }

  get debug(): unknown {
    return this.parent.debug;
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

  abstract withCurrent<R>(current: CstIntermediateGroup, fn: () => R): R;

  abstract beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child>;

  skipping(): Node | null {
    return this.current.skipping();
  }

  hintType(type: CstNodeHintType): void {
    this.current.hintType(type);
  }

  memoize<T>(calculate: () => T, dependencies?: unknown[]): T {
    if (dependencies) {
      const current = this.current;
      const previous = current.getSlot();
      if (previous === EmptySlot) return current.updateSlot(calculate());
      if (!(previous instanceof MemoizedValue)) throw new Error("whoa");

      if (shallowArrayEquals(dependencies, previous.dependencies)) return previous.value as T;
      return current.updateSlot(new MemoizedValue(calculate(), dependencies)).value as T;
    } else {
      const current = this.current;
      const previous = current.getSlot();
      if (previous === EmptySlot) return current.updateSlot(calculate());
      return previous as T;
    }
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

  abstract end(node: Node): Node;

  abstract endWithError(error: unknown | null): Node | null;

  insertChild<Child extends CstNode>(node: Child): Child {
    return this.current.insertChild(node);
  }
}

export abstract class CstSingleGroupParseContext<Node extends CstNode>
  extends CstGroupParseContext<Node> {
  abstract childContext(group: CstIntermediateGroup): CstParseContext<any>;

  override withCurrent<R>(current: CstIntermediateGroup, fn: () => R): R {
    return withContext(this.childContext(current), fn);
  }

  override beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child> {
    const child = this.current.beginChild(info);
    const newContext = child.createUniqueContext(this);
    if (newContext) {
      return newContext as CstParseContext<Child>;
    } else {
      return this.childContext(child);
    }
  }

  override end(node: Node): Node {
    const child = this.current;
    child.parentForPop();
    return child.end(node);
  }

  override endWithError(error: unknown | null): Node | null {
    const child = this.current;
    child.parentForPop();
    return child.endWithError(error) as Node | null;
  }
}

export abstract class CstChildParseContext<Node extends CstNode>
  extends CstGroupParseContext<Node> {
  static create<Node extends CstNode>(
    parent: CstContextParent,
    root: CstIntermediateGroup,
  ): CstChildParseContext<Node> {
    return new class extends CstChildParseContext<Node> {
      override parent: CstContextParent = parent;
      override current: CstIntermediateGroup = root;
    }();
  }

  abstract override current: CstIntermediateGroup;

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

class MemoizedValue {
  constructor(
    readonly value: unknown,
    readonly dependencies: unknown[],
  ) {}
}

function shallowArrayEquals(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
