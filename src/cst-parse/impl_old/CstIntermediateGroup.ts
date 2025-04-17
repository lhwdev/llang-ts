import { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import { CstImplicitNode, CstPeekNode, CstSpecialNode } from "../CstSpecialNode.ts";
import { Span } from "../../token/Span.ts";
import { GetSpanSymbol, type Spanned } from "../../token/Spanned.ts";
import type { Token } from "../../token/Token.ts";
import { isInherited } from "../../utils/extends.ts";
import { fmt, formatClass, FormatEntries, type FormatEntry } from "../../utils/format.ts";
import type { CstCodeContext } from "../CstCodeContext.ts";
import type { CstNodeHintType, CstParseContext } from "../CstParseContext.ts";
import { getContext, NodeHint, NodeHints, withContext } from "../CstParseContext.ts";
import { debug, DebugFlags } from "./debug.ts";
import type { CstCodeScope, CstCodeScopes } from "../tokenizer/CstCodeScope.ts";
import { type CstCodeContextImpl, subscribeToken } from "./CstCodeContextImpl.ts";
import { CstGroup, type CstGroupItem } from "./CstGroup.ts";
import type { CstParseContextImpl } from "./CstParseContextImpl.ts";
import { detailedParseError } from "./errors.ts";
import {
  CstChildParseContext,
  type CstContextParent,
  CstContextParentSymbol,
  CstGroupParseContext,
  type CstParseContextParent,
} from "./CstGroupParseContext.ts";
import type { CstParseIntrinsicKey, CstParseIntrinsics } from "../CstParseIntrinsics.ts";
import { getCallStackFrames, StackFrame } from "../../utils/errorStackParser.ts";
import { stripAnsiCode } from "../../utils/ansi.ts";
import type { CstMutableList, CstMutableListInternal } from "../CstMutableList.ts";
import { CstTree } from "../../cst/CstTree.ts";

export const EmptySlot = Symbol("EmptySlot");
const DebugInternalPath = (() => {
  const path = getCallStackFrames()[0].fileName!.split("/");
  return path.slice(0, -2).join("/") + "/";
})();

export namespace InternalContextKeys {
  export const InsideTest = new ContextKey<boolean>("Internal.InsideTest");
}

export class InsideTestError extends Error {
  constructor(readonly reason?: Spanned) {
    super();
    this.stack = undefined;
  }

  override toString() {
    return fmt.brightWhite("vital() inside intrinsics.testNode").s;
  }
}

export abstract class CstIntermediateGroup implements CstParseIntrinsics {
  readonly spanStart: number;
  spanEnd: number;
  declare snapshot?: unknown; // tokenizer(offset = spanStart)

  declare flagNullable?: true;
  declare flagDiscardable?: true;

  readonly items: CstGroupItem[] = [];
  declare allowImplicit?: boolean;
  declare isImplicit?: boolean;

  declare contextValues?: ContextValue<any>[];
  contextualNode: CstIntermediateGroup; // note: in some cases, contextualNode === this

  group?: CstGroup;
  declare error?: unknown | null;

  declare debugInitialized?: boolean;
  declare debugHideLog?: boolean;
  declare debugName?: string;
  declare debugNodeName?: string;
  declare debugParserLocation?: StackFrame;

  constructor(
    readonly parent: CstIntermediateGroup,
    readonly info: CstNodeInfo<any>,
  ) {
    this.spanStart = parent.spanEnd;
    this.spanEnd = this.spanStart;

    this.contextualNode = parent.contextualNode;

    if (parent.isImplicit) this.isImplicit = true;

    if ("Deno" in globalThis && DebugFlags.traceParser) {
      const frames = getCallStackFrames();
      const location = frames.find((frame) => {
        return frame.fileName?.startsWith(DebugInternalPath) === false;
      });
      this.debugParserLocation = location;
    }
  }

  parentForPop() {
    return this.parent;
  }

  get contextualParent(): CstIntermediateGroup {
    return this.contextualNode.parent;
  }

  protected get c(): CstCodeContextImpl {
    return (getContext() as CstParseContextImpl<any>).c;
  }

  withSelf<R>(fn: (self: this) => R): R {
    const context = getContext();
    const newFn = fn.length === 0 ? fn as () => R : () => fn(this);
    if (context instanceof CstGroupParseContext) {
      return context.withCurrent(this, newFn);
    }

    if (!(CstContextParentSymbol in context)) {
      throw new Error("parent context is not CstContextParent");
    }
    return withContext(
      CstChildParseContext.create(context as unknown as CstContextParent, this),
      newFn,
    );
  }

  /// Debug

  // max laziness
  get debugDepth(): number {
    return this.parent === this ? 0 : this.parent.debugDepth + 1;
  }

  get debugLocation(): string[] {
    if (this.parent === this) return ["root"];
    const list = this.parent.debugLocation;
    list.push(this.info.name);
    return list;
  }

  get debugLocationString(): string {
    return fmt.join(this.debugLocation.map((l) => fmt.brightWhite(l)), fmt.gray(" > ")).toString();
  }

  declare private debugLines?: [depth: number, line: FormatEntry, isDim?: boolean][];

  debugLog(line: FormatEntry) {
    if (!this.debugLines) this.debugLines = [];
    this.debugLines.push([this.debugDepth, line]);
  }

  /// Internal-most tree management functions

  protected addItem(item: CstGroupItem) {
    this.updateSpan(item);
    this.items.push(item);
  }

  protected updateSpan(item: Spanned) {
    const span = item[GetSpanSymbol];
    if (span.start !== this.spanEnd) {
      throw new Error(
        "span not continuous: " +
          fmt`inserting ${item} into group(span=${new Span(this.spanStart, this.spanEnd)})`.s,
      );
    }
    this.spanEnd = span.end;
    this.ensureInitialized();
  }

  protected resolveContextOnSelf<T>(key: ContextKey<T>): ContextValue<T> | null {
    if (this.contextValues) {
      for (const provided of this.contextValues) {
        if (provided.key === key) return provided;
      }
    }
    return null;
  }

  resolveContextOrNull<T>(key: ContextKey<T>): ContextValue<T> | null {
    if (this.contextValues) {
      return this.resolveContextOnSelf(key) ??
        this.parent.contextualNode.resolveContextOrNull(key);
    } else {
      return this.contextualNode.resolveContextOrNull(key);
    }
  }

  resolveContext<T>(key: ContextKey<T>): ContextValue<T> {
    const result = this.resolveContextOrNull(key);
    if (!result) {
      throw new Error(fmt`Cannot resolve context value for ${key}`.s);
    }
    return result;
  }

  provideContext(value: ContextValue<any>): void {
    if (this.debugInitialized) {
      throw new Error("context should be provided before calling code() or cstNode()");
    }

    if (this.contextValues == null) {
      this.contextualNode = this;
      this.contextValues = [];
    }

    // Not ideal performance for large contextValues array;
    // but sufficient for now
    this.contextValues.unshift(value);

    if (value.key === ContextKeys.IsImplicit) {
      this.isImplicit = value.value;
    }
  }

  /// Metadata & Slot

  hintType(hint: CstNodeHintType) {
    switch (hint) {
      case "nullable":
        this.markNullable();
        break;

      case "discardable":
        this.markDiscardable();
        break;

      default: {
        if (hint instanceof NodeHint) {
          if (hint instanceof NodeHints.DebugName) {
            this.debugName = `${hint.value}`;
            return;
          }
          if (hint instanceof NodeHints.DebugNodeName) {
            this.debugNodeName = `${hint.value}`;
            return;
          }
          if (hint instanceof NodeHints.DebugImportance) {
            switch (hint.value) {
              case "hide":
                this.debugHideLog = true;
            }
            return;
          }
        }
        throw new Error(
          fmt`unknown hint type ${hint} for ${fmt.raw(this.debugLocationString)}`.s,
        );
      }
    }
  }

  markNullable() {
    this.flagNullable = true;
    this.ensureSnapshotExists();
  }

  markDiscardable() {
    this.flagDiscardable = true;
    this.ensureSnapshotExists();
  }

  markVital(reason?: Spanned) {
    if (this.resolveContextOrNull(InternalContextKeys.InsideTest)?.value) {
      throw new InsideTestError(reason);
    }
  }

  getSlot(): unknown {
    return EmptySlot;
  }

  updateSlot<T>(value: T): T {
    return value;
  }

  /// Intrinsics

  intrinsicListCreated<T extends Spanned>(list: CstMutableListInternal<T>): CstMutableList<T> {
    return list;
  }

  intrinsicListPushItem<T extends Spanned>(list: CstMutableListInternal<T>, item: T): void {
    const tree = this.items.at(-1);
    if (!tree || tree.span !== item[GetSpanSymbol]) {
      throw detailedParseError`
        Expected last child item of this(${this.info}) to have identical span as given item.
        - ${fmt.brightYellow("last child item")}: ${this.items.at(-1)}
        - ${fmt.brightYellow("given item")}: ${item}
      `;
    }
    if (list.length > 0) {
      const maybeImplicit = this.items.at(-2);
      if (maybeImplicit instanceof CstTree && maybeImplicit.node instanceof CstImplicitNode) {
        if (list.at(-1)![GetSpanSymbol].end === maybeImplicit.span.start) {
          list.implicitList.push(maybeImplicit.node);
        } else {
          throw detailedParseError`
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
    return !!this.beginChild(CstPeekNode).withSelf((child) => {
      child.debugParserLocation = StackFrame.from({ functionName: "intrinsics.testNode" });
      child.provideContext(InternalContextKeys.InsideTest.provides(true));
      let result;
      try {
        result = node();
      } catch (e) {
        if (e instanceof InsideTestError) {
          return child.end(new CstPeekNode(true));
        } else {
          if (result = child.endWithError(e)) {
            return result as CstPeekNode<ReturnType<typeof node>>;
          }
          throw e;
        }
      }
      return child.end(new CstPeekNode(node()));
    }).value;
  }

  intrinsic<T>(key: CstParseIntrinsicKey<T>): T {
    throw new Error(`unexpected intrinsic ${key}`);
  }

  /// Code parsing

  get codeScopes(): CstCodeScopes {
    return this.resolveContext(ContextKeys.CodeScopes).value;
  }

  code<R>(scope: CstCodeScope, fn: (code: CstCodeContext) => R): R {
    const code = this.c;
    let token: Token | null = null;
    const reportToken = (nextToken: Token) => {
      if (token) {
        throw new Error(
          "parse maximum of one token inside one code() invocation. " +
            "To parse multiple token, call code() multiple times.",
        );
      }
      token = nextToken;
    };

    code.scope = scope;
    try {
      const result = subscribeToken(reportToken, () => fn(code));
      if (token) {
        this.addItem(token);
      }
      debug`${fmt.rgb8(136)`code`}(${fmt.symbol(scope.constructor.name)}, ${
        fmt.code(fn)
      }) -> ${token}`;

      return result;
    } finally {
      code.scope = null;
      this.ensureInitialized();
    }
  }

  ensureSnapshotExists() {
    if (!this.snapshot) {
      if (this.debugInitialized) {
        throw new Error("snapshot should be taken before calling code() or cstNode()");
      }
      this.snapshot = this.c.snapshot();
    }
  }

  restoreToPrevious() {
    if (!this.snapshot) {
      throw new Error("snapshot does not exist for group");
    }
    this.c.restore(this.snapshot);
  }

  /// Self management

  skipping<Node extends CstNode>(): Node | null {
    return null;
  }

  /**
   * Not guaranteed to be called for all new groups.
   */
  // deno-lint-ignore no-unused-vars
  createUniqueContext(parent: CstParseContextParent): CstParseContext | null {
    return null;
  }

  /// Children management

  private debugNodeDebugLine(
    info: CstNodeInfo<any>,
    child: () => CstIntermediateGroup | null,
  ): FormatEntry {
    return fmt.lazy((context) => {
      const c = child();
      const kind = c?.isImplicit ? "Implicit Node" : "Node";
      let kindEntry = context?.error !== undefined
        ? fmt.bgBlack(fmt.cyan(fmt.strikethrough(kind)))
        : fmt.cyan(kind);
      if (context.dim) kindEntry = fmt.italic(kindEntry);

      if (c?.isImplicit) {
        return fmt`${kindEntry} ➜  ${(c.group?.node as CstImplicitNode)?.node}`;
      }

      let name: FormatEntry | null = null;
      let type: FormatEntry | null;
      let frame: StackFrame | null = null;
      // let link;
      let isAccessor = false;

      if (!c) {
        // fallback; never happens I guess
        type = fmt.rgb8(info.name, 146);
      } else {
        frame = c.debugParserLocation ?? null;
        // find function name
        if (c.debugName) {
          name = fmt.raw(c.debugName);
        } else if (frame) {
          let parser = frame.functionName;
          if (parser) {
            parser = stripAnsiCode(parser);
            const afterDot = parser.lastIndexOf(".") + 1;
            const propertyName = parser.slice(afterDot);
            if (propertyName.startsWith("get ") || propertyName.startsWith("set ")) {
              isAccessor = true;
              parser = parser.slice(0, afterDot) + propertyName.slice(4);
            }
            name = fmt.raw(parser);
            if (afterDot == 0 && frame.typeName) {
              name = fmt`${fmt.gray`${fmt.raw(frame.typeName)}.`}${name}`;
            }
          }
        }

        const typeName = `${info.name}`;
        type = fmt.rgb8(typeName, 146);
        if (c.debugNodeName) {
          const debug = c.debugNodeName;
          if (info === CstNode) {
            type = fmt.rgb8(fmt.italic(debug), 146);
          } else if (debug.startsWith(typeName)) {
            type = fmt`${type}${fmt.italic(debug.slice(typeName.length))}`;
          } else {
            type = fmt`${type} ${fmt.italic(debug)}`;
          }
        }
      }

      if (isInherited(info, CstSpecialNode)) {
        if (name) {
          name = fmt.italic(name);
        } else {
          type = fmt.italic(type);
        }
      }

      // file: protocol is not yet supported by vscode
      // if (link && name) {
      //   name = fmt.link(name, link);
      // }

      let summary;
      if (name) {
        if (isAccessor) {
          summary = fmt`${name}${fmt.gray(":")} ${type}`;
        } else {
          // note that frame.function will always null, as strict mode is on.
          const args = frame?.function?.length ? "..." : "";
          summary = fmt`${name}${fmt.gray(`(${fmt.raw(args)}):`)} ${type}`;
        }
      } else {
        summary = type;
      }

      const result = c?.error !== undefined
        ? c.error === null ? fmt.dim`null` : fmt`${fmt.red(`${c.error}`)}`
        : fmt``;

      let line = fmt`${kindEntry} ${summary} ➜  ${result}`;
      if (this.debugHideLog && !c?.error) {
        line = FormatEntries.list.from([line, fmt`aaa ➜  `], true);
      }
      return line;
    });
  }

  beginChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    // beginChild -> to consider: special nodes, implicit, debug
    // end -> to consider: special nodes, update implicit state, update span,
    // (parent.add is handled by CstParseContext)
    this.ensureInitialized();

    let child: CstIntermediateGroup | null;
    const debugBegin = this.debugNodeDebugLine(info, () => child);

    if (child = this.beginSpecialNode(info)) {
      debug.raw(debugBegin);
      return child;
    }

    this.handleImplicit();
    debug.raw(debugBegin);

    child = this.createSpecialChild(info);
    if (!child) {
      if (info instanceof CstSpecialNode) {
        throw new Error(`unknown special node ${info.name}`);
      }
      child = this.createChild(info);
    }
    // this.intermediateChildren.push(child);
    return child;
  }

  beginImplicitChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    this.ensureInitialized();

    const child = this.createImplicitChild(info);
    debug.raw(this.debugNodeDebugLine(info, () => child));
    return child;
  }

  beginSpecialNode(info: CstNodeInfo<any>): CstIntermediateGroup | null {
    throw new Error(
      `implemented by index.ts to avoid circular imports, args=${info}`,
    );
  }

  createSpecialChild(info: CstNodeInfo<any>): CstIntermediateGroup | null {
    throw new Error(
      `implemented by index.ts to avoid circular imports, args=${info}`,
    );
  }

  createImplicitChild(info: CstNodeInfo<any>): CstIntermediateGroup {
    throw new Error(
      `implemented by index.ts to avoid circular imports, args=${info}`,
    );
  }

  protected handleImplicit(): void {
    if (this.isImplicit) return;
    if (this.allowImplicit) {
      this.allowImplicit = false;

      const cstImplicit = this.resolveContextOrNull(ContextKeys.ImplicitNode)?.value;
      if (!cstImplicit) return;

      const implicit = this.beginImplicitChild(CstImplicitNode);
      try {
        implicit.withSelf(() => {
          const node = cstImplicit();
          if (node) {
            implicit.end(new CstImplicitNode(node));
          } else {
            implicit.endWithError(null);
          }
        });
      } catch (e) {
        implicit.endWithError(e);
      }
    }
  }

  protected abstract createChild(info: CstNodeInfo<any>): CstIntermediateGroup;

  protected childInstance<Ctor extends new (...args: any) => CstIntermediateGroup>(
    type: Ctor,
  ): Ctor {
    return this.contextualParent.childInstance(type);
  }

  beforeEnd<Node extends CstNode>(node: Node): CstGroup<Node> {
    if (this.group) {
      throw detailedParseError`
        Creating multiple CstNode inside one node() call is not allowed; tried to create \\
        ${node.constructor} while ${this.group.info} exists.
        For example, ${fmt.code`new CstSimpleCall(new CstReference('hi'), [], [])`} is not allowed.
        To do this, use separate node() call, like ${
        fmt.code(`new CstSimpleCall(node(() => new CstReference('hi')), [], [])`)
      }.
      `;
    }

    const group = this.createGroup(node);
    this.group = group;
    return group;
  }

  end<Node extends CstNode>(node: Node): Node {
    let group = this.group as CstGroup<Node> | undefined;
    if (group) {
      if (group.node !== node) {
        throw detailedParseError`
          you should return CstNode that is newly created inside parser.
          - ${fmt.brightYellow`previously created`}: ${group.node}
          - ${fmt.brightYellow`given`}: ${node}
        `;
      }
    } else {
      // Shadowing node: such as `node(() => node(() => new CstNode))`
      group = this.createGroup(node);
      this.group = group;

      // In this case, this parser returns node from child parser as-is.
      // We need special handling for this case.
      const childGroup = node.tree;
      // if (!(childGroup instanceof CstGroup)) {
      //   throw new Error("cannot shadow node created by unknown parser");
      // }
      const items = group.items;
      if (items.length > 1) {
        throw detailedParseError`
          to return node as-is from parser, you should call maximum of only one parser.
          - ${fmt.brightYellow`tree.items`}: ${items}
        `;
      }
      if (items.at(0) !== childGroup) {
        throw detailedParseError`
          to return node as-is from parser, you should call maximum of only one parser.
          - ${fmt.brightYellow`tree.items`}: ${items}
        `;
      }
      node.tree = group;
      // group.allSpans = childGroup.allSpans;
      if (group instanceof CstGroup) {
        group.shadowedGroups = [
          childGroup,
          ...childGroup.shadowedGroups ?? [],
        ];
      }
    }

    debug`${fmt.dim`end ${this.debugName ? fmt.raw(this.debugName) : this.info} ➜ `} ${
      fmt.lazy(() =>
        group.shadowedGroups && group.node === group.children.at(0)?.node
          ? fmt.italic`${fmt.rgb8(group.node.constructor.name, 19)}(${fmt.dim`same`})`
          : fmt`${node}`.s
      )
    }`;

    this.endSelf(group);
    return group.node;
  }

  insertChild<Node extends CstNode>(node: Node): Node {
    throw new Error(
      `implemented by index.ts to avoid circular imports, args=${node}`,
    );
  }

  protected endSelf(group: CstGroup) {
    this.parent.endChild(group, this);
  }

  endWithError(error: unknown | null): CstNode | null {
    this.error = error;
    if (this.snapshot) {
      this.restoreToPrevious();
    } else {
      if (this.flagNullable || this.flagDiscardable) {
        throw new Error("never happens");
      }
      // if (this.flagNullable && this.spanEnd != this.spanStart) {
      //   throw new Error(
      //     "nullableNode should call enableDiscard() to " +
      //       "consume any node then return null.",
      //   );
      // }
    }

    if (error !== null) debug`${fmt.dim("endWithError")} ${fmt.red(`${error}`)}`;

    this.endSelfWithError(error);

    return null;
  }

  protected endSelfWithError(error: unknown | null) {
    this.parent.endChildWithError(error, this);
  }

  endChild(child: CstGroup, from: CstIntermediateGroup) {
    this.endChildCommon(child, from, true);
    this.addItem(child);
    this.allowImplicit = true;
  }

  endChildWithError(error: unknown | null, from: CstIntermediateGroup) {
    this.endChildCommon({ error }, from, true);
  }

  endChildCommon(
    result: CstGroup | { error: unknown | null },
    from: CstIntermediateGroup,
    // deno-lint-ignore no-unused-vars
    added: boolean,
  ) {
    // do nothing

    const lines = from.debugLines;
    if (lines && !from.isImplicit && !from.debugHideLog) {
      if (this.parent === this) {
        lines.forEach(([depth, line, isDim]) => {
          const indent = "  ".repeat(depth);
          if (isDim) line = new FormatEntries.context(["dim", true] as any, line);
          console.log(indent + line.toString().replaceAll("\n", "\n" + indent));
        });
        return;
      }
      if (!(result instanceof CstGroup)) lines.forEach((line) => line[2] = true);
      this.debugLines = (this.debugLines ?? []).concat(lines);
    }
  }

  protected abstract createGroup<Node extends CstNode>(node: Node): CstGroup<Node>;

  /// Other utilities

  protected ensureInitialized() {
    this.debugInitialized = true;
  }

  toString() {
    return formatClass(this);
  }
}
