export function isInherited<Child, Parent>(
  child: abstract new (...args: any) => Child,
  parent: abstract new (...args: any) => Parent,
): boolean {
  return child.prototype instanceof parent;
}
