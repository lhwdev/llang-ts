import { detailedError } from "../../common/error.ts";
import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { Token } from "../../token/Token.ts";
import { fmt, format } from "../../utils/format.ts";
import type { CstImplicitNode, CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import type { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import { currentGroup } from "../intermediate/currentGroup.ts";
import type { CstGroup, CstGroupItem } from "../tree/CstGroup.ts";
import { Contexts } from "./contexts.ts";
import type { CstIntermediateBehavior } from "./CstIntermediateBehavior.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import type { CstIntermediateState } from "./CstIntermediateState.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";

export class CstIntermediateItems {
  constructor(
    protected readonly meta: CstIntermediateMetadata<any>,
  ) {}

  protected value: CstGroupItem[] = [];
  readonly intermediateItems: CstIntermediateGroupBase<any>[] = [];

  lifecycle: CstIntermediateItems.Lifecycle = CstIntermediateItems.Lifecycle.Created;
  declare lastError?: CstErrorResult;

  protected get behavior(): CstIntermediateBehavior {
    return this.meta.behavior;
  }

  acceptImplicit = false;

  get(): readonly CstGroupItem[] {
    return this.value;
  }

  beginChild<Info extends CstNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: Info,
  ): CstIntermediateGroupBase<InstanceType<Info>, Info> {
    console.assert(this === self.state.items, "this != self.items");

    const type = this.findChildType(info);
    return this.beginChildIntermediate(self, type, info);
  }

  beginSpecialChild<Info extends CstSpecialNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: Info,
  ): CstIntermediateGroupBase<InstanceType<Info>, Info> {
    console.assert(this === self.state.items, "this != self.items");

    const type = this.findSpecialChildType(info);
    return this.beginChildIntermediate(self, type, info);
  }

  protected beginChildIntermediate<Info extends CstSpecialNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    type: CstIntermediateType<Info>,
    info: Info,
  ): CstIntermediateGroupBase<InstanceType<Info>, Info> {
    if (this.lifecycle !== CstIntermediateItems.Lifecycle.Initialized) {
      const message = () => {
        switch (this.lifecycle) {
          case CstIntermediateItems.Lifecycle.Created:
            return "Internal error";
          case CstIntermediateItems.Lifecycle.Child:
            throw detailedError`
              calling parent.beginChild() inside child.
              - ${fmt.brightYellow`parent`}: ${self.meta.info}
              - ${fmt.brightYellow`child`}: ${this.intermediateItems.at(-1)?.info}
            `;
          case CstIntermediateItems.Lifecycle.End:
            return "calling self.beginChild() after self.end() or self.endWithError().";
          default:
            return `unexpected lifecycle ${this.lifecycle}.`;
        }
      };
      throw detailedError`
        ${fmt.raw(message())}
        - ${fmt.brightYellow`self`}: ${self.meta.info}
        - ${fmt.brightYellow`currentGroup()`}: ${currentGroup().info}
      `;
    }

    const implicitNode = this.handleImplicit(self, type, info);

    const meta = type.createMetadata(self, info);

    const parentState = self.state;
    const state = type.createIntermediateState(meta, parentState);
    if (implicitNode) state.reportImplicitNode(implicitNode);

    const intrinsics = type.createIntrinsics(info, meta, state);

    const group = this.behavior.createIntermediateGroup(meta, state, intrinsics);
    this.intermediateItems.push(group);
    this.lifecycle = CstIntermediateItems.Lifecycle.Child;

    return group;
  }

  protected findChildType<Info extends CstNodeInfo<any>>(_info: Info): CstIntermediateType<Info> {
    return this.behavior.defaultChildType;
  }

  protected findSpecialChildType<Info extends CstNodeInfo<any>>(
    info: Info,
  ): CstIntermediateType<Info> {
    return this.behavior.findSpecialChildType(info);
  }

  protected handleImplicit(
    parent: CstIntermediateGroupBase<any>,
    type: CstIntermediateType<any>,
    info: CstNodeInfo<any>,
  ): CstImplicitNode | null {
    if (!this.acceptImplicit) return null;

    const implicitFn = this.meta.resolveContextOrNull(Contexts.ImplicitNode)?.value;
    if (!implicitFn) return null;

    const implicitNode = type.handleImplicitPrefix(parent, implicitFn, info);
    this.acceptImplicit = false;
    return implicitNode;
  }

  endChild<Node extends CstNode>(
    child: CstIntermediateGroupBase<Node>,
    result: CstGroup<Node> | CstErrorResult,
  ) {
    this.lifecycle = CstIntermediateItems.Lifecycle.Initialized;

    if (child !== this.intermediateItems.at(-1)) {
      throw detailedError`
        'child' is not direct child of this group.
        - ${fmt.brightYellow`child`}: ${child}
        - ${fmt.brightYellow`expected`}: ${this.intermediateItems.at(-1)}
      `;
    }

    if (result instanceof CstErrorResult) {
      this.lastError = result;
      this.reportEndOfChild(child, result);
      return;
    }

    this.value.push(result);

    if (child.state.isExplicitNode) {
      this.acceptImplicit = true;
    }

    this.reportEndOfChild(child, result);
  }

  reportEndOfChild<Node extends CstNode>(
    child: CstIntermediateGroupBase<Node>,
    result: CstGroup<Node> | CstErrorResult,
  ) {
    const selfState = child.state.parentState;
    selfState.endChild(child, result);
  }

  parseToken<R>(state: CstIntermediateState<any>, fn: (onToken: (token: Token) => void) => R): R {
    const tokens: Token[] = [];
    const onToken = (token: Token) => {
      if (tokens.length) {
        throw new Error(
          "parse maximum of one token inside one code() invocation. " +
            "To parse multiple token, call code() multiple times.",
        );
      }

      if (token.span.start !== state.offset) {
        throw new Error("span not continuous");
      }
      tokens.push(token);
    };
    const result = fn(onToken);
    const token = tokens.at(0);
    if (token) {
      state.reportToken(token);
      this.value.push(token);
    }
    return result;
  }
}

export namespace CstIntermediateItems {
  export class Lifecycle {
    private constructor(
      readonly name: string,
      readonly valid: boolean,
      readonly current: boolean,
      readonly child: boolean,
    ) {}

    static Created = new Lifecycle("initialized", true, false, false);
    static Initialized = new Lifecycle("current", true, true, false);
    static Child = new Lifecycle("child", false, false, true);
    static End = new Lifecycle("end", false, false, false);
  }
}

export class CstErrorResult {
  constructor(readonly value: unknown | null, readonly from: CstIntermediateGroup<any>) {}

  @format.print
  dump() {
    return fmt.red`${this.value}`;
  }
}
