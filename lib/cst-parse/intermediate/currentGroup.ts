import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

let current: CstIntermediateGroup<any> | null = null;

export function currentGroup(): CstIntermediateGroup<any> {
  if (!current) throw new Error("current group is not set");
  return current;
}

export function intrinsicBeginGroup(child: CstIntermediateGroup<any>) {
  current = child;
}

export function intrinsicEndGroup(parent: CstIntermediateGroup<any>) {
  current = parent;
}

export function withGroup<Group extends CstIntermediateGroup<any>, R>(
  newSelf: Group,
  fn: (self: Group) => R,
): R {
  const previous = current;
  current = newSelf;
  try {
    return fn(newSelf);
  } finally {
    current = previous;
  }
}

export function withGroupFn<Group extends CstIntermediateGroup<any>>(
  newSelf: Group,
): <R>(fn: (self: Group) => R) => R {
  return function withSelf(fn) {
    const previous = current;
    current = newSelf;
    try {
      return fn(newSelf);
    } finally {
      current = previous;
    }
  };
}
