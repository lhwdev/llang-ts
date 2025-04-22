import type {
  CstContextLocal,
  CstContextLocalKey,
  CstContextLocalMap,
  CstProvidableContextLocalMap,
} from "../intermediate/CstContextLocal.ts";

export class CstProvidableContextLocalMapImpl implements CstProvidableContextLocalMap {
  constructor(
    readonly parent: CstContextLocalMap,
    protected entries?: CstContextLocal<any>[],
  ) {}

  get source(): CstContextLocalMap {
    if (this.entries) return this;
    else return this.parent;
  }

  resolveContext<T>(key: CstContextLocalKey<T>): CstContextLocal<T> {
    const value = this.resolveContextOrNull(key);
    if (!value) throw new Error(`could not resolve ${key}`);
    return value;
  }

  resolveContextOrNull<T>(key: CstContextLocalKey<T>): CstContextLocal<T> | null {
    for (const entry of this.entries ?? []) {
      if (entry.matches(key)) return entry;
    }
    return this.parent.resolveContextOrNull(key);
  }

  provideContext(value: CstContextLocal<any>): void {
    if (!this.entries) {
      this.entries = [value];
    } else {
      this.entries.push(value);
    }
  }
}
