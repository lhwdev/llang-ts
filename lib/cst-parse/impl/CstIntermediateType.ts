import { CstNode } from "../../cst/CstNode.ts";
import type { CstNodeInfo } from "../../cst/CstNodeInfo.ts";
import type { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";
import { CstNodeType } from "../intermediate/CstNodeType.ts";
import { CstIntermediateMetadata } from "./CstIntermediateMetadata.ts";

export class CstIntermediateType<out Info extends CstNodeInfo<any>> extends CstNodeType<Info> {
  declare private _metadataFactory?;

  createMetadata(
    parent: CstIntermediateGroup<any>,
    info: Info,
    startOffset: number,
  ): CstIntermediateMetadata<Info> {
    if (!this._metadataFactory) {
      this._metadataFactory = CstIntermediateMetadata.defaultFactory(this);
    }
    return new this._metadataFactory(parent, info, startOffset);
  }

  static Default = new CstIntermediateType<typeof CstNode>(CstNode);
}
