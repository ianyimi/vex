"use client";

import type { CellComponentProps, GroupField, TDocument } from "@vexcms/core";

/**
 * Group field cell component for the admin list-table view.
 *
 * Shows a compact summary badge indicating how many sub-field values are
 * present (e.g. `{ 3 keys }`). Renders `—` when the value is absent.
 *
 * A full inline object preview is intentionally out of scope here — the list
 * view is not the right place for nested object data.
 *
 * @example
 * ```tsx
 * <GroupFieldCell value={{ title: "Hello", body: "World" }} ... />
 * // → renders "{ 2 keys }"
 * ```
 */
export function GroupFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<GroupField, TData>,
) {
  const value = props.value as Record<string, unknown> | null | undefined;

  if (value == null || typeof value !== "object") {
    return <span className="text-muted-foreground">—</span>;
  }

  const count = Object.keys(value).length;

  return (
    <span className="text-xs text-muted-foreground font-mono">
      {`{ ${count} ${count === 1 ? "key" : "keys"} }`}
    </span>
  );
}
