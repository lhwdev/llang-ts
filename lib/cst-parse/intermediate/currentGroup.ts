import type { CstIntermediateGroup } from "./CstIntermediateGroup.ts";

let current: CstIntermediateGroup<any> | null = null;

export function currentGroup(): CstIntermediateGroup<any> {
  if (!current) throw new Error("current group is not set");
  return current;
}

export function currentGroupOrNull(): CstIntermediateGroup<any> | null {
  return current;
}

export function intrinsicBeginGroup(child: CstIntermediateGroup<any>) {
  current?.hintIsCurrent(false, true);
  current = child;
  child.hintIsCurrent(true, true);
}

export function intrinsicEndGroup(parent: CstIntermediateGroup<any> | null) {
  current?.hintIsCurrent(false, false);
  current = parent;
  parent?.hintIsCurrent(true, false);
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
    intrinsicBeginGroup(newSelf);
    try {
      return fn(newSelf);
    } finally {
      if (previous) {
        intrinsicEndGroup(previous);
      } else {
        current = previous;
        newSelf.hintIsCurrent(true, false);
      }
    }
  };
}
