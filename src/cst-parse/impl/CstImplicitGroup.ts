import type { CstNode } from "../../cst/CstNode.ts";
import { CstConcreteGroup } from "./CstConcreteGroup.ts";

export class CstImplicitGroup<Node extends CstNode> extends CstConcreteGroup<Node> {}
