import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree } from "../../cst/CstTree.ts";
import type { Token } from "../../token/Token.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type { ContextValue, CstNodeHintType, CstParseContext } from "../CstParseContext.ts";
import { ContextKeys } from "../CstParseContext.ts";
import type { useImplicitNode } from "../intrinsics.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstIntermediateRoot } from "./CstIntermediateRoot.ts";

export class CstParseContextImpl implements CstParseContext {
  c: CstCodeContextImpl;
  current: CstIntermediateGroup;

  constructor(readonly tokenizer: CstTokenizerContext) {
    this.c = new CstCodeContextImpl(tokenizer);
    this.current = new CstIntermediateRoot();
  }

  provideRootContexts(
    { codeScopes, implicitNodes }: {
      codeScopes: CstCodeScopes;
      implicitNodes: Parameters<typeof useImplicitNode>[0];
    },
  ) {
    this.provideContext(ContextKeys.CodeScopes.provides(codeScopes));
    this.provideContext(ContextKeys.ImplicitNode.provides(implicitNodes));
  }

  /// Code parsing

  private normalScope?: CstCodeScope;

  codeScopes!: CstCodeScopes;

  code<R extends Token>(fn: (code: CstCodeContext) => R): R;
  code<R>(scope: CstCodeScope | null, fn: (code: CstCodeContext) => R): R;
  code<R>(
    a: CstCodeScope | null | ((code: CstCodeContext) => R),
    b?: (code: CstCodeContext) => R,
  ): R {
    let scope;
    let fn;

    if (!this.normalScope) this.normalScope = this.codeScopes.normal();
    if (b) {
      const givenScope = a as CstCodeScope | null;
      if (givenScope) {
        scope = givenScope;
      } else {
        scope = this.normalScope;
      }
      fn = b;
    } else {
      scope = this.normalScope;
      fn = a as (code: CstCodeContext) => R;
    }

    return this.current.code(this.c, scope, fn);
  }

  beginChild<Child extends CstNode>(info: CstNodeInfo<Child>): CstParseContext<Child> {
    throw new Error("Method not implemented.");
  }
  
  hintType(type: CstNodeHintType): void {
    throw new Error("Method not implemented.");
  }
  
  provideContext(value: ContextValue<any>): void {
    this.current.
  }
  
  beforeEnd(node: CstNode): CstTree<CstNode> {
    throw new Error("Method not implemented.");
  }
  
  end(node: CstNode): CstNode {
    throw new Error("Method not implemented.");
  }
  
  endWithError(error: unknown | null): CstNode | null {
    throw new Error("Method not implemented.");
  }
  
  insertChild<Child extends CstNode>(node: Child): Child {
    throw new Error("Method not implemented.");
  }
}
