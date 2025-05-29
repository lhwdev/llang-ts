import { CstCodeContextLocal } from "./CstCodeContextLocal.ts";

export abstract class CstCodeBehavior extends CstCodeContextLocal {
  abstract snapshot(): unknown;

  abstract restore(to: unknown): void;
}
