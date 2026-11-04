"use client";

import { useEffect, useState } from "react";
import type { CollectionSlug, FilterInputProps, RelationshipField } from "@vexcms/core";
import { Button } from "../../ui";
import { useVexConfig } from "../../config/VexConfigContext";
import { useListViewContext } from "../../collections/listView/ListViewContext";
import { useVexDocQuery } from "../../hooks/useVexDocQuery";
import { RelationshipPicker } from "./RelationshipPicker";

/**
 * Relationship field filter row value control — a trigger `Button` that
 * opens the existing `RelationshipPicker` directly, registered as
 * `reactAdapter.fields.relationship.filterInput`. A filter
 * row always compares ONE value regardless of the field's own `hasMany`,
 * so `selectedIds`/`onSelect` collapse the picker's own multi-id contract
 * to a single id (`value ? [value] : []` / `onChange(ids[0])`).
 *
 * The trigger shows `filterValueTitles[value]` (`ListViewContext`,
 * seeded server-side by `NextAdminPage`'s `collectListViewFilterRelationshipValues`
 * prefetch) instead of the raw id. A value this component DIDN'T just
 * resolve itself (a cold `?filter=` link the server missed, a client-side
 * view switch with no full reload) falls back to a one-shot
 * `useVexDocQuery` lookup, which — once it resolves — feeds the SAME
 * `filterValueTitles` map via `setFilterValueTitle`, so every other reader
 * (this trigger on a later render, `ListViewFilterChips.tsx`'s chip) picks it
 * up for free with no second query. The trigger's `aria-label` includes
 * the same visible text (`Filter value: ${label}`) — a static label would
 * hide the selected document's title from screen readers entirely.
 *
 * @param props - Component props.
 * @returns The trigger `Button`, and the picker dialog while open.
 */
export function RelationshipFilterInput(props: FilterInputProps<RelationshipField>) {
  const config = useVexConfig();
  const { filterValueTitles, setFilterValueTitle } = useListViewContext();
  const [isOpen, setIsOpen] = useState(false);
  const value = typeof props.value === "string" && props.value !== "" ? props.value : undefined;
  const targetCollection = config.collections.find((c) => c.slug === props.field.collection.slug);

  const knownTitle = value === undefined ? undefined : filterValueTitles[value];
  const needsTitleLookup = value !== undefined && knownTitle === undefined && targetCollection !== undefined;
  const { document } = useVexDocQuery({
    collection: (targetCollection?.slug ?? "") as CollectionSlug,
    id: needsTitleLookup ? value : undefined,
    skip: !needsTitleLookup,
  });
  useEffect(() => {
    if (!needsTitleLookup || value === undefined || document === undefined || targetCollection === undefined) return;
    if (document === null) {
      setFilterValueTitle(value, null);
      return;
    }
    const titleField = targetCollection.admin.useAsTitle;
    const title = (document as Record<string, unknown>)[titleField] as string | undefined;
    setFilterValueTitle(value, title ?? String(document._id));
  }, [document, needsTitleLookup, value]);

  if (targetCollection === undefined) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full min-w-0 justify-start"
        aria-label="Filter value: Unknown collection"
        disabled
      >
        Unknown collection
      </Button>
    );
  }

  function handleSelect(ids: string[]) {
    props.onChange(ids[0]);
    setIsOpen(false);
  }

  const label = value === undefined ? "Select…" : (filterValueTitles[value] ?? value);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full min-w-0 justify-start truncate"
        aria-label={`Filter value: ${label}`}
        onClick={() => setIsOpen(true)}
        disabled={props.disabled}
      >
        {label}
      </Button>
      {isOpen && (
        <RelationshipPicker
          fieldDef={props.field}
          targetCollection={targetCollection}
          selectedIds={value ? [value] : []}
          drafts={targetCollection.versions.drafts}
          onSelect={handleSelect}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </>
  );
}


