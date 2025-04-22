import { detailedError } from "../common/error.ts";
import { Span } from "../token/Span.ts";
import type { SpanGroup, Spanned } from "../token/Spanned.ts";
import { GetSpanSymbol, SpanGroupSymbol } from "../token/Spanned.ts";
import { fmt, format, FormatEntries, type FormatEntry, formatFor } from "../utils/format.ts";
import type { CstMutableLists } from "../cst/CstList.ts";
import { dumpNodeLike } from "../utils/debug.ts";
import type { CstImplicitNode } from "./CstSpecialNode.ts";
import { currentGroup } from "./intermediate/currentGroup.ts";

// Note: see https://github.com/tc39/proposal-rm-builtin-subclassing
// If [@@species], or `Array[Symbol.species]` is removed, methods like Array.map
// will likely return Array instance, instead of CstArray. Based on these
// expectations, we set [@@species] to Array.

// Note 2: This do not implement CstMutableList by `implements`, but it should be compatible.
// Whether they are compatible should be checked manually.

export interface CstMutableListInternal<T extends Spanned> extends CstMutableList<T> {
  readonly implicitList: (CstImplicitNode | null)[];

  pushInternal(item: T): void;
}

class CstMutableListImpl<T extends Spanned> extends Array<T> implements SpanGroup {
  // deno-lint-ignore constructor-super
  constructor(items: T[], readonly implicitList: (CstImplicitNode | null)[]) {
    if (items) {
      super(...items);
    } else {
      super();
    }

    this.checkValid();
  }

  checkValid() {
    Span.checkContinuous(this);
  }

  protected withItems<U extends Spanned>(items: U[]): CstMutableListImpl<U> {
    const array = new CstMutableListImpl(items, this.implicitList);
    return array;
  }

  toArray() {
    return [...this];
  }

  get [GetSpanSymbol](): Span {
    if (this.length > 0) {
      return new Span(this[0][GetSpanSymbol].start, this.at(-1)![GetSpanSymbol].end);
    } else {
      return Span.Empty;
    }
  }

  get [SpanGroupSymbol](): Spanned[] {
    const result = [];
    for (let index = 0; index < this.length; index++) {
      result.push(this[index]);
      if (index !== 0) {
        const implicit = this.implicitList[index - 1];
        if (implicit) result.push(implicit.node);
      }
    }
    return result;
  }

  private notSupportedAction(): never {
    throw new Error(
      "Array functions that make elements of CstList not continuous are not supported",
    );
  }

  /// Mutable actions

  override push(...items: T[]): number {
    for (const item of items) {
      currentGroup().intrinsics.intrinsicListPushItem(
        this as unknown as CstMutableListInternal<T>,
        item,
      );
    }
    return this.length;
  }

  pushInternal(item: T) {
    super.push(item);
  }

  override fill(_value: T, _start?: number, _end?: number): never {
    this.notSupportedAction();
  }

  override copyWithin(_target: number, _start: number, _end?: number): never {
    this.notSupportedAction();
  }

  override pop(): never {
    this.notSupportedAction();
  }

  override reverse(): never {
    this.notSupportedAction();
  }
  override shift(): never {
    this.notSupportedAction();
  }

  override splice(start: number, deleteCount?: number): never;
  override splice(start: number, deleteCount: number, ...items: T[]): never;
  override splice(_start: number, _deleteCount: number, ..._items: T[]) {
    this.notSupportedAction();
  }
  override unshift(..._items: T[]): never {
    this.notSupportedAction();
  }

  /// Immutable actions

  // To remove exotic behavior of some methods; ensure exotic behavior of some
  // methods, both on type and runtime side.

  // Remove exotic behavior by default
  static override get [Symbol.species]() {
    return Array;
  }

  // Add exotic behaviors
  override concat(...items: ConcatArray<T>[]): never;
  override concat(...items: (T | ConcatArray<T>)[]): never;

  override concat(..._items: (T | ConcatArray<T>)[]): never {
    this.notSupportedAction();
  }

  override flat<A, D extends number = 1>(
    this: A,
    depth?: D | undefined,
  ): A extends Spanned ? CstMutableListImpl<FlatArray<A, D>> : never {
    return (this as CstMutableListImpl<any>).withItems(super.flat(depth) as any) as any;
  }

  override slice(start: number = 0, end: number = this.length): CstMutableListImpl<T> {
    if (start < 0) start += this.length;
    if (end < 0) end += this.length;

    const items = super.slice(start, end);
    const implicitList = this.implicitList.slice(start, Math.max(end - 1, 0));
    return new CstMutableListImpl(items, implicitList);
  }

  override toReversed(): never {
    this.notSupportedAction();
  }

  override toSorted(_compareFn?: ((a: T, b: T) => number) | undefined): never {
    this.notSupportedAction();
  }

  override toSpliced(start: number, deleteCount: number, ...items: T[]): never;

  override toSpliced(start: number, deleteCount?: number): never;

  override toSpliced(_start: number, _deleteCount?: number, ..._items: T[]): never {
    this.notSupportedAction();
  }

  override with(index: number, value: T): CstMutableListImpl<T> {
    const previousSpan = this[index][GetSpanSymbol];
    const span = value[GetSpanSymbol];
    if (!previousSpan.equals(span)) {
      throw detailedError`
        Span not consistent: expected ${previousSpan}, got ${span}. ${fmt.code("CstList")} \\
        enforces consistent span to make it CstNode-like.
        - ${fmt.brightYellow("index")}: ${index}
        - ${fmt.brightYellow("previous value")}: ${this[index]}
        - ${fmt.brightYellow("value")}: ${value}
      `;
    }
    return this.withItems(super.with(index, value));
  }

  mapCst<U extends Spanned>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any,
  ): CstMutableListImpl<U> {
    // should we check if span is continuous?
    return this.withItems(super.map(callbackfn, thisArg));
  }

  flatMapCst<U extends Spanned, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | readonly U[],
    thisArg?: This | undefined,
  ): CstMutableListImpl<U> {
    return this.withItems(super.flatMap(callback, thisArg));
  }

  @format.representation
  dump(): FormatEntry {
    return dumpNodeLike(() => {
      const entry = new FormatEntries.object(this);
      formatFor(this, () => {
        for (let index = 0; index < this.length; index++) {
          if (index !== 0) {
            const implicit = this.implicitList[index - 1];
            if (implicit) {
              entry.push(
                fmt.dim`${implicit.node}${new FormatEntries.trailing(fmt`,`)}`,
                [true, true],
              );
            }
          }
          entry.push(fmt`${this[index]}${new FormatEntries.trailing(fmt.dim`,`)}`, [true, true]);
        }
      });
      const group = new FormatEntries.group(
        [FormatEntries.common["["], false],
        entry,
        [FormatEntries.common["]"], false],
        true,
      );
      return group;
    });
  }

  override toString(): string {
    return this.dump().s;
  }
}

export type LimitedCstMutableList<T extends Spanned> = CstMutableLists.LimitedCstMutableList<T>;
export type CstMutableList<T extends Spanned> = CstMutableLists.CstMutableList<T>;

export function CstMutableList<T extends Spanned>(): CstMutableList<T> {
  return currentGroup().intrinsics.intrinsicListCreated(
    new CstMutableListImpl([], []) as unknown as CstMutableListInternal<T>,
  );
}
