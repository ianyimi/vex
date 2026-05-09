"use client";

import * as React from "react";
import { X } from "lucide-react";
import type { RelationshipField } from "@vexcms/core";
import {
  createFieldInput,
  FormDescription,
  FormLabel,
  FormError,
} from "../../form";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";
import { Input } from "../../ui/input";
import { Button } from "../../ui/button";
import { useDebounceValue } from "@ts-hooks-kit/core";
import { useQueries } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi, type VexDocument } from "@vexcms/core";
import { useRelationshipPickerOptions } from "../../../hooks";
import { useVexConfig } from "../../../context/VexConfigContext";
import { resolveRelationshipPreview } from "./preview";

/**
 * Relationship field input — popover combobox.
 *
 * Renders a trigger that mimics an input, with selected-value chip(s); opens a
 * popover containing a debounced search input and a list of candidate target
 * docs. All rows + chips are rendered via `resolveRelationshipPreview` (Decision 11).
 *
 * @see Master Port Inventory for the line-by-line origin of each block below.
 */
export const RelationshipFieldInput = createFieldInput<
  string[],
  RelationshipField
>(({ name, fieldDef, field, submissionAttempts }) => {
  // `createFieldInput`'s render context provides { name, fieldDef, readOnly,
  // field, submissionAttempts } — no `config`. Read the live VexConfig from the
  // existing AdminLayout-provided context instead.
  const config = useVexConfig();

  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [debouncedSearch] = useDebounceValue(search, 200);

  const targetCollection = React.useMemo(
    () => config.collections.find((c) => c.slug === fieldDef.collection.slug),
    [config.collections, fieldDef.collection.slug],
  );

  // Early-return guard: if the relationship's target slug isn't registered in
  // `config.collections` (renamed, typo, deleted), render a clear error
  // instead of crashing or relying on `targetCollection!` non-null assertions.
  if (!targetCollection) {
    return (
      <div className="flex flex-col gap-1.5">
        <FormLabel field={fieldDef} name={name} />
        <p className="text-xs text-destructive">
          Unknown collection: <code>{fieldDef.collection.slug}</code>
        </p>
      </div>
    );
  }

  const Preview = React.useMemo(
    () => resolveRelationshipPreview({ fieldDef, targetCollection }),
    [fieldDef, targetCollection],
  );

  // Picker query — Decision 12.
  const { documents, isPending } = useRelationshipPickerOptions(
    fieldDef,
    targetCollection,
    debouncedSearch,
    { enabled: open },
  );

  // Resolve selected IDs to full docs for chip rendering.
  // tanstack-query's per-ID cache deduplicates with the picker's search results.
  const selectedIds: string[] = field.state.value ?? [];
  const selectedDocResults = useQueries({
    queries: selectedIds.map((id) => ({
      ...convexQuery(vexConvexApi.get, { id }),
      enabled: id !== "",
    })),
  });
  const selectedDocs = selectedDocResults
    .map((r) => r.data as VexDocument | undefined)
    .filter((d): d is VexDocument => d !== undefined && d !== null);

  const isMany = fieldDef.hasMany;
  const targetLabel =
    targetCollection?.labels.singular ?? fieldDef.collection.slug;

  // —— Lifted verbatim from master lines 165–202 ——
  const handleSelect = React.useCallback(
    (docId: string) => {
      if (fieldDef.admin.readOnly) return;
      const current: string[] = field.state.value ?? [];
      if (isMany) {
        field.handleChange(
          current.includes(docId)
            ? current.filter((id: string) => id !== docId)
            : [...current, docId],
        );
      } else {
        field.handleChange(current[0] === docId ? [] : [docId]);
        setOpen(false);
      }
    },
    [field, isMany, fieldDef.admin.readOnly],
  );

  const handleRemove = React.useCallback(
    (docId: string) => {
      if (fieldDef.admin.readOnly) return;
      const current: string[] = field.state.value ?? [];
      field.handleChange(
        isMany ? current.filter((id: string) => id !== docId) : [],
      );
    },
    [field, isMany, fieldDef.admin.readOnly],
  );

  return (
    <div className="flex flex-col gap-1.5">
      <FormLabel field={fieldDef} name={name} />

      {/* —— Multi-select chips: master lines 207–229 —— */}
      {isMany && selectedDocs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedDocs.map((doc) => (
            <span
              key={doc._id}
              className="inline-flex items-center gap-1 rounded-sm bg-muted border border-border px-2 py-0.5 text-xs"
            >
              <Preview doc={doc} fieldKey="_id" config={targetCollection as never} />
              <button
                type="button"
                onClick={() => handleRemove(doc._id)}
                className="hover:text-destructive"
                disabled={fieldDef.admin.readOnly}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover
        open={open}
        onOpenChange={(v) => {
          if (!fieldDef.admin.readOnly) setOpen(v);
        }}
      >
        {/* —— Trigger styled like an input: master lines 231–256 ——
             Base UI's PopoverTrigger uses `render` to compose with another
             element, not Radix's `asChild`. Pass a Button element to `render`
             and Base UI clones its props onto the trigger. */}
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              disabled={fieldDef.admin.readOnly}
              className="w-full justify-between font-normal"
            />
          }
        >
          {!isMany && selectedDocs[0] ? (
            <Preview
              doc={selectedDocs[0]}
              fieldKey="_id"
              config={targetCollection as never}
            />
          ) : (
            <span className="text-muted-foreground-subtle">
              {fieldDef.admin.placeholder || `Select ${targetLabel}…`}
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0">
          {/* —— Search input with isPending spinner: Decision 13 —— */}
          <div className="p-2 border-b border-border">
            <Input
              type="text"
              placeholder={`Search ${targetLabel}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              loading={isPending}
              autoFocus
            />
          </div>

          {/* —— Result list: master lines 258–295, rendered via Preview —— */}
          <div className="max-h-[240px] overflow-y-auto">
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground-subtle p-4 text-center">
                {isPending ? "Loading…" : "No documents found"}
              </p>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedIds.includes(doc._id as string);
                return (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => handleSelect(doc._id)}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 text-[13px] hover:bg-accent hover:text-accent-foreground text-left ${
                      isSelected ? "bg-accent text-accent-foreground" : ""
                    }`}
                  >
                    {isMany && (
                      <span
                        className={`h-4 w-4 rounded-sm border flex-shrink-0 grid place-items-center ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-input"
                        }`}
                      >
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </span>
                    )}
                    <span className="flex-1 truncate">
                      <Preview
                        doc={doc}
                        fieldKey="_id"
                        config={targetCollection as never}
                      />
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* —— Create-dialog render-prop slot: master lines 302–320 —— */}
          {/* Deferred — see Out of Scope. Hook stays available for future allowCreate. */}
        </PopoverContent>
      </Popover>

      <FormDescription field={fieldDef} />
      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
});
