import { CstIntermediateBehaviorBase } from "../../lib/cst-parse/impl/CstIntermediateBehaviorBase.ts";
import type { CstIntermediateType } from "../../lib/cst-parse/impl/CstIntermediateType.ts";
import { CstIntermediateTypeImpl } from "../../lib/cst-parse/impl/CstIntermediateTypeImpl.ts";
import { CstIntermediateRootGroup } from "../../lib/cst-parse/impl/root/CstIntermediateRootGroup.ts";
import { node } from "../../lib/cst-parse/inlineNode.ts";
import { CstNode } from "../../lib/cst/CstNode.ts";

Error.stackTraceLimit = Infinity;

const behavior = new class extends CstIntermediateBehaviorBase {
  override enableDebug = true;
  override defaultChildType: CstIntermediateType<any> = new CstIntermediateTypeImpl(CstNode);
}();

const root = new CstIntermediateRootGroup(behavior);
root.withRoot(() => {
  return node(CstNode, () => new CstNode());
});
