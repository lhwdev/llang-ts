import { type Logger, withLogger } from "../../../common/Logger.ts";
import { CstNode } from "../../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../../cst/CstNodeInfo.ts";
import { fmt } from "../../../utils/format.ts";
import type { CstSpecialNodeInfo } from "../../CstSpecialNode.ts";
import type { CstIntermediateGroup } from "../../intermediate/CstIntermediateGroup.ts";
import type { CstNodeType } from "../../intermediate/CstNodeType.ts";
import { currentGroupOrNull } from "../../intermediate/currentGroup.ts";
import type { CstIntermediateBehavior } from "../CstIntermediateBehavior.ts";
import { CstIntermediateGroupBase } from "../CstIntermediateGroupBase.ts";
import { CstIntermediateItems } from "../CstIntermediateItems.ts";
import type { CstIntermediateMetadata } from "../CstIntermediateMetadata.ts";
import { CstIntermediateTypeImpl } from "../CstIntermediateTypeImpl.ts";
import { CstIntermediateRootMetadata } from "./CstIntermediateRootMetadata.ts";
import { CstIntermediateRootState } from "./CstIntermediateRootState.ts";

class CstRootNode<T> extends CstNode {
  constructor(readonly value: T) {
    super();
  }
}

export class CstIntermediateRootGroup extends CstIntermediateGroupBase<never> {
  override offset: number = 0;

  override meta: CstIntermediateMetadata<CstNodeInfo<never>>;
  override state: CstIntermediateRootState;

  constructor(behavior: CstIntermediateBehavior) {
    super();

    const info = function CstPseudoRootNode() {
      throw new Error("cannot construct root node");
    } as unknown as CstNodeInfo<never>;
    const type = new CstIntermediateTypeImpl(info);

    const meta = this.meta = new CstIntermediateRootMetadata(this, behavior, type, info);
    this.state = new CstIntermediateRootState(meta, new CstIntermediateItems(meta));
  }

  withRoot<R>(fn: () => R): R {
    const logger: Logger = {
      log(line) {
        const debug = currentGroupOrNull()?.debug;
        if (debug) debug.log`${fmt.raw(line)}`;
        else console.log(line);
      },
    };
    return withLogger(
      logger,
      () => this.beginChild(CstRootNode<R>).buildNode(() => new CstRootNode(fn())).value,
    );
  }

  override get parent(): CstIntermediateGroupBase<any> {
    return this;
  }

  private noOpsError(): never {
    throw new Error("this operation is not implemented for root group.");
  }

  override get type(): CstNodeType<CstNodeInfo<never>> {
    return this.meta.type;
  }

  override get intrinsics(): never {
    return this.noOpsError();
  }

  override nextSlot(): never {
    return this.noOpsError();
  }

  override updateSlot<T>(_value: T): never {
    return this.noOpsError();
  }

  override beginChild<Info extends CstNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info> {
    return this.state.beginChild(this, info);
  }

  override beginSpecialChild<Info extends CstSpecialNodeInfo<any>>(
    info: Info,
  ): CstIntermediateGroup<InstanceType<Info>, Info> {
    return this.state.beginSpecialChild(this, info);
  }

  override skipCurrent(): null {
    return null;
  }

  override beforeEnd(_node: never): never {
    return this.noOpsError();
  }

  override end(_node: never): never {
    return this.noOpsError();
  }

  override endWithError(_error: unknown | null): null {
    return null;
  }

  override getParentForEnd(): CstIntermediateGroupBase<any> {
    throw new Error("cannot end root group.");
  }

  override get debug(): undefined {
    return undefined;
  }
}
