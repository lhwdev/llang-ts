export interface Value<T> {
  readonly value: T;

  map<U>(fn: (value: T) => U): Value<U>;
}

const Empty = Symbol("Empty");

export abstract class LazyValue<T> implements Value<T> {
  abstract readonly value: T;

  static of<T>(calculate: () => T): LazyValue<T> {
    return new class extends LazyValue<T> {
      private _value: T | typeof Empty = Empty;

      override get value(): T {
        let v = this._value;
        if (v !== Empty) return v;
        v = calculate();
        this._value = v;
        return v;
      }
    }();
  }

  static resolved<T>(value: T): LazyValue<T> {
    return new class extends LazyValue<T> {
      override readonly value: T = value;
    }();
  }

  map<U>(fn: (value: T) => U): LazyValue<U> {
    // deno-lint-ignore no-this-alias
    const self = this;
    return new class MappedValue extends LazyValue<U> {
      override get value(): U {
        let v = this._value;
        if (v !== Empty) return v;
        v = fn(self.value);
        this._value = v;
        return v;
      }

      private _value: U | typeof Empty = Empty;
    }();
  }
}
