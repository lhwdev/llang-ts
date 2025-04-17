import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstTree, CstTreeItem } from "../../cst/CstTree.ts";
import { Token } from "../../token/Token.ts";
import { fmt } from "../../utils/format.ts";
import { mergePrototypeChain } from "../../utils/variableWrapper.ts";
import { withContext } from "../CstParseContext.ts";
import type { CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import type { CstTokenizerContext } from "../tokenizer/CstTokenizerContext.ts";
import { CstCodeContextImpl } from "./CstCodeContextImpl.ts";
import { CstGroup } from "./CstGroup.ts";
import { CstInsertingIntermediateGroup } from "./CstInsertingIntermediateGroup.ts";
import { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import { CstParseContextBase } from "./CstParseContextBase.ts";
import { debug } from "../impl/debug.ts";

export function insertChild<Node extends CstNode, Child extends CstNode>(
  into: CstParseContextBase<Node>,
  node: Child,
): Child {
  debug`${fmt.cyan("insertChild")} -> ${node.constructor.name}`;

  const context = new CstInsertionContext(into);

  const mapGroup = <N extends CstNode>(
    parent: CstInsertionContext<CstNode>,
    tree: CstTree<N>,
  ): CstTree<N> => {
    const child = parent.beginInsertedChild(tree);
    return withContext(child, () => {
      const node = tree.node.mapEach(<T extends CstTreeItem>(item: T): T => {
        if (item instanceof Token) return child.code((c) => c.consume(item)) as T;
        else return mapGroup(child, item) as T;
      });

      const newTree = child.beforeEnd(node);
      child.end(node);
      return newTree;
    });
  };

  return mapGroup(context, node.tree).node;
}

export class CstInsertionContext<out Node extends CstNode> extends CstParseContextBase<Node> {
  constructor(parent: CstParseContextBase<Node>) {
    super();

    this.tokenizer = parent.tokenizer;
    this.c = new CstCodeContextImpl(this.tokenizer.subscribe((_, token) => {
      this.current.reportToken(token);
    }));
    this.codeScopes = parent.codeScopes;

    const into = parent.groups.at(-1)!;
    const rootGroup: CstIntermediateGroup = mergePrototypeChain(
      into,
      IntoGroupStub.prototype,
      Object.getPrototypeOf(into),
    );
    this.groups = [rootGroup];
  }

  override readonly tokenizer: CstTokenizerContext;
  override readonly c: CstCodeContextImpl;

  override readonly codeScopes: CstCodeScopes;

  override readonly groups: CstIntermediateGroup[];

  private sources: CstTree[] = [];

  beginInsertedChild<Child extends CstNode>(source: CstTree<Child>): CstInsertionContext<Child> {
    if (this.sources.includes(source)) {
      console.error(this.sources.map((s) => s.dump()).join(", "));
      throw new Error(`recursive node tree: ${source.node} is duplicated`);
    }

    console.assert(
      this.tokenizer.offset === source.span.start,
      `expected offset=${this.tokenizer.offset} but got node(span=${source.span})`,
    );
    debug`beginInsertedChild! ${source}`;

    const child = super.beginChild(source.info);
    if (child as any !== this) throw new Error("implementation has changed...");
    this.sources.push(source);

    return this as unknown as CstInsertionContext<Child>;
  }

  override end(node: Node): Node {
    this.sources.pop();
    return super.end(node);
  }

  override insertChild<Child extends CstNode>(node: Child): Child {
    return insertChild(this, node);
  }
}

abstract class IntoGroupStub extends CstIntermediateGroup {
  abstract readonly into: CstIntermediateGroup;

  override createChild(info: CstNodeInfo<any>, offset: number): CstIntermediateGroup {
    return new CstInsertingIntermediateGroup(this.into, info, offset);
  }

  protected override createGroup(node: CstNode): CstTree {
    return new CstGroup(this.into, node);
  }

  override addChild(child: CstTree): void {
    this.into.addChild(child);
  }

  protected illegalOnRoot(): never {
    throw new Error("trying to insert child into root group");
  }

  override beforeEnd(_node: CstNode): CstGroup {
    this.illegalOnRoot();
  }

  override end(_node: CstNode): CstGroup {
    this.illegalOnRoot();
  }
}
