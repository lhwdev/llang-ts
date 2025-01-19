import type { CstNode } from "../../cst/CstNode.ts";
import type { CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import { CodeScopesImpl } from "../tokenizer/scopes.ts";
import { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import { insertChild } from "./CstInsertionContext.ts";
import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";
import { CstParseContextBase } from "./CstParseContextBase.ts";
import { CstRootGroup } from "./CstRootGroup.ts";

export class CstParseContextImpl<out Node extends CstNode> extends CstParseContextBase<Node> {
  constructor(
    tokenizer: CstTokenizerContext,
  ) {
    super();

    this.tokenizer = tokenizer;
    this.c = new CstCodeContextImpl(tokenizer.subscribe((_, token) => {
      this.current.reportToken(token);
    }));

    this.codeScopes = new CodeScopesImpl(tokenizer);

    const root = new CstRootGroup();
    this.groups = [root];
  }

  override readonly tokenizer: CstTokenizerContext;
  override readonly c: CstCodeContextImpl;

  override readonly codeScopes: CstCodeScopes;

  override readonly groups: CstIntermediateGroup[];

  insertChild<Child extends CstNode>(node: Child): Child {
    return insertChild(this, node);
  }
}
