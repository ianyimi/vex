"use client";

import type {
  CellComponentProps,
  CollectionSlug,
  RelationshipField,
} from "@vexcms/core";

/**
 * Relationship field cell component for the data-table list view.
 *
 * Displays the stored `Id[]` value for the relationship field. For
 * `hasMany: false`, renders the first (and only expected) ID truncated to
 * 16 characters. For `hasMany: true`, renders a count badge (`N items`).
 *
 * Full document title population is deferred — fetching the related
 * document's title in every cell would require N+1 Convex queries.
 *
 * @param props - Standard cell component props from `CellComponentProps<RelationshipField>`.
 *
 * @example
 * ```tsx
 * // Rendered automatically by relationshipFieldToColumnDef — not used directly
 * <RelationshipFieldCell value={["abc123"]} fieldDef={authorField} row={row} isTitleField={false} collection={postsCollection} />
 * ```
 */
export function RelationshipFieldCell(
  props: CellComponentProps<RelationshipField<CollectionSlug>>,
) {
  const { value, fieldDef } = props;

  if (!value) return <span className="text-muted-foreground">—</span>;

  if (fieldDef.hasMany) {
    const ids = Array.isArray(value) ? value : [];
    if (ids.length === 0)
      return <span className="text-muted-foreground">—</span>;
    return (
      <span className="text-xs text-muted-foreground font-mono">
        {ids.length} {ids.length === 1 ? "item" : "items"}
      </span>
    );
  }

  const ids = Array.isArray(value) ? value : [];
  const id = ids[0] ?? "";
  if (!id) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-xs font-mono text-muted-foreground" title={id}>
      {id.length > 16 ? `${id.slice(0, 16)}…` : id}
    </span>
  );
}
