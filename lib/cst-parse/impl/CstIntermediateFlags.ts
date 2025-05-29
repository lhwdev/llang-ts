export class CstIntermediateFlags {
  errorBehavior: "nullable" | "discardable" | false = false;
  isVital: boolean = false;

  get isErrorAcceptor(): boolean {
    return !!this.errorBehavior;
  }

  get isRestorable(): boolean {
    if (this.errorBehavior) return true;

    return false;
  }
}
