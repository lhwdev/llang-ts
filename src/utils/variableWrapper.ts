function readonlyError(): never {
  throw new Error("this object is readonly");
}

export function variableWrapper<T extends object>(value: () => T, bind = true): T {
  if (!bind) {
    return new Proxy({}, {
      has: (_, p) => Reflect.has(value(), p),
      get: (_, p, receiver) => Reflect.get(value(), p, receiver),
      set: (_, p, newValue, receiver) => Reflect.set(value(), p, newValue, receiver),
      getOwnPropertyDescriptor: (_, p) => Reflect.getOwnPropertyDescriptor(value(), p),
      ownKeys: (_) => Reflect.ownKeys(value()),
      apply: (_, thisArg, argArray) => Reflect.apply(value() as any, thisArg, argArray),
      construct: (_, argArray, newTarget) => Reflect.construct(value() as any, argArray, newTarget),
      getPrototypeOf: (_) => Reflect.getPrototypeOf(value()),

      isExtensible: (_) => false,
      preventExtensions: (_) => true,
      defineProperty: () => readonlyError(),
      deleteProperty: () => readonlyError(),
      setPrototypeOf: () => readonlyError(),
    }) as T;
  } else {
    const proxied = new Proxy({}, {
      has: (_, p) => Reflect.has(value(), p),
      get: (_, p, receiver) => {
        const backing = value();
        const result = Reflect.get(backing, p, receiver);
        if (typeof result !== "function") return result;

        return {
          [p](this, ...args: any) {
            if (this === proxied) return result.apply(backing, args);
            else return result.apply(this, args);
          },
        }[p as any]; // by doing this, Function.name becomes [p]
      },
      set: (_, p, newValue, receiver) => Reflect.set(value(), p, newValue, receiver),
      getOwnPropertyDescriptor: (_, p) => Reflect.getOwnPropertyDescriptor(value(), p),
      ownKeys: (_) => Reflect.ownKeys(value()),
      apply: (_, thisArg, argArray) => Reflect.apply(value() as any, thisArg, argArray),
      construct: (_, argArray, newTarget) => Reflect.construct(value() as any, argArray, newTarget),
      getPrototypeOf: (_) => Reflect.getPrototypeOf(value()),

      isExtensible: (_) => false,
      preventExtensions: (_) => true,
      defineProperty: () => readonlyError(),
      deleteProperty: () => readonlyError(),
      setPrototypeOf: () => readonlyError(),
    }) as T;
    return proxied;
  }
}

/**
 * First item in {@link values} become top object, and other values become a
 * prototype chain of top object. So to say, if `a = mergePrototypeChain(x, y, z)`,
 * `b = Object.getPrototypeOf(a), c = Object.getPrototypeOf(b)`, then c is
 * identical to z. own properties of b are equivalent to y, and own properties
 * of a are equivalent to x.
 *
 * This makes it easier to insert arbitrary class into prototype chain without
 * coping or modifying original value.
 */
export function mergePrototypeChain(...values: any[]): any {
  if (values.length == 0) return {} as any;
  const [top, ...others] = values;
  if (others.length == 0) return top as any;

  const prototype = mergePrototypeChain(...others) as object;

  return new Proxy(top, {
    getPrototypeOf: (_) => prototype,
  }) as any;
}
