import type {
  LimitedReadonlySpanArray,
  LimitedSpanArray,
  ReadonlySpanArrayType,
  SpanArrayType,
} from "../token/SpanArray.ts";
import type { Spanned } from "../token/Spanned.ts";

interface CstListAddition<T extends Spanned> {
  mapCst<U extends Spanned>(
    callbackfn: (value: T, index: number, array: CstList<T>) => U,
    thisArg?: any,
  ): CstList<U>;

  flatMapCst<U extends Spanned, This = undefined>(
    callback: (this: This, value: T, index: number, array: CstList<T>) => U | readonly U[],
    thisArg?: This | undefined,
  ): CstList<U>;
}

export interface LimitedCstList<T extends Spanned>
  extends LimitedReadonlySpanArray<T>, CstListAddition<T> {}

/**
 * {@link CstList} is like a CstNode, but it still behaves like normal arrays like `readonly T[]`.
 * Note that, for convenience {@link CstList} extends ReadonlyArray, but returned value from
 * {@link slice}, {@link concat}, etc should be thought to be {@link CstList}. Do not pass them to
 * where mutable array is required.
 */
// deno-fmt-ignore
export interface CstList<T extends Spanned> extends ReadonlySpanArrayType<T, CstMutableLists.CstMutableList<T>>, CstListAddition<T> {
  /// Things to implement manually due to generic type limitation / recursive type
  flat<A, D extends number = 1>(this: A, depth?: D | undefined): A extends Spanned ? CstMutableLists.CstMutableList<FlatArray<A, D>> : never;

  flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>, thisArg?: This): CstMutableLists.CstMutableList<U>;
  flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: T[]) => U | ReadonlyArray<U>, thisArg?: This): CstMutableLists.CstMutableList<U>;
  
  every<S extends T>(predicate: (value: T, index: number, array: LimitedCstList<T>) => value is S, thisArg?: any): this is CstList<S>;
  every(predicate: (value: T, index: number, array: LimitedCstList<T>) => unknown, thisArg?: any): boolean;
}

export namespace CstMutableLists {
  export interface CstMutableListAddition<T extends Spanned> {
    mapCst<U extends Spanned>(
      callbackfn: (value: T, index: number, array: CstMutableList<T>) => U,
      thisArg?: any,
    ): CstMutableList<U>;

    flatMapCst<U extends Spanned, This = undefined>(
      callback: (this: This, value: T, index: number, array: CstMutableList<T>) => U | readonly U[],
      thisArg?: This | undefined,
    ): CstMutableList<U>;
  }

  export interface LimitedCstMutableList<T extends Spanned>
    extends LimitedSpanArray<T>, CstMutableListAddition<T> {}

  // deno-fmt-ignore
  export interface CstMutableList<T extends Spanned> extends SpanArrayType<T>, CstMutableListAddition<T> {
    /// Things to implement manually due to generic type limitation / recursive type
    flat<A, D extends number = 1>(this: A, depth?: D | undefined): A extends Spanned ? CstMutableList<FlatArray<A, D>> : never;

    flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: LimitedCstMutableList<T>) => U | ReadonlyArray<U>, thisArg?: This): CstMutableList<U>;
    flatMap<U extends Spanned, This = undefined>(callback: (this: This, value: T, index: number, array: LimitedCstMutableList<T>) => U | ReadonlyArray<U>, thisArg?: This): CstMutableList<U>;

    every<S extends T>(predicate: (value: T, index: number, array: LimitedCstMutableList<T>) => value is S, thisArg?: any): this is CstMutableList<S>;
    every(predicate: (value: T, index: number, array: LimitedCstMutableList<T>) => unknown, thisArg?: any): boolean;
  }
}

type Check<C extends P, P> = C;
type CheckReadonlySpanGroup = Check<
  CstList<import("./CstNode.ts").CstNode>,
  import("../token/SpanArray.ts").ReadonlySpanArray<import("./CstNode.ts").CstNode>
>;

type CheckSpanGroup = Check<
  CstMutableLists.CstMutableList<import("./CstNode.ts").CstNode>,
  import("../token/SpanArray.ts").SpanArray<import("./CstNode.ts").CstNode>
>;

type CheckSpanGroupSelf = Check<
  import("../token/SpanArray.ts").SpanArray<import("./CstNode.ts").CstNode>,
  import("../token/SpanArray.ts").ReadonlySpanArray<import("./CstNode.ts").CstNode>
>;

type CheckCst = Check<
  CstMutableLists.CstMutableList<import("./CstNode.ts").CstNode>,
  import("../token/SpanArray.ts").ReadonlySpanArray<import("./CstNode.ts").CstNode>
>;
