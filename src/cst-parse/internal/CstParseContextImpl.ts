import { CstRootNode } from "../../cst/CstRootNode.ts";
import { cstImplicit } from "../../parser/cstImplicit.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type { CstNode } from "../CstNode.ts";
import type { CstNodeInfo } from "../CstNodeInfo.ts";
import {
  context as RootContext,
  type CstNodeHintType,
  type CstParseContext,
  withContext,
} from "../CstParseContext.ts";
import type { CstTree } from "../CstTree.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import { CodeScopesImpl } from "../tokenizer/scopes.ts";
import { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import { CstGroup } from "./CstGroup.ts";

export class CstParseContextImpl<Node extends CstNode> implements CstParseContext<Node> {
  constructor(
    readonly tokenizer: CstTokenizerContext,
  ) {
    this.c = new CstCodeContextImpl(tokenizer);

    this.codeScopes = new CodeScopesImpl(this.tokenizer);
    this.normalScope = this.codeScopes.normal();

    const root = new CstGroup({} as any, CstRootNode, tokenizer.offset, []);
    (root as any).parent = root;
    this.groups = [root];
  }

  readonly c: CstCodeContextImpl;

  codeScopes: CstCodeScopes;
  private normalScope;

  /// Code parsing
  code<R>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

  code<R>(a: CstCodeScope | ((code: CstCodeContext) => R), b?: (code: CstCodeContext) => R): R {
    let scope;
    let fn;
    if (typeof a === "function") {
      scope = this.current.codeScope ?? this.normalScope;
      fn = a;
    } else {
      scope = a;
      fn = b!;
    }
    this.c.scope = scope;
    try {
      return fn(this.c);
    } finally {
      this.current.extendSpan(this.tokenizer.offset);
    }
  }

  pushCodeScope(scope: CstCodeScope) {
    this.current.codeScope = scope;
  }

  /// Node management
  readonly groups: CstGroup[];

  get current() {
    return this.groups.at(-1)!;
  }

  private withSelf<R>(fn: () => R): R {
    if (this === RootContext as any) return fn();
    return withContext(this as unknown as CstParseContextImpl<never>, fn);
  }

  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child> {
    const parent = this.current;
    if (!parent.disableImplicit && parent.allowImplicit) {
      parent.allowImplicit = false;
      this.withSelf(() => cstImplicit());
    }

    const child = new CstGroup(parent, info, this.tokenizer.offset, []);
    this.groups.push(child);
    return this as any;
  }

  hintType(type: CstNodeHintType) {
    this.current.type = type;
  }

  noImplicitNodes() {
    this.current.disableImplicit = true;
  }

  beforeEnd(node: CstNode): CstTree {
    this.current.node = node;
    return this.current;
  }

  end(node: Node): Node {
    const child = this.groups.pop()!;
    child.node = node;

    const parent = this.current;
    parent.extendSpan(child.spanTo);

    if (child.spanFrom != child.spanTo) {
      parent.allowImplicit = true;
    }

    return node;
  }

  endWithError(error: unknown): Node | null {
    const child = this.groups.pop()!;
    return child.endWithError(error);
  }
}
