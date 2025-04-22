import type { SpanGroup, Spanned } from "./Spanned.ts";

// deno-fmt-ignore
export interface LimitedReadonlySpanArray<T extends Spanned> extends ReadonlyArray<T>, SpanGroup {
  toArray(): readonly T[];
  
  toReversed(): never;

  toSorted(compareFn?: ((a: T, b: T) => number) | undefined): never;

  toSpliced(start: number, deleteCount: number, ...items: T[]): never;
  toSpliced(start: number, deleteCount?: number): never;
}

// deno-fmt-ignore
export interface ReadonlySpanArrayType<
  T extends Spanned,
  MutableSelf extends T[],
> extends LimitedReadonlySpanArray<T>, SpanGroup {
  find<S extends T>(predicate: (value: T, index: number, obj: LimitedReadonlySpanArray<T>) => value is S, thisArg?: any): S | undefined;
  find(predicate: (value: T, index: number, obj: LimitedReadonlySpanArray<T>) => unknown, thisArg?: any): T | undefined;

  findIndex(predicate: (value: T, index: number, obj: LimitedReadonlySpanArray<T>) => unknown, thisArg?: any): number;

  // More type friendly declarations
  findLast<S extends T>(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => value is S, thisArg?: any): S | undefined;
  findLast(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => unknown, thisArg?: any): T | undefined;

  findLastIndex(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => unknown, thisArg?: any): number;

  // Add exotic behaviors

  concat(...items: ConcatArray<T>[]): MutableSelf;
  concat(...items: (T | ConcatArray<T>)[]): MutableSelf;

  some(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => unknown, thisArg?: any): boolean;

  forEach(callbackfn: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => void, thisArg?: any): void;
  
  map<U>(callbackfn: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => U, thisArg?: any): U[];

  filter<S extends T>(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => value is S, thisArg?: any): S[];
  filter(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => unknown, thisArg?: any): T[];

  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedReadonlySpanArray<T>) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedReadonlySpanArray<T>) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: LimitedReadonlySpanArray<T>) => U, initialValue: U): U;

  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedReadonlySpanArray<T>) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedReadonlySpanArray<T>) => T, initialValue: T): T;
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: LimitedReadonlySpanArray<T>) => U, initialValue: U): U;

  slice(start?: number, end?: number): MutableSelf;

  toReversed(): never;

  toSorted(compareFn?: ((a: T, b: T) => number) | undefined): never;

  toSpliced(start: number, deleteCount: number, ...items: T[]): never;
  toSpliced(start: number, deleteCount?: number): never;

  with(index: number, value: T): MutableSelf;
}

// deno-fmt-ignore
export interface ReadonlySpanArray<T extends Spanned>
  extends ReadonlySpanArrayType<T, SpanArray<T>> {
  /// Things to implement manually due to generic type limitation / recursive type

  flat<A, D extends number = 1>(this: A, depth?: D | undefined): A extends Spanned ? SpanArray<FlatArray<A, D>> : never;
  
  flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>, thisArg?: This): SpanArray<U>;
  flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>, thisArg?: This): SpanArray<U>;

  every<S extends T>(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => value is S, thisArg?: any): this is ReadonlySpanArray<S>;
  every(predicate: (value: T, index: number, array: LimitedReadonlySpanArray<T>) => unknown, thisArg?: any): boolean;
}

export interface LimitedSpanArray<T extends Spanned> extends Array<T>, SpanGroup {
  toArray(): T[];

  fill(value: T, start?: number, end?: number): never;

  copyWithin(target: number, start: number, end?: number): never;

  pop(): never;

  reverse(): never;
  shift(): never;

  splice(start: number, deleteCount?: number): never;
  splice(start: number, deleteCount: number, ...items: T[]): never;
  unshift(...items: T[]): never;

  toReversed(): never;

  toSorted(compareFn?: undefined): this;
  toSorted(compareFn?: ((a: T, b: T) => number) | undefined): never;

  toSpliced(start: number, deleteCount: number, ...items: T[]): never;
  toSpliced(start: number, deleteCount?: number): never;
}

// deno-fmt-ignore
export interface SpanArrayType<T extends Spanned> extends LimitedSpanArray<T>, SpanGroup {
  push(...items: T[]): number;
  
  fill(value: T, start?: number, end?: number): never;

  copyWithin(target: number, start: number, end?: number): never;

  pop(): never;

  reverse(): never;
  shift(): never;

  splice(start: number, deleteCount?: number): never;
  splice(start: number, deleteCount: number, ...items: T[]): never;
  unshift(...items: T[]): never;
  
  find<S extends T>(predicate: (value: T, index: number, obj: LimitedSpanArray<T>) => value is S, thisArg?: any): S | undefined;
  find(predicate: (value: T, index: number, obj: LimitedSpanArray<T>) => unknown, thisArg?: any): T | undefined;

  findIndex(predicate: (value: T, index: number, obj: LimitedSpanArray<T>) => unknown, thisArg?: any): number;

  // More type friendly declarations
  findLast<S extends T>(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => value is S, thisArg?: any): S | undefined;
  findLast(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => unknown, thisArg?: any): T | undefined;

  findLastIndex(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => unknown, thisArg?: any): number;

  // Add exotic behaviors

  concat(...items: ConcatArray<T>[]): this;
  concat(...items: (T | ConcatArray<T>)[]): this;

  some(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => unknown, thisArg?: any): boolean;

  forEach(callbackfn: (value: T, index: number, array: LimitedSpanArray<T>) => void, thisArg?: any): void;
  
  map<U>(callbackfn: (value: T, index: number, array: LimitedSpanArray<T>) => U, thisArg?: any): U[];

  filter<S extends T>(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => value is S, thisArg?: any): S[];
  filter(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => unknown, thisArg?: any): T[];

  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedSpanArray<T>) => T): T;
  reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedSpanArray<T>) => T, initialValue: T): T;
  reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: LimitedSpanArray<T>) => U, initialValue: U): U;

  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedSpanArray<T>) => T): T;
  reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: LimitedSpanArray<T>) => T, initialValue: T): T;
  reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: LimitedSpanArray<T>) => U, initialValue: U): U;

  slice(start?: number, end?: number): this;

  toReversed(): never;

  toSorted(compareFn?: undefined): this;
  toSorted(compareFn?: ((a: T, b: T) => number) | undefined): never;

  toSpliced(start: number, deleteCount: number, ...items: T[]): never;
  toSpliced(start: number, deleteCount?: number): never;

  with(index: number, value: T): this;
}

// deno-fmt-ignore
export interface SpanArray<T extends Spanned> extends SpanArrayType<T> {
  /// Things to implement manually due to generic type limitation / recursive type
  flat<A, D extends number = 1>(this: A, depth?: D | undefined): A extends Spanned ? SpanArray<FlatArray<A, D>> : never;
  
  flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: LimitedSpanArray<T>) => U | ReadonlyArray<U>, thisArg?: This): SpanArray<U>;
  flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: LimitedSpanArray<T>) => U | ReadonlyArray<U>, thisArg?: This): SpanArray<U>;

  every<S extends T>(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => value is S, thisArg?: any): this is SpanArray<S>;
  every(predicate: (value: T, index: number, array: LimitedSpanArray<T>) => unknown, thisArg?: any): boolean;
}

type Check<C extends P, P> = C;
type CheckSpanGroupTSelf = Check<
  SpanArrayType<import("./Token.ts").Token>,
  ReadonlySpanArrayType<import("./Token.ts").Token, SpanArrayType<import("./Token.ts").Token>>
>;
type CheckSpanGroupSelf = Check<
  SpanArray<import("./Token.ts").Token>,
  ReadonlySpanArray<import("./Token.ts").Token>
>;
