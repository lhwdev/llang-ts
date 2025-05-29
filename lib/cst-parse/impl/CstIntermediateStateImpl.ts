import { detailedError } from "../../common/error.ts";
import type { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { Span } from "../../token/Span.ts";
import type { Token } from "../../token/Token.ts";
import { fmt } from "../../utils/format.ts";
import type { CstSpecialNodeInfo } from "../CstSpecialNode.ts";
import { CstGroup } from "../tree/CstGroup.ts";
import type { CstIntermediateBehavior } from "./CstIntermediateBehavior.ts";
import { CstIntermediateDebugImpl } from "./CstIntermediateDebugImpl.ts";
import { CstIntermediateFlags } from "./CstIntermediateFlags.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import { CstErrorResult, CstIntermediateItems } from "./CstIntermediateItems.ts";
import type { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";
import { CstIntermediateSlots } from "./CstIntermediateSlots.ts";
import { CstIntermediateState } from "./CstIntermediateState.ts";

export class CstIntermediateStateImpl<
  out Node extends CstNode,
  Info extends CstNodeInfo<Node> = CstNodeInfo<Node>,
> extends CstIntermediateState<Node, Info> {
  override offset: number;

  constructor(
    readonly parentState: CstIntermediateState<any>,
    override readonly meta: CstIntermediateMetadata<any>,
    override readonly items: CstIntermediateItems,
  ) {
    super();

    this.offset = meta.startOffset;
    if (meta.behavior.enableDebug) {
      this.debug = new CstIntermediateDebugImpl(this);
    }
  }

  declare debug?: CstIntermediateDebugImpl | undefined;

  override readonly slots: CstIntermediateSlots = new CstIntermediateSlots();

  override group: CstGroup<Node, Info> | null = null;
  declare error?: CstErrorResult;

  declare flags?: CstIntermediateFlags;

  protected get behavior(): CstIntermediateBehavior {
    return this.meta.behavior;
  }

  protected ensureFlags(): CstIntermediateFlags {
    if (!this.flags) this.flags = new CstIntermediateFlags();
    return this.flags;
  }

  override get isExplicitNode(): boolean {
    return this.meta.type.isExplicit && this.offset !== this.meta.startOffset;
  }

  get isRestorableGroup(): boolean {
    return this.meta.type.isRestorable || (this.flags?.isRestorable ?? false);
  }

  override hintIsCurrent(_isCurrent: boolean, _isBegin: boolean): void {}

  override ensureInitialized() {
    if (this.items.lifecycle === CstIntermediateItems.Lifecycle.Created) {
      this.initializeGroup();
    }
  }

  protected initializeGroup() {
    if (this.items.lifecycle !== CstIntermediateItems.Lifecycle.Created) {
      throw new Error(`unexpected lifecycle ${this.items.lifecycle.name}`);
    }
    this.behavior.onBeginGroup(this.isRestorableGroup);
    this.items.lifecycle = CstIntermediateItems.Lifecycle.Initialized;
  }

  override beginChild<ChildInfo extends CstNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: ChildInfo,
  ): CstIntermediateGroupBase<InstanceType<ChildInfo>, ChildInfo> {
    this.ensureInitialized();
    const child = this.items.beginChild(self, info);
    this.onBeginChild(child);
    return child;
  }

  override beginSpecialChild<ChildInfo extends CstSpecialNodeInfo<any>>(
    self: CstIntermediateGroupBase<any>,
    info: ChildInfo,
  ): CstIntermediateGroupBase<InstanceType<ChildInfo>, ChildInfo> {
    this.ensureInitialized();
    const child = this.items.beginSpecialChild(self, info);
    this.onBeginChild(child);
    return child;
  }

  protected onBeginChild(child: CstIntermediateGroupBase<any>) {
    if (this.debug instanceof CstIntermediateDebugImpl) {
      const name = fmt.lazy(() => child.debug?.debugNameEntry ?? fmt`${child.info}`);
      const error = fmt.lazy(() => {
        const error = child.state.error?.value;
        if (error) {
          if (error instanceof Error) {
            const truncate = 36;
            return fmt.red(fmt.dim`Error: ${
              fmt.italic(
                error.message.length > 20
                  ? error.message.slice(0, truncate - 3) + "..."
                  : error.message,
              )
            }`);
          } else {
            return fmt.dim(fmt.red`${error}`);
          }
        } else {
          if (error === undefined) return fmt``;
          else return fmt.dim`${error}`;
        }
      });
      this.debug.log`${fmt.cyan`Node`} ${name} ➜  ${error}`;
    }
  }

  override endChild<Node extends CstNode>(
    child: CstIntermediateGroupBase<Node>,
    result: CstGroup<Node> | CstErrorResult,
  ): void {
    const debug = child.debug;
    if (debug) {
      let v;
      if (result instanceof CstErrorResult) {
        if (result.from !== child) {
          v = fmt.dim(fmt.red`(same)`);
        } else {
          v = result.value;
          if (v instanceof Error) {
            v = fmt.rgb8(210)`${fmt.bold(fmt.red`error`)}: ${fmt.raw(v.message)}`;
          }
        }
      } else {
        if (result.shadowedGroups) {
          v = fmt.dim`(same)`;
        } else {
          v = result.node;
        }
      }
      debug.log`${fmt.dim`end ➜ `} ${v}`;
      debug.end(this.debug);
    }

    if (this.offset !== child.meta.startOffset) {
      throw new Error("this.offset != child.startOffset");
    }
    if (result instanceof CstGroup) {
      this.offset = child.offset;
    }
  }

  override reportToken(token: Token): void {
    if (this.offset !== token.span.start) {
      throw new Error("this.offset != token.startOffset");
    }
    this.offset = token.span.end;
  }

  override skipCurrent(): Node | null {
    return null;
  }

  protected createGroup(node: Node): CstGroup<Node, Info> {
    const span = new Span(this.meta.startOffset, this.offset);
    return new CstGroup(
      this.meta.toGroupMetadata(span),
      node,
      this.meta.source ?? null,
      this.items.get(),
    );
  }

  protected endSelf(
    self: CstIntermediateGroupBase<Node, Info>,
    result: CstGroup<Node> | CstErrorResult,
  ) {
    this.reportToParent(self, result);
  }

  protected reportToParent(
    self: CstIntermediateGroupBase<Node, Info>,
    result: CstGroup<Node> | CstErrorResult,
  ) {
    this.parentState.items.endChild(self, result);
  }

  override beforeEnd(node: Node): CstGroup<Node, Info> {
    this.ensureInitialized();

    // node is not fully instantiated
    if (this.group || this.error) {
      const a = this.group?.info;
      if (!a) {
        throw detailedError`
          Creating multiple CstNode inside one node() call is not allowed.
          For example, ${fmt
          .code`new CstSimpleCall(new CstReference('hi'), [], [])`} is not allowed.
          To do this, use separate node() call, like ${
          fmt.code(`new CstSimpleCall(node(() => new CstReference('hi')), [], [])`)
        }.
        `;
      }
      const b = node.constructor;
      throw detailedError`
        Creating multiple CstNode inside one node() call is not allowed; tried to create \\
        ${b} while ${a} exists.
        For example, ${fmt.code`new ${b}(new ${a}('hi'), [], [])`} is not allowed.
        To do this, use separate node() call, like ${
        fmt.code(`new ${b}(node(() => new ${a}('hi')), [], [])`)
      }.
      `;
    }

    const group = this.createGroup(node);
    this.group = group;
    return group;
  }

  override end(
    self: CstIntermediateGroupBase<Node, Info>,
    node: Node,
  ): Node {
    this.ensureInitialized();

    let group = this.group;
    if (group) {
      if (group.node !== node) {
        throw detailedError`
          you should return CstNode that is newly created inside parser.
          - ${fmt.brightYellow`previously created`}: ${group.node}
          - ${fmt.brightYellow`given`}: ${node}
          - ${fmt.brightYellow`given.tree`}: ${node.tree}
        `;
      }
    } else {
      group = this.createGroup(node);
      this.group = group;

      // In this case, this parser returned node from child parser as-is.
      // We need special handling for this case.
      const childGroup = node.tree;
      const items = group.items;
      if (items.length > 1) {
        throw detailedError`
          to return node as-is from parser, you should call maximum of only one parser.
          - ${fmt.brightYellow`tree.items`}: ${items}
        `;
      }
      if (items.at(0) !== childGroup as any) {
        throw detailedError`
          to return node as-is from parser, you should call maximum of only one parser.
          - ${fmt.brightYellow`tree.items`}: ${items}
        `;
      }

      node.tree = group;
      if (group instanceof CstGroup) {
        group.shadowedGroups = [
          childGroup,
          ...childGroup.shadowedGroups ?? [],
        ];
      }
    }

    this.reportGroupEnd();
    this.endSelf(self, group);

    return node;
  }

  protected reportGroupEnd() {
    this.behavior.onEndGroup();
  }

  override endWithError(
    self: CstIntermediateGroupBase<Node, Info>,
    error: unknown | null,
  ): Node | null {
    this.ensureInitialized();

    // deno-lint-ignore prefer-const
    let result = null;

    const lastError = this.items.lastError;
    let e;
    if (lastError && lastError.value === error) {
      e = lastError;
    } else {
      e = new CstErrorResult(error, self);
    }
    this.error = e;

    this.discardIfPossible(e);

    this.endSelf(self, e);
    return result;
  }

  protected discardIfPossible(error: CstErrorResult) {
    const flags = this.flags;
    if (flags?.errorBehavior) {
      if (flags.errorBehavior === "nullable" && error !== null) {
        throw detailedError`Expected ${fmt.code`error == null`}, but got ${error}`;
      }
      this.behavior.onDiscardGroup();
    } else {
      this.behavior.onEndGroupForError();

      let parent = this.parentState;
      while (!parent.flags?.isErrorAcceptor) {
        const ancestor = parent.parentState;
        if (parent === ancestor) {
          // this error will go up to root
          // TODO: oh no!
          break;
        }
        parent = ancestor;
      }
    }
  }

  discardSelf() {
    this.behavior.onDiscardGroup();
    this.offset = this.meta.startOffset;
  }
}
