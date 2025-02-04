import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstInsertedNode } from "../CstSpecialNode.ts";
import type { CstTreeItem } from "../../cst/CstTree.ts";
import { CstTree } from "../../cst/CstTree.ts";
import { ContextKeys } from "../CstParseContext.ts";
import type { CstGroup } from "./CstGroup.ts";
import { CstInsertedGroup, CstInsertedGroupRoot } from "./CstInsertedGroup.ts";
import { CstIntermediateNode } from "./CstIntermediateNode.ts";

// Should not use getContext(); current is not updated

export class CstIntermediateInsertion extends CstIntermediateNode {
  index: number = 0;
  source?: CstNode;

  protected override createChild(info: CstNodeInfo<any>): CstIntermediateInsertion {
    return new (this.childInstance(CstIntermediateInsertion))(this, info);
  }

  endInsertion<Node extends CstNode>(source: Node): Node {
    this.source = source;
    const newNode = source.mapEach((item) => this.mapItem(item) as any);
    // TODO: how to deal with shadow
    newNode.tree = this.beforeEnd(newNode);
    return this.end(newNode);
  }

  mapItem(item: CstTreeItem): CstTreeItem {
    if (item instanceof CstTree) {
      const child = this.beginChild(item.info);
      if (!(child instanceof CstIntermediateInsertion)) {
        console.error("unexpected intermediate child", child);
        throw new Error("unexpected intermediate child");
      }
      // TODO: problem with shadow exists?
      return child.withSelf(() => (child.skipping() ?? child.endInsertion(item.node)).tree);
    } else { // item instanceof Token
      return this.code(
        this.resolveContext(ContextKeys.CodeScope).value,
        (c) => c.consume(item),
      );
    }
  }

  protected override createGroup<Node extends CstNode>(node: Node): CstGroup<Node> {
    const group = new CstInsertedGroup(this, node);
    group._source = this.source!.tree as CstTree<Node>;
    return group;
  }
}

export class CstIntermediateInsertionRoot extends CstIntermediateNode {
  source!: CstNode;

  protected override createChild(info: CstNodeInfo<any>): CstIntermediateInsertion {
    return new (this.childInstance(CstIntermediateInsertion))(this, info);
  }

  insertRoot<Node extends CstNode>(source: Node): Node {
    this.source = source;
    const child = this.beginChild(source.tree.info);
    if (!(child instanceof CstIntermediateInsertion)) {
      throw new Error("unexpected child");
    }

    const inserted = new CstInsertedNode(
      child.withSelf(() => child.skipping<Node>() ?? child.endInsertion(source)),
    );
    return this.end(inserted).value;
  }

  protected override createGroup<Node extends CstNode>(node: Node): CstGroup<Node> {
    return new CstInsertedGroupRoot(this, node);
  }
}
