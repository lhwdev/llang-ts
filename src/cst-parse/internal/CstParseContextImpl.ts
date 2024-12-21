import { cstImplicitOrNull } from "../../parser/cstImplicit.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import {
  context as RootContext,
  type CstNodeHintType,
  type CstParseContext,
  withContext,
} from "../CstParseContext.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import { CodeScopesImpl } from "../tokenizer/scopes.ts";
import { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import { CstIntermediateGroup, CstRootGroup } from "./CstGroup.ts";
import { format } from "../../utils/format.ts";
import { dim } from "@std/fmt/colors";
import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";

export class CstParseContextImpl<Node extends CstNode> implements CstParseContext<Node> {
  constructor(
    tokenizer: CstTokenizerContext,
  ) {
    tokenizer = tokenizer.subscribe((_, token) => {
      this.current.reportToken(token);
    });
    this.tokenizer = tokenizer;
    this.c = new CstCodeContextImpl(tokenizer);

    this.codeScopes = new CodeScopesImpl(tokenizer);
    this.normalScope = this.codeScopes.normal();
    this.c.scope = this.normalScope;

    const root = new CstRootGroup();
    this.groups = [root];
  }

  readonly tokenizer: CstTokenizerContext;
  readonly c: CstCodeContextImpl;

  codeScopes: CstCodeScopes;
  private normalScope;

  private debugC(line: string) {
    console.log(dim("CstParseContextImpl: " + line));
  }

  /// Code parsing
  code<R>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R;

  code<R>(a: CstCodeScope | ((code: CstCodeContext) => R), b?: (code: CstCodeContext) => R): R {
    const current = this.current;
    let scope = current.startCode();
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
      if (result) {
        this.debugC(`code(${this.c.scope.constructor.name}, ${fn}) -> ${format(result)}`);
      }
      return result;
    } finally {
      current.endCode();
      this.c.scope = this.normalScope;
    }
  }

  pushCodeScope(scope: CstCodeScope) {
    this.current.codeScope = scope;
  }

  /// Node management
  readonly groups: CstIntermediateGroup[];

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
      this.withSelf(() => cstImplicitOrNull());
    }

    const child = new CstIntermediateGroup(parent, info, this.tokenizer.offset);
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
    const current = this.current;
    current.node = node;
    return current.beforeEnd(node);
  }

  end(node: Node): Node {
    const child = this.groups.pop()!;
    const group = child.ensureEnd(node);

    const parent = this.current;
    parent.addChild(group);

    // if (this.groups.length === 1) console.log(node);

    return node;
  }

  endWithError(error: unknown | null): Node | null {
    const child = this.groups.pop()!;
    return child.endWithError(error);
  }
}
