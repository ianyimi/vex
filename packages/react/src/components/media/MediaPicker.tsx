"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger, Button, Icon } from "../ui";
import { MediaLibraryGrid } from "./MediaLibaryGrid";
import { MediaCollectionSlug, UploadField } from "@vexcms/core";
import { TypedFieldApi } from "../form";
import { useVexConfig } from "../../context";
import { MediaUploadForm } from "./MediaUploadForm";

/**
 * Props for the MediaPicker component.
 */
interface MediaPickerProps {
  /** The slug of the target media collection. */
  targetCollection: MediaCollectionSlug;
  /** The field TypedFormApi object for interacting with the upload field's input value. */
  field: TypedFieldApi<string[]>;
  /** The UploadField of the field being uploaded to. */
  fieldDef: UploadField;
  /** Whether to allow multi-select (checkmarks on multiple items). */
  multi: boolean;
  /** Callback invoked when user selects items (single or multiple IDs). */
  onSelect: (mediaIds: string[]) => void;
  /** Callback invoked when the picker is cancelled. */
  onCancel: () => void;
}

/**
 * Media picker modal with tabbed UI (Library + Upload new).
 *
 * Uses shadcn/ui Tabs component (Base UI primitives) for ARIA-compliant tab navigation.
 *
 * Adapts behavior based on `multi`:
 * - Single-select (`multi === false`): checkmark on one item only, "Select" button.
 * - Multi-select (`multi === true`): checkmarks on multiple items, "N selected" + "Select" button.
 *
 * Matches the `MediaModalShell` design: modal header with icon + title + close, tabs, content area, footer.
 *
 * @param props — Media picker component props.
 */
export function MediaPicker({
  field,
  fieldDef,
  targetCollection,
  multi,
  onSelect,
  onCancel,
}: MediaPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(field.state.value ?? []);

  const config = useVexConfig();
  const collection = config.mediaCollections.find((mc) => mc.slug === targetCollection);
  if (!collection) {
    throw new Error(`Media collection "${targetCollection}" not found in config.`);
  }

  const handleSelect = () => {
    onSelect(selectedIds);
    setSelectedIds([]);
  };

  function handleUploadComplete(mediaIds: string[]) {
    onSelect(mediaIds);
    setSelectedIds([]);
  }

  function handleBackToLibrary() {}

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="vex-modal max-w-[760px]">
        <div className="vex-modal-head items-center pb-0">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Image" size={16} />
          </div>
          <div className="text">
            <h2>Select media</h2>
            <p className="sub">
              Relationship → <span className="mono">{targetCollection}</span> media collection
            </p>
          </div>
        </div>

        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger
              value="library"
              render={
                <Button variant="ghost" icon="Folder">
                  Library
                </Button>
              }
            />
            <TabsTrigger
              value="upload"
              render={
                <Button variant="ghost" icon="Plus">
                  Upload New
                </Button>
              }
            />
          </TabsList>

          <TabsContent value="library" className="mt-0">
            <MediaLibraryGrid
              fieldName={field.name}
              targetCollection={targetCollection}
              multi={multi}
              onSelect={setSelectedIds}
              selectedIds={selectedIds}
            />
            <div className="vex-modal-foot">
              <span className="left">
                {selectedIds.length} {multi || selectedIds.length === 0 ? "selected" : "selected"}
              </span>
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSelect} disabled={selectedIds.length === 0}>
                {multi && selectedIds.length > 1 ? `Select ${selectedIds.length}` : "Select"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <MediaUploadForm
              fieldDef={fieldDef}
              collection={collection}
              multi={fieldDef.hasMany}
              adapterName={collection.meta.storageAdapter}
              onComplete={handleUploadComplete}
              onCancel={handleBackToLibrary}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
