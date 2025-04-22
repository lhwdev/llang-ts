export function isInherited<
  Parent extends abstract new (...args: any) => any,
>(
  child: abstract new (...args: any) => any,
  parent: Parent,
): child is Parent {
  return child === parent || child.prototype instanceof parent;
}
