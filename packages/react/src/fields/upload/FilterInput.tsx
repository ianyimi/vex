"use client";

import { useEffect, useState } from "react";
import type { CollectionSlug, FilterInputProps, UploadField } from "@vexcms/core";
import { Button } from "../../ui";
import { useVexConfig } from "../../config/VexConfigContext";
import { useListViewContext } from "../../collections/listView/ListViewContext";
import { useVexDocQuery } from "../../hooks/useVexDocQuery";
import { UploadFilterPicker } from "./UploadFilterPicker";

/**
 * Upload field filter row value control — a trigger `Button` that opens
 * {@link UploadFilterPicker} (the new standalone single-select media
 * dialog), registered as `reactAdapter.fields.upload.filterInput`
 * (Decision 50). Mirrors `relationship/FilterInput.tsx` exactly — same
 * single-id collapse (a filter row always compares ONE value regardless
 * of `hasMany`), same `filterValueTitles`/`setFilterValueTitle` title
 * resolution via `ListViewContext`, falling back to a one-shot
 * `useVexDocQuery` lookup for a value this component didn't just resolve
 * itself (a cold `?filter=` link, a client-side view switch). The
 * trigger's `aria-label` includes the same visible text (`Filter value:
 * ${label}`), mirroring `relationship/FilterInput.tsx`'s own fix — a
 * static label would hide the selected file's name from screen readers.
 *
 * @param props - Component props.
 * @returns The trigger `Button`, and the picker dialog while open.
 */
export function UploadFilterInput(props: FilterInputProps<UploadField>) {
  const config = useVexConfig();
  const { filterValueTitles, setFilterValueTitle } = useListViewContext();
  const [isOpen, setIsOpen] = useState(false);
  const value = typeof props.value === "string" && props.value !== "" ? props.value : undefined;
  const targetCollection = config.mediaCollections.find((mc) => mc.slug === props.field.to);

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

  function handleSelect(id: string | undefined) {
    props.onChange(id);
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
        <UploadFilterPicker
          fieldDef={props.field}
          targetCollection={targetCollection}
          selectedId={value}
          onSelect={handleSelect}
          onCancel={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
