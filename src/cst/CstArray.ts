import { Span } from "../token/Span.ts";
import type { SpanGroup, Spanned } from "../token/Spanned.ts";
import { GetSpanSymbol, SpanGroupSymbol } from "../token/Spanned.ts";

export interface CstReadonlyArray<T extends Spanned> extends ReadonlyArray<T>, SpanGroup {
  // More type friendly declarations
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  every<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): this is CstReadonlyArray<S>;
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  every(predicate: (value: T, index: number, array: T[]) => unknown, thisArg?: any): boolean;

  // Add exotic behaviors
  /**
   * Combines two or more arrays.
   * This method returns a new array without modifying any existing arrays.
   * @param items Additional arrays and/or items to add to the end of the array.
   */
  concat(...items: ConcatArray<T>[]): CstArray<T>;
  /**
   * Combines two or more arrays.
   * This method returns a new array without modifying any existing arrays.
   * @param items Additional arrays and/or items to add to the end of the array.
   */
  concat(...items: (T | ConcatArray<T>)[]): CstArray<T>;
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
   */
  filter<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): CstArray<S>;
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
   */
  filter(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any,
  ): CstArray<T>;

  flat<A, D extends number = 1>(
    this: A,
    depth?: D | undefined,
  ): A extends Spanned ? CstArray<FlatArray<A, D>> : never;

  slice(start?: number, end?: number): CstArray<T>;

  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @returns An array containing the elements that were deleted.
   */
  splice(start: number, deleteCount?: number): CstArray<T>;
  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @param items Elements to insert into the array in place of the deleted elements.
   * @returns An array containing the elements that were deleted.
   */
  splice(start: number, deleteCount: number, ...items: T[]): CstArray<T>;

  toReversed(): CstArray<T>;

  toSorted(compareFn?: ((a: T, b: T) => number) | undefined): CstArray<T>;
  /**
   * Copies an array and removes elements and, if necessary, inserts new elements in their place. Returns the copied array.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @param items Elements to insert into the copied array in place of the deleted elements.
   * @returns The copied array.
   */
  toSpliced(start: number, deleteCount: number, ...items: T[]): CstArray<T>;

  /**
   * Copies an array and removes elements while returning the remaining elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @returns A copy of the original array with the remaining elements.
   */
  toSpliced(start: number, deleteCount?: number): CstArray<T>;

  with(index: number, value: T): CstArray<T>;

  mapCst<U extends Spanned>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any,
  ): CstArray<U>;

  flatMapCst<U extends Spanned, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | readonly U[],
    thisArg?: This | undefined,
  ): CstArray<U>;
}

// Note: see https://github.com/tc39/proposal-rm-builtin-subclassing
// If [@@species], or `Array[Symbol.species]` is removed, methods like Array.map
// will likely return Array instance, instead of CstArray. Based on these
// expectations, we set [@@species] to Array.

export class CstArray<T extends Spanned> extends Array<T>
  implements CstReadonlyArray<T>, SpanGroup {
  get [GetSpanSymbol]() {
    if (this.length > 0) {
      return new Span(this[0][GetSpanSymbol].start, this.at(-1)![GetSpanSymbol].end);
    } else {
      return Span.Empty;
    }
  }

  get [SpanGroupSymbol]() {
    return this;
  }

  // More type friendly declarations
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  override every<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): this is CstArray<S>;
  /**
   * Determines whether all the members of an array satisfy the specified test.
   * @param predicate A function that accepts up to three arguments. The every method calls
   * the predicate function for each element in the array until the predicate returns a value
   * which is coercible to the Boolean value false, or until the end of the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function.
   * If thisArg is omitted, undefined is used as the this value.
   */
  override every(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any,
  ): boolean;

  override every(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any,
  ): boolean {
    return super.every(predicate, thisArg);
  }

  // To remove exotic behavior of some methods; ensure exotic behavior of some
  // methods, both on type and runtime side.

  // Remove exotic behavior by default
  static override get [Symbol.species]() {
    return Array;
  }

  /**
   * Creates an array from an iterable object.
   * @param iterable An iterable object to convert to an array.
   */
  static override from<T extends Spanned>(iterable: Iterable<T> | ArrayLike<T>): CstArray<T>;

  /**
   * Creates an array from an iterable object.
   * @param iterable An iterable object to convert to an array.
   * @param mapfn A mapping function to call on every element of the array.
   * @param thisArg Value of 'this' used to invoke the mapfn.
   */
  static override from<T, U extends Spanned>(
    iterable: Iterable<T> | ArrayLike<T>,
    mapfn: (v: T, k: number) => U,
    thisArg?: any,
  ): CstArray<U>;

  static override from<T>(
    iterable: Iterable<T> | ArrayLike<T>,
    mapfn?: (v: T, k: number) => any,
    thisArg?: any,
  ): CstArray<any> {
    return new CstArray(...Array.from(iterable, mapfn as any, thisArg as any) as any);
  }

  // static override of<T>(...items: T[]): never {
  //   throw new Error("just... do not use")
  // }

  // Add exotic behaviors
  /**
   * Combines two or more arrays.
   * This method returns a new array without modifying any existing arrays.
   * @param items Additional arrays and/or items to add to the end of the array.
   */
  override concat(...items: ConcatArray<T>[]): CstArray<T>;
  /**
   * Combines two or more arrays.
   * This method returns a new array without modifying any existing arrays.
   * @param items Additional arrays and/or items to add to the end of the array.
   */
  override concat(...items: (T | ConcatArray<T>)[]): CstArray<T>;

  override concat(...items: (T | ConcatArray<T>)[]): CstArray<T> {
    return new CstArray(...super.concat(...items));
  }

  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
   */
  override filter<S extends T>(
    predicate: (value: T, index: number, array: T[]) => value is S,
    thisArg?: any,
  ): CstArray<S>;
  /**
   * Returns the elements of an array that meet the condition specified in a callback function.
   * @param predicate A function that accepts up to three arguments. The filter method calls the predicate function one time for each element in the array.
   * @param thisArg An object to which the this keyword can refer in the predicate function. If thisArg is omitted, undefined is used as the this value.
   */
  override filter(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any,
  ): CstArray<T>;

  override filter(
    predicate: (value: T, index: number, array: T[]) => unknown,
    thisArg?: any,
  ): CstArray<T> {
    return new CstArray(...super.filter(predicate, thisArg));
  }

  override flat<A, D extends number = 1>(
    this: A,
    depth?: D | undefined,
  ): A extends Spanned ? CstArray<FlatArray<A, D>> : never {
    return new CstArray(...super.flat(depth) as any) as any;
  }

  override slice(start?: number, end?: number): CstArray<T> {
    return new CstArray(...super.slice(start, end));
  }

  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @returns An array containing the elements that were deleted.
   */
  override splice(start: number, deleteCount?: number): CstArray<T>;
  /**
   * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @param items Elements to insert into the array in place of the deleted elements.
   * @returns An array containing the elements that were deleted.
   */
  override splice(start: number, deleteCount: number, ...items: T[]): CstArray<T>;

  override splice(start: number, deleteCount?: number, ...items: T[]): CstArray<T> {
    return new CstArray(...super.splice(start, deleteCount as any, ...items));
  }

  override toReversed(): CstArray<T> {
    return new CstArray(...super.toReversed());
  }

  override toSorted(compareFn?: ((a: T, b: T) => number) | undefined): CstArray<T> {
    return new CstArray(...super.toSorted(compareFn));
  }

  /**
   * Copies an array and removes elements and, if necessary, inserts new elements in their place. Returns the copied array.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @param items Elements to insert into the copied array in place of the deleted elements.
   * @returns The copied array.
   */
  override toSpliced(start: number, deleteCount: number, ...items: T[]): CstArray<T>;

  /**
   * Copies an array and removes elements while returning the remaining elements.
   * @param start The zero-based location in the array from which to start removing elements.
   * @param deleteCount The number of elements to remove.
   * @returns A copy of the original array with the remaining elements.
   */
  override toSpliced(start: number, deleteCount?: number): CstArray<T>;

  override toSpliced(start: number, deleteCount?: number, ...items: T[]): CstArray<T> {
    return new CstArray(...super.toSpliced(start, deleteCount as any, ...items));
  }

  override with(index: number, value: T): CstArray<T> {
    return new CstArray(...super.with(index, value));
  }

  mapCst<U extends Spanned>(
    callbackfn: (value: T, index: number, array: T[]) => U,
    thisArg?: any,
  ): CstArray<U> {
    // should we check if span is continuous?
    return new CstArray(...super.map(callbackfn, thisArg));
  }

  flatMapCst<U extends Spanned, This = undefined>(
    callback: (this: This, value: T, index: number, array: T[]) => U | readonly U[],
    thisArg?: This | undefined,
  ): CstArray<U> {
    return new CstArray(...super.flatMap(callback, thisArg));
  }
}

export type CstTuple<T extends any[]> = CstArray<T[number]> & T;

export type CstReadonlyTuple<T extends any[]> = CstReadonlyArray<T[number]> & T;

export const CstTuple: new <const T extends any[]>(...elements: T) => CstTuple<T> = CstArray;
