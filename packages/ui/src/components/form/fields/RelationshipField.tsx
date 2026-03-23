"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { anyApi } from "convex/server";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";
import { X } from "lucide-react";

interface RelationshipFieldProps {
  field: {
    state: { value: unknown };
    handleChange: (value: unknown) => void;
  };
  fieldDef: {
    label?: string;
    to: string;
    hasMany?: boolean;
    required?: boolean;
    labels?: { singular?: string; plural?: string };
    admin?: { readOnly?: boolean; description?: string };
  };
  name: string;
  /** VEX config — used to look up useAsTitle on the target collection */
  config?: {
    collections: Array<{ slug: string; admin?: { useAsTitle?: string } }>;
    media?: { collections: Array<{ slug: string; admin?: { useAsTitle?: string } }> };
    auth?: { collections: Array<{ slug: string; admin?: { useAsTitle?: string } }> };
  };
}

export function RelationshipField({ field, fieldDef, name, config }: RelationshipFieldProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const disabled = fieldDef.admin?.readOnly ?? false;
  const isMany = fieldDef.hasMany ?? false;
  const label = isMany
    ? (fieldDef.labels?.plural ?? fieldDef.label ?? name)
    : (fieldDef.label ?? name);

  // Look up target collection's useAsTitle
  const targetCollection = React.useMemo(() => {
    if (!config) return undefined;
    return (
      config.collections.find((c) => c.slug === fieldDef.to) ??
      config.media?.collections.find((c) => c.slug === fieldDef.to) ??
      config.auth?.collections.find((c) => c.slug === fieldDef.to)
    );
  }, [config, fieldDef.to]);

  const useAsTitle = targetCollection?.admin?.useAsTitle as string | undefined;

  // Query documents from the target collection
  const listResult = useQuery(
    anyApi.vex.api[fieldDef.to]?.list,
    {
      paginationOpts: { numItems: 50, cursor: null },
    },
  );

  // Search query (only when search has text and search index exists)
  const searchResult = useQuery(
    anyApi.vex.api[fieldDef.to]?.search,
    search.trim().length > 0 ? { query: search.trim() } : "skip",
  );

  const documents = React.useMemo(() => {
    if (search.trim().length > 0 && searchResult) {
      return searchResult as Record<string, unknown>[];
    }
    const page = (listResult as any)?.page;
    if (Array.isArray(page)) return page as Record<string, unknown>[];
    return [];
  }, [listResult, searchResult, search]);

  // Get display label for a document
  const getDocLabel = React.useCallback(
    (doc: Record<string, unknown>) => {
      if (useAsTitle && doc[useAsTitle]) {
        return String(doc[useAsTitle]);
      }
      return String(doc._id ?? "");
    },
    [useAsTitle],
  );

  // Current selected value(s)
  const currentValue = field.state.value;
  const selectedIds: string[] = React.useMemo(() => {
    if (isMany) {
      return Array.isArray(currentValue) ? (currentValue as string[]).filter(Boolean) : [];
    }
    return currentValue && currentValue !== "" ? [String(currentValue)] : [];
  }, [currentValue, isMany]);

  // Find label for selected documents
  const selectedLabels = React.useMemo(() => {
    return selectedIds.map((id) => {
      const doc = documents.find((d) => String(d._id) === id);
      return { id, label: doc ? getDocLabel(doc) : id };
    });
  }, [selectedIds, documents, getDocLabel]);

  // Popover container for dialog compatibility
  const container = React.useMemo(
    () => triggerRef.current?.closest('[data-slot="dialog-content"]') as HTMLElement | null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );

  // Target collection's singular label for placeholder
  const targetLabel = React.useMemo(() => {
    if (!targetCollection) return "document";
    const labels = (targetCollection as any).labels;
    return labels?.singular ?? targetCollection.slug ?? "document";
  }, [targetCollection]);

  const handleSelect = React.useCallback(
    (docId: string) => {
      if (disabled) return;
      if (isMany) {
        const current = Array.isArray(currentValue) ? (currentValue as string[]) : [];
        if (current.includes(docId)) {
          field.handleChange(current.filter((id) => id !== docId));
        } else {
          field.handleChange([...current, docId]);
        }
      } else {
        // Toggle: clicking the already-selected item deselects it
        if (String(currentValue) === docId) {
          field.handleChange(undefined);
        } else {
          field.handleChange(docId);
        }
        setOpen(false);
      }
    },
    [field, currentValue, isMany, disabled],
  );

  const handleRemove = React.useCallback(
    (docId: string) => {
      if (disabled) return;
      if (isMany) {
        const current = Array.isArray(currentValue) ? (currentValue as string[]) : [];
        field.handleChange(current.filter((id) => id !== docId));
      } else {
        field.handleChange(undefined);
      }
    },
    [field, currentValue, isMany, disabled],
  );

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {fieldDef.required && <span className="text-destructive ml-1">*</span>}
      </label>
      {fieldDef.admin?.description && (
        <p className="text-xs text-muted-foreground">{fieldDef.admin.description}</p>
      )}

      {/* Selected items (hasMany) */}
      {isMany && selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedLabels.map(({ id, label: itemLabel }) => (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
            >
              {itemLabel}
              <button
                type="button"
                onClick={() => handleRemove(id)}
                className="hover:text-destructive"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={(v) => { if (!disabled) setOpen(v); }}>
        <PopoverTrigger
          ref={triggerRef}
          disabled={disabled}
          className="inline-flex items-center justify-between w-full rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={selectedLabels.length > 0 && !isMany ? "" : "text-muted-foreground"}>
            {!isMany && selectedLabels.length > 0
              ? selectedLabels[0].label
              : `Select ${targetLabel}...`}
          </span>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" container={container}>
          {/* Search input */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder={useAsTitle ? `Search by ${useAsTitle}...` : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border px-2 py-1.5 text-sm bg-background"
              autoFocus
            />
          </div>

          {/* Document list */}
          <div
            ref={scrollRef}
            className="max-h-[240px] overflow-y-auto"
          >
            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground p-4 text-center">
                {listResult === undefined ? "Loading..." : "No documents found"}
              </p>
            ) : (
              documents.map((doc) => {
                const docId = String(doc._id);
                const isSelected = selectedIds.includes(docId);
                return (
                  <button
                    key={docId}
                    type="button"
                    onClick={() => handleSelect(docId)}
                    className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left ${
                      isSelected ? "bg-accent/50 font-medium" : ""
                    }`}
                  >
                    {isMany && (
                      <div
                        className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center ${
                          isSelected ? "bg-primary border-primary text-primary-foreground" : ""
                        }`}
                      >
                        {isSelected && <span className="text-[10px]">✓</span>}
                      </div>
                    )}
                    <span className="truncate">{getDocLabel(doc)}</span>
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
