import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { Span } from "../../token/Span.ts";
import type {
  CstContextLocal,
  CstContextLocalKey,
  CstProvidableContextLocalMap,
} from "../intermediate/CstContextLocal.ts";
import type { CstNodeType } from "../intermediate/CstNodeType.ts";
import type { CstGroup } from "../tree/CstGroup.ts";
import { CstGroupMetadata } from "../tree/CstGroupMetadata.ts";
import type { CstIntermediateBehavior } from "./CstIntermediateBehavior.ts";
import type { CstIntermediateGroupBase } from "./CstIntermediateGroupBase.ts";
import type { CstIntermediateType } from "./CstIntermediateType.ts";
import { CstProvidableContextLocalMapImpl } from "./CstProvidableContextLocalMapImpl.ts";

export class CstIntermediateMetadata<Info extends CstNodeInfo<any>> {
  protected readonly _contextMap: CstProvidableContextLocalMap;
  readonly behavior: CstIntermediateBehavior;
  readonly startOffset: number;

  constructor(
    readonly parent: CstIntermediateGroupBase<any>,
    readonly type: CstIntermediateType<Info>,
    readonly info: Info,
  ) {
    this._contextMap = new CstProvidableContextLocalMapImpl(this.parent.contextMap.source);
    this.behavior = parent.meta.behavior;
    this.startOffset = parent.offset;
  }

  get contextMap(): CstProvidableContextLocalMap {
    return this._contextMap;
  }

  declare readonly source?: CstGroup<InstanceType<Info>, Info>;

  resolveContext<T>(key: CstContextLocalKey<T>): CstContextLocal<T> {
    return this.contextMap.resolveContext(key);
  }
  resolveContextOrNull<T>(key: CstContextLocalKey<T>): CstContextLocal<T> | null {
    return this.contextMap.resolveContextOrNull(key);
  }
  provideContext(value: CstContextLocal<any>): void {
    return this.contextMap.provideContext(value);
  }

  toGroupMetadata(span: Span): CstGroupMetadata<InstanceType<Info>, Info> {
    // deno-lint-ignore no-this-alias
    const self = this;
    return new class extends CstGroupMetadata<InstanceType<Info>, Info> {
      override readonly type: CstNodeType<Info> = self.type;
      override readonly info: Info = self.info;
      override readonly span: Span = span;
    }();
  }
}
