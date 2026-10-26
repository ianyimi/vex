import { whereToNode, type VexWhere, type VexWhereNode } from "@vexcms/core";

/**
 * Converts a client `where` to the plain node the Convex function accepts.
 * A callback cannot cross the network; a node passes through unchanged.
 *
 * @param where - The caller's `where`, either form, or `undefined`.
 * @returns The plain node, or `undefined`.
 */
export function whereArg<S extends string>(where: VexWhere<S> | undefined): VexWhereNode<S> | undefined {
  if (where === undefined) return undefined;
  return typeof where === "function" ? whereToNode<S>(where) : where;
}
