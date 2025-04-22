import { CstIntermediateGroup } from "../intermediate/CstIntermediateGroup.ts";

export class CstIntermediateSlots {
  private slots: unknown[] = [];
  private index = -1;

  nextSlot(): unknown {
    if (this.index >= this.slots.length) {
      return CstIntermediateGroup.EmptySlot;
    }
    const target = ++this.index;
    if (target >= this.slots.length) {
      return CstIntermediateGroup.EmptySlot;
    }
    return this.slots[target];
  }

  updateSlot<T>(value: T): T {
    if (this.index === -1) {
      throw new Error("call nextSlot() before calling updateSlot()");
    }

    return this.slots[this.index] = value;
  }
}
