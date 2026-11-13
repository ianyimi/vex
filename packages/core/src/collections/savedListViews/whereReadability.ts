import type { VexWhereNodeOf } from "../../access/queryConstraintTypes";

/**
 * Every field name `node` references, walking `and`/`or`/`not` recursively.
 * Used ONLY to decide whether an `or`/`not` branch is entirely readable
 * (below) — never to parse or validate the tree's shape.
 *
 * @param node - The where tree, or a branch of it during recursion.
 * @returns Every referenced field name, deduped.
 */
export function whereReferencedFields(node: VexWhereNodeOf<unknown>): string[] {
  const names = new Set<string>();
  const visit = (n: VexWhereNodeOf<unknown>): void => {
    if ("and" in n) n.and.forEach(visit);
    else if ("or" in n) n.or.forEach(visit);
    else if ("not" in n) visit(n.not);
    else names.add(n.field);
  };
  visit(node);
  return [...names];
}

/**
 * Counts the leaf conditions in a {@link VexWhereNodeOf} tree, walking
 * `and`/`or`/`not` recursively. One leaf is one condition a user would see
 * as one row in the filter builder.
 *
 * @param node - The where tree, or a branch of it during recursion.
 * @returns The number of leaf conditions under `node`, inclusive.
 */
export function countWhereLeaves(node: VexWhereNodeOf<unknown>): number {
  if ("and" in node) return node.and.reduce((sum, child) => sum + countWhereLeaves(child), 0);
  if ("or" in node) return node.or.reduce((sum, child) => sum + countWhereLeaves(child), 0);
  if ("not" in node) return countWhereLeaves(node.not);
  return 1;
}

/** The result of {@link splitWhereByReadability}. */
export interface SplitWhereByReadability {
  /**
   * The subtree built ONLY from conditions the caller can read — `undefined`
   * when every condition in the original tree was unreadable (or the
   * original tree was itself a single unreadable leaf). Safe to render as a
   * filter chip: it never carries a value for a field the caller can't read.
   */
  visible?: VexWhereNodeOf<unknown>;
  /** How many leaf conditions are NOT represented in `visible` — the hidden-filter badge's count. */
  hiddenCount: number;
}

/**
 * Splits a `where` tree into the portion safe to show the caller as a
 * filter chip ({@link SplitWhereByReadability.visible}) and a count of the
 * leaf conditions that are not (`hiddenCount`) — the shared computation
 * behind a saved view's hidden-filter badge, used for BOTH a `config`/
 * `default` view's declared `where` ({@link toClientSavedListViewConfig})
 * and a `shared` view's own saved `where` (`@vexcms/react`'s
 * `useSavedListViews.ts`), so neither can drift from the other about what
 * "hidden" means. Replaces the earlier "any unreadable field anywhere in
 * the tree hides the WHOLE tree" rule — a condition on a field the caller
 * CAN read is always shown, whether or not some OTHER sibling condition in
 * the same view is on a field they can't.
 *
 * An `and` node splits leaf-by-leaf: every readable child survives into
 * `visible` (re-wrapped in a new `and` when more than one survives, or
 * returned bare when exactly one does), every unreadable child is dropped
 * and counted. An `or`/`not` node is NOT split internally — showing just
 * one branch of an `or` (or the content of a `not`) as if it were the
 * whole condition would misrepresent what the query actually matches — so
 * the WHOLE node counts as hidden the moment ANY field it references is
 * unreadable, and is shown unchanged (every leaf counted visible, `0`
 * hidden) when every field it references is readable. A bare leaf is
 * either fully visible or fully hidden (counting `1`).
 *
 * @param node - The where tree, or a branch of it during recursion.
 * @param isFieldReadable - Whether the current caller may read one field.
 * @returns The visible subtree (if any) and the hidden leaf count.
 */
export function splitWhereByReadability(
  node: VexWhereNodeOf<unknown>,
  isFieldReadable: (field: string) => boolean,
): SplitWhereByReadability {
  if ("and" in node) {
    const parts = node.and.map((child) => splitWhereByReadability(child, isFieldReadable));
    const hiddenCount = parts.reduce((sum, part) => sum + part.hiddenCount, 0);
    const visibleChildren = parts
      .map((part) => part.visible)
      .filter((visible): visible is VexWhereNodeOf<unknown> => visible !== undefined);
    const visible =
      visibleChildren.length === 0
        ? undefined
        : visibleChildren.length === 1
          ? visibleChildren[0]
          : ({ and: visibleChildren } as VexWhereNodeOf<unknown>);
    return { visible, hiddenCount };
  }
  if ("or" in node || "not" in node) {
    const fullyReadable = whereReferencedFields(node).every((field) => isFieldReadable(field));
    return fullyReadable ? { visible: node, hiddenCount: 0 } : { visible: undefined, hiddenCount: countWhereLeaves(node) };
  }
  return isFieldReadable(node.field) ? { visible: node, hiddenCount: 0 } : { visible: undefined, hiddenCount: 1 };
}
