import type { CstNodeInfo } from "../../../cst/CstNodeInfo.ts";
import type { CstContextLocalMap } from "../../intermediate/CstContextLocal.ts";
import type { CstIntermediateBehavior } from "../CstIntermediateBehavior.ts";
import type { CstIntermediateGroupBase } from "../CstIntermediateGroupBase.ts";
import { CstIntermediateMetadata } from "../CstIntermediateMetadata.ts";
import type { CstIntermediateType } from "../CstIntermediateType.ts";
import type { CstIntermediateRootGroup } from "./CstIntermediateRootGroup.ts";

export class CstIntermediateRootMetadata extends CstIntermediateMetadata<CstNodeInfo<never>> {
  override readonly parent: CstIntermediateGroupBase<any>;

  constructor(
    parent: CstIntermediateRootGroup,
    behavior: CstIntermediateBehavior,
    type: CstIntermediateType<CstNodeInfo<never>>,
    info: CstNodeInfo<never>,
  ) {
    const contextMap = {
      resolveContext(key) {
        throw new Error(`context ${key} does not exist`);
      },
      resolveContextOrNull(_key) {
        return null;
      },
      get source(): any {
        return contextMap;
      },
    } satisfies CstContextLocalMap;

    super(
      {
        contextMap: {
          source: contextMap,
        },
        meta: { behavior },
        offset: 0,
      } as any,
      type,
      info,
    );
    this.parent = parent;
  }
}
