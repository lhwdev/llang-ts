function readonlyError(): never {
  throw new Error("this object is readonly");
}

export function variableWrapper<T extends object>(value: () => T): T {
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
}
