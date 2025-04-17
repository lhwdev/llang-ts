export class CstContextLocalKey<T> {
  constructor(readonly name?: string) {}

  provides(value: T): CstContextLocal<T> {
    return new CstContextLocal(this, value);
  }
}

export class CstContextLocal<T> {
  constructor(readonly key: CstContextLocalKey<T>, readonly value: T) {}
}

export interface CstContextLocalMap {
  resolve<T>(key: CstContextLocalKey<T>): CstContextLocal<T>;
  resolveOrNull<T>(key: CstContextLocalKey<T>): CstContextLocal<T> | null;
}

export interface CstProvidableContextLocalMap extends CstContextLocalMap {
  provide(value: CstContextLocal<any>): void;
}
