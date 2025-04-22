export class CstContextLocalKey<T> {
  constructor(readonly name?: string) {}

  provides(value: T): CstContextLocal<T> {
    return new CstContextLocal(this, value);
  }

  matches(other: CstContextLocalKey<any>): other is CstContextLocalKey<T> {
    return this === other;
  }

  toString() {
    return this.name ?? "CstContextLocalKey";
  }
}

export class CstContextLocal<T> {
  constructor(readonly key: CstContextLocalKey<T>, readonly value: T) {}

  matches(key: CstContextLocalKey<any>): key is CstContextLocalKey<T> {
    return this.key.matches(key);
  }
}

export interface CstContextLocalMap {
  source: CstContextLocalMap;

  resolveContext<T>(key: CstContextLocalKey<T>): CstContextLocal<T>;
  resolveContextOrNull<T>(key: CstContextLocalKey<T>): CstContextLocal<T> | null;
}

export interface CstProvidableContextLocalMap extends CstContextLocalMap {
  provideContext(value: CstContextLocal<any>): void;
}
