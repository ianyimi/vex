"use client";

import { useState } from "react";
import type { CollectionConfig, RelationshipField } from "@vexcms/core";
import {
  Button,
  Dialog,
  DialogContent,
  Icon,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../ui";
import { RelationshipDocumentList } from "./RelationshipDocumentList";
import { CreateDocumentForm } from "../../collections/CreateDocumentForm";

/**
 * Props for {@link RelationshipPicker}.
 */
export interface RelationshipPickerProps {
  /** The resolved relationship field definition. */
  fieldDef: RelationshipField;
  /** The target collection documents are picked from or created in. */
  targetCollection: CollectionConfig;
  /** The field's current value when the picker opened. */
  selectedIds: string[];
  /** Whether draft target documents are visible. */
  drafts: boolean;
  /** Which tab opens first. @defaultValue "select" */
  defaultTab?: "select" | "create";
  /** Called with the confirmed selection when the picker commits. */
  onSelect: (ids: string[]) => void;
  /** Called when the picker is dismissed without committing. */
  onCancel: () => void;
}

/**
 * Relationship field picker dialog — Select (search + paginated list) and
 * Create (a standalone create form) tabs.
 *
 * Selection is held locally until "Select" is clicked, so navigating between
 * tabs never loses in-progress picks. Creating a document while `hasMany` is
 * true auto-selects it and returns to the Select tab instead of closing;
 * single-select calls `onSelect` immediately (Decision 9 — a created document
 * is auto-selected). The dialog refuses to close (Escape/backdrop/Cancel)
 * while `CreateDocumentForm` reports an in-flight submit via
 * `onSubmittingChange`, same guard `CreateDocumentModal` applies.
 *
 * @param props - Component props.
 * @returns A `Dialog` with Select/Create tabs.
 */
export function RelationshipPicker({
  fieldDef,
  targetCollection,
  selectedIds: initialSelectedIds,
  drafts,
  defaultTab = "select",
  onSelect,
  onCancel,
}: RelationshipPickerProps) {
  const [activeTab, setActiveTab] = useState<"select" | "create">(defaultTab);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const label = fieldDef.hasMany
    ? targetCollection.labels.plural
    : targetCollection.labels.singular;

  function handleCreated(id: string) {
    if (fieldDef.hasMany) {
      setSelectedIds((current) => [...current, id]);
      setActiveTab("select");
    } else {
      onSelect([id]);
    }
  }

  function handleCancel() {
    if (isSubmitting) return;
    onCancel();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="w-[90svw] !max-w-4xl">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Link" size={20} />
          </div>
          <div className="text">
            <h1 className="font-mono">
              Select {label} - <b className="text-primary">{fieldDef.label}</b>
            </h1>
            <p className="text-xs">
              Choose from the list below, or create a new one
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "select" | "create")}
        >
          <TabsList>
            <TabsTrigger
              value="select"
              render={
                <Button variant="ghost" icon="Search">
                  Select
                </Button>
              }
            />
            <TabsTrigger
              value="create"
              render={
                <Button variant="ghost" icon="Plus">
                  Create
                </Button>
              }
            />
          </TabsList>

          <TabsContent value="select">
            <RelationshipDocumentList
              fieldDef={fieldDef}
              targetCollection={targetCollection}
              selectedIds={selectedIds}
              drafts={drafts}
              onSelectionChange={setSelectedIds}
            />
            <div className="flex items-center justify-between pt-4">
              <p className="pt-2 text-xs text-muted-foreground">
                {selectedIds.length} selected
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button onClick={() => onSelect(selectedIds)}>
                  {fieldDef.hasMany && selectedIds.length > 1
                    ? `Select ${selectedIds.length}`
                    : "Select"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="create" className="mt-0">
            <CreateDocumentForm
              collection={targetCollection}
              onCreated={handleCreated}
              onCancel={handleCancel}
              onSubmittingChange={setIsSubmitting}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
