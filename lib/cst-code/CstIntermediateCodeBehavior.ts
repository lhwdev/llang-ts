import { CstIntermediateBehaviorBase } from "../cst-parse/impl/CstIntermediateBehaviorBase.ts";
import type { CstCodeBehavior } from "./CstCodeBehavior.ts";

interface StackState {
  snapshot: unknown | null;
}

export abstract class CstIntermediateCodeBehavior extends CstIntermediateBehaviorBase {
  private stack: StackState[] = [];

  abstract readonly codeBehavior: CstCodeBehavior;

  override onBeginGroup(saved: boolean): void {
    this.stack.push({ snapshot: saved ? this.codeBehavior.snapshot() : null });
  }

  override onDiscardGroup(): void {
    const group = this.stack.pop()!;
    this.codeBehavior.restore(group.snapshot);
  }

  override onEndGroup(): void {
    this.stack.pop()!;
  }

  override onEndGroupForError(): void {
    this.stack.pop()!;
  }
}
