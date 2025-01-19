import { cstImplicitList } from "../../cst-parser/cstImplicit.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import {
  type CstNodeHintType,
  type CstParseContext,
  getContext,
  withContext,
} from "../CstParseContext.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import type { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { fmt, format, type FormatEntry } from "../../utils/format.ts";
import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import { debug } from "./debug.ts";
import { dim, strikethrough } from "../../utils/colors.ts";
import type { CstGroup } from "./CstGroup.ts";
import { isInherited } from "../../utils/extends.ts";
import { CstDetachedNode, CstSpecialNode } from "../../cst/CstSpecialNode.ts";
import { CstPeekNode } from "../../cst/CstSpecialNode.ts";

export class CstParseContextImpl<out Node extends CstNode> implements CstParseContext<Node> {
  readonly tokenizer: CstTokenizerContext;
  readonly c: CstCodeContextImpl;

  readonly codeScopes: CstCodeScopes;
  private normalScope?: CstCodeScope;

  private insideImplicit = false;

  debug = {
    self: this,
    get depth() {
      return this.self.groups.length - 1;
    },

    disableLog: false,
    _pendingLogs: [] as [number, FormatEntry][],
    implicitDepth: 0,

    log(line: FormatEntry) {
      if (this.disableLog) return;
      const depth = this.depth;
      if (this.self.insideImplicit) {
        if (depth > this.implicitDepth + 1) return;
      }
      this._pendingLogs.push([depth, line]);
    },
  };

  /// Code parsing
  code<R>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

  code<R>(a: CstCodeScope | ((code: CstCodeContext) => R), b?: (code: CstCodeContext) => R): R {
    if (this.normalScope == null) {
      this.normalScope = this.codeScopes.normal();
      this.c.scope = this.normalScope;
    }
    const current = this.current;
    const session = current.startCode();
    let scope = current.codeScope;
    let fn;
    if (typeof a === "function") {
      fn = a;
    } else {
      scope = a;
      fn = b!;
    }
    if (scope) {
      this.c.scope = scope;
    }

    try {
      const result = fn(this.c);
      if (session.tokens.length) {
        debug`code(${fmt.symbol(this.c.scope.constructor.name)}, ${fmt.code(fn)}) -> ${result}`;
      }
      return result;
    } finally {
      current.endCode(session);
      this.c.scope = this.normalScope;
    }
  }

  pushCodeScope(scope: CstCodeScope) {
    this.current.codeScope = scope;
  }

  /// Node management
  abstract readonly groups: CstIntermediateGroup[];

  get current() {
    return this.groups.at(-1)!;
  }

  private withSelf<R>(fn: () => R): R {
    if (this === getContext() as any) return fn();
    return withContext(this, fn);
  }

  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child> {
    const special = isInherited(info, CstSpecialNode);
    if (special) {
      switch (info as any) {
        case CstPeekNode:
          return this.beginPeek();
        case CstDetachedNode:
          return this.beginDetached();
        default:
          console.error(special);
          throw new Error(`unknown special node ${special}`);
      }
    }

    const parent = this.current;
    if (!parent.disableImplicit && parent.allowImplicit && !this.insideImplicit) {
      parent.allowImplicit = false;

      this.insideImplicit = true;
      this.debug.implicitDepth = this.debug.depth;
      try {
        const node = this.withSelf(() => cstImplicitList());
        (node.tree as unknown as CstGroup).isAttached = false;
      } finally {
        this.insideImplicit = false;
      }
    }

    const child = parent.createChild(info, this.c.tokenizer.offset);

    const kind = special ? "Special Node" : this.insideImplicit ? dim("Implicit Node") : "Node";
    debug`${
      fmt.lazy(() =>
        fmt`${fmt.cyan(() => child.error !== undefined ? strikethrough(kind) : kind)} ${info} ➜  ` +
        (child.error !== undefined
          ? child.error === null ? fmt.dim`null` : fmt`${fmt.red(`${child.error}`)}`
          : "...")
      )
    }`;

    this.groups.push(child);
    return this as any;
  }

  beginPeek<Child extends CstNode>(): CstParseContext<Child> {
    const parent = this.current;

    const child = parent.createChild(CstPeekNode, this.c.tokenizer.offset);
    child.snapshot = this.c.snapshot();
    // child.allowImplicit = true;

    const kind = this.insideImplicit ? dim("Implicit Node") : dim("Peek");
    debug`${
      fmt.lazy(() =>
        fmt`${fmt.cyan(() => child.error !== undefined ? strikethrough(kind) : kind)} ➜  ` +
        (child.error !== undefined
          ? child.error === null ? fmt.dim`null` : fmt`${fmt.red(`${child.error}`)}`
          : "...")
      )
    }`;
    this.groups.push(child);
    return this as any;
  }

  beginDetached<Child extends CstNode>(): CstParseContext<Child> {
    const parent = this.current;

    // not using parent.createChild
    const child = parent.createChild(CstDetachedNode, this.c.tokenizer.offset);
    child.snapshot = this.c.snapshot();

    const kind = dim("Detached");
    debug`${
      fmt.lazy(() =>
        fmt`${fmt.cyan(() => child.error !== undefined ? strikethrough(kind) : kind)} ➜  ` +
        (child.error !== undefined
          ? child.error === null ? fmt.dim`null` : fmt`${fmt.red(`${child.error}`)}`
          : "...")
      )
    }`;
    this.groups.push(child);
    return this as any;
  }

  hintType(type: CstNodeHintType) {
    const current = this.current;
    switch (type) {
      case "discardable": {
        if (!current.snapshot) {
          current.snapshot = this.c.snapshot();
        }
        break;
      }
    }
  }

  noImplicitNodes() {
    this.current.disableImplicit = true;
  }

  beforeEnd(node: Node): CstTree<Node> {
    return this.current.beforeEnd(node) as CstTree<Node>;
  }

  end(node: Node): Node {
    // deno-lint-ignore prefer-const
    let group: CstTree | null;
    debug`${fmt.dim`${this.current.info} ➜ `} ${
      fmt.lazy(() =>
        group && (group as any)?.shadowedGroups && group.node === group.children.at(0)?.node
          ? fmt.italic`${fmt.rgb8(group.node.constructor.name, 19)}(${fmt.dim`same`})`
          : fmt`${node}`
      )
    }`;

    const child = this.groups.pop()!;
    if (isInherited(child.info, CstSpecialNode)) {
      switch (child.info) {
        case CstPeekNode:
          return this.endPeek(node, child);
        case CstDetachedNode:
          return this.endDetached(node, child);
        default:
          console.error(child.info);
          throw new Error(`unknown special node ${child.info}`);
      }
    }
    group = child.end(node);

    const parent = this.current;
    if (group) parent.addChild(group);

    if (this.groups.length === 1) this.flushLog();

    return node;
  }

  endPeek(node: Node, child: CstIntermediateGroup): Node {
    child.end(node);

    this.c.restore(child.snapshot!);

    if (this.groups.length === 1) this.flushLog();

    return node;
  }

  endDetached(node: Node, child: CstIntermediateGroup): Node {
    child.end(node);

    this.c.restore(child.snapshot!);

    // this.debug.disableLog = false; // TODO
    if (this.groups.length === 1) this.flushLog();

    return node;
  }

  endWithError(error: unknown | null): Node | null {
    if (error) debug`${fmt.dim("endWithError")} ${fmt.red(`${error}`)}`;
    const child = this.groups.pop()!;

    const result = child.endWithError(error);
    if (child.snapshot) {
      this.c.restore(child.snapshot);
    } else {
      if (!error && child.spanEnd != child.spanStart) {
        throw new Error(
          "nullableNode should call enableDiscard() to " +
            "consume any node then return null.",
        );
      }
    }

    if (this.groups.length === 1) this.flushLog();
    return result;
  }

  abstract insertChild<Child extends CstNode>(node: Child): Child;

  // NOTE: called by withContext()
  flushLog() {
    const pending = this.debug._pendingLogs;
    this.debug._pendingLogs = [];

    for (const [depth, line] of pending) {
      const indent = "  ".repeat(depth);
      console.log(indent + format(line).replaceAll("\n", `\n${indent}`));
    }
  }
}
