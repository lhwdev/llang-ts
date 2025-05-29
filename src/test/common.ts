import { CstCodeBehavior } from "../../lib/cst-code/CstCodeBehavior.ts";
import { CstIntermediateCodeBehavior } from "../../lib/cst-code/CstIntermediateCodeBehavior.ts";
import type { CstCodeScope } from "../../lib/cst-code/tokenizer/CstCodeScope.ts";
import type { CstCodeContext } from "../../lib/cst-code/CstCodeContext.ts";
import type { CstIntermediateType } from "../../lib/cst-parse/impl/CstIntermediateType.ts";
import { CstIntermediateTypeImpl } from "../../lib/cst-parse/impl/CstIntermediateTypeImpl.ts";
import { CstIntermediateRootGroup } from "../../lib/cst-parse/impl/root/CstIntermediateRootGroup.ts";
import { CstNode } from "../../lib/cst/CstNode.ts";
import { CstCodeContextLocal, CstCodeScopesLocal } from "../../lib/cst-code/CstCodeContextLocal.ts";
import { CstCodeContextImpl } from "../../lib/cst-code/impl/CstCodeContextImpl.ts";
import { CstStringTokenizerContext } from "../../lib/cst-code/impl/CstStringTokenizerContext.ts";
import { currentGroup } from "../../lib/cst-parse/intermediate/currentGroup.ts";
import type { Token } from "../../lib/token/Token.ts";
import { useContext } from "../../lib/cst-parse/intrinsics.ts";
import { CodeScopesImpl } from "../tokenizer/scopes.ts";

Error.stackTraceLimit = Infinity;

class StringCodeBehavior extends CstCodeBehavior {
  readonly tokenizer;
  readonly context;
  private onToken: (token: Token) => void = () => {};

  constructor(
    code: string,
  ) {
    super();
    this.tokenizer = new CstStringTokenizerContext(code);
    this.context = new CstCodeContextImpl(this.tokenizer, (token) => this.onToken(token));
  }

  override get codeScopes(): unknown {
    return useContext(CstCodeScopesLocal).codeScopes;
  }

  override code<R>(scope: CstCodeScope | null, fn: (code: CstCodeContext) => R): R {
    return currentGroup().intrinsics.parseToken((onToken) => {
      this.onToken = onToken;
      const context = this.context;
      try {
        context.scope = scope ?? useContext(CstCodeScopesLocal).defaultScope;
        return fn(context);
      } finally {
        this.onToken = () => {};
      }
    });
  }

  override snapshot(): unknown {
    return this.context.snapshot();
  }

  override restore(to: unknown): void {
    this.context.restore(to);
  }
}

export function testCstParse(testCode: string, fn: () => void) {
  const codeBehavior = new StringCodeBehavior(testCode);

  const behavior = new class extends CstIntermediateCodeBehavior {
    override enableDebug = true;
    override codeBehavior = codeBehavior;
    override defaultChildType: CstIntermediateType<any> = new CstIntermediateTypeImpl(CstNode);
  }();

  const root = new CstIntermediateRootGroup(behavior);
  root.meta.provideContext(CstCodeContextLocal.Key.provides(codeBehavior));
  const codeScopes = new CodeScopesImpl(codeBehavior.tokenizer);
  root.meta.provideContext(CstCodeScopesLocal.provides({
    codeScopes,
    defaultScope: codeScopes.normal(),
  }));

  root.withRoot(() => {
    fn();
  });
}
