import type { CstNode } from "../../cst/CstNode.ts";
import { GetSpanSymbol, type Spanned } from "../../token/Spanned.ts";
import type { CstMutableList, CstMutableListInternal } from "../CstMutableList.ts";
import {
  CstParseIntrinsicKey,
  type CstParseIntrinsics,
  type CstParseIntrinsicsBase,
} from "../intermediate/CstParseIntrinsics.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import { CstImplicitNode, CstInsertedNode } from "../CstSpecialNode.ts";
import { Contexts } from "./contexts.ts";
import { fmt } from "../../utils/format.ts";
import type { Token } from "../../token/Token.ts";
import { CstTree } from "../../cst/CstTree.ts";
import { detailedError } from "../../common/error.ts";

export class CstParseIntrinsicsImpl<Info extends CstNodeInfo<any>>
  implements CstParseIntrinsicsBase {
  static create<Info extends CstNodeInfo<any> & { intrinsic?: CstParseIntrinsicKey<never> }>(
    info: Info,
    meta: CstIntermediateMetadata<Info>,
    state: CstIntermediateState<any>,
  ): CstParseIntrinsicsImpl<Info> & CstParseIntrinsics<Info>;
  static create<Info extends CstNodeInfo<any> & { intrinsic: CstParseIntrinsicKey<any> }>(
    info: Info,
    meta: CstIntermediateMetadata<Info>,
    state: CstIntermediateState<any>,
    value: Info["intrinsic"] extends CstParseIntrinsicKey<infer T> ? T : never,
  ): CstParseIntrinsicsImpl<Info> & CstParseIntrinsics<Info>;
  static create<Info extends CstNodeInfo<any>>(
    info: Info,
    meta: CstIntermediateMetadata<Info>,
    state: CstIntermediateState<any>,
    value?: any,
  ): CstParseIntrinsicsImpl<Info> & CstParseIntrinsics<Info> {
    const key = info.intrinsic;
    if (key) {
      const impl = new CstParseIntrinsicsImpl(
        meta,
        state,
        (k) => k ? k === key ? value : null : value,
      );
      if (key instanceof CstParseIntrinsicKey.Global) {
        for (const key of Reflect.ownKeys(value)) {
          if (key in impl) continue;
          Object.defineProperty(impl, key, {
            get() {
              return Reflect.get(value, key);
            },
          });
        }
      }
      return impl as any;
    }
    return new CstParseIntrinsicsImpl(meta, state, () => null) as any;
  }

  constructor(
    readonly meta: CstIntermediateMetadata<Info>,
    readonly state: CstIntermediateState<any>,
    readonly getIntrinsic: <T>(key: CstParseIntrinsicKey<T> | null) => T | null,
  ) {}

  insertChild<Node extends CstNode>(self: CstIntermediateGroup<any>, node: Node): Node {
    return self.beginSpecialChild(
      class extends CstInsertedNode<Node> {
        static targetNode = node;
      },
    ).buildNode((inserted) => {
      const result = inserted.intrinsics.insertNode(node);
      return new CstInsertedNode(result);
    }).value;
  }

  provideImplicitNode(node: (() => CstNode | null) | null): void {
    this.meta.provideContext(Contexts.ImplicitNode.provides(node));
  }

  markNullable(): void {
  }

  markDiscardable(): void {
  }

  markVital(reason?: Spanned): void {
    console.warn(`TODO: markVital does nothing; reason=${reason}`);
  }

  parseToken<R>(fn: (onToken: (token: Token) => void) => R): R {
    return this.state.items.parseToken(this.state, fn);
  }

  intrinsicListCreated<T extends Spanned>(list: CstMutableListInternal<T>): CstMutableList<T> {
    return list;
  }

  intrinsicListPushItem<T extends Spanned>(list: CstMutableListInternal<T>, item: T): void {
    const items = this.state.items.get();
    const tree = items.at(-1);
    if (!tree || tree.span !== item[GetSpanSymbol]) {
      const intermediateItems = this.state.items.intermediateItems.map((item) => item.meta.info);
      throw detailedError`
        Expected last child item of this(${this.meta.info}) to have identical span as given item.
        - ${fmt.brightYellow("last child item")}: ${tree}
        - ${fmt.brightYellow("intermediateItems")}: ${intermediateItems}
        - ${fmt.brightYellow("given item")}: ${item}
      `;
    }
    if (list.length > 0) {
      const maybeImplicit = items.at(-2);
      if (maybeImplicit instanceof CstTree && maybeImplicit.node instanceof CstImplicitNode) {
        if (list.at(-1)![GetSpanSymbol].end === maybeImplicit.span.start) {
          list.implicitList.push(maybeImplicit.node);
        } else {
          throw detailedError`
            Span not continuous: ${list.at(-1)?.[GetSpanSymbol].dumpSimple()} -> \\
            ${maybeImplicit.span.dumpSimple()} -> ${item[GetSpanSymbol].dumpSimple()}
            - ${fmt.brightYellow("CstMutableList.at(-1)")}: ${list.at(-1)}
            - ${fmt.brightYellow("items.at(-2)")}: ${maybeImplicit}
            - ${fmt.brightYellow("given item for CstMutableList.push()")}: ${item}
          `;
        }
      }
    }
    list.pushInternal(item);
  }

  intrinsicTestNode(node: () => CstNode | boolean | null): boolean {
    return !!node();
  }

  intrinsic<T>(key: CstParseIntrinsicKey<T>): T;
  intrinsic(): never;
  intrinsic<T>(key?: CstParseIntrinsicKey<T>): T {
    const intrinsic = this.getIntrinsic(key ?? null);
    if (!intrinsic) throw new Error(`could not find intrinsic for ${key}`);
    return intrinsic;
  }

  debugHint: CstParseIntrinsics["debugHint"] = function (key, value) {
    switch (key) {
      case "name":
        return;
      case "nodeName":
        return;
      default:
        console.warn(fmt`debugHint ${key} was ignored, value=${value}`.s);
    }
  };
}
