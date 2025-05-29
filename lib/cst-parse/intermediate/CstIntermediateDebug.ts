export interface CstIntermediateDebug {
  debugName: string;

  log(str: TemplateStringsArray, ...args: any): void;
}
