"use client";

import { useState } from "react";
import type { MediaCollectionConfig, UploadField } from "@vexcms/core";
import { Button, Dialog, DialogContent, Tabs, TabsContent, TabsList, TabsTrigger, Icon } from "../../ui";
import { MediaLibraryGrid } from "../../media/MediaLibraryGrid";
import { MediaUploadForm } from "../../media/MediaUploadForm";

/** Props for {@link UploadFilterPicker}. */
export interface UploadFilterPickerProps {
  /** The resolved upload field definition. */
  fieldDef: UploadField;
  /** The target media collection documents are picked from or uploaded to. */
  targetCollection: MediaCollectionConfig;
  /** The field's current value when the picker opened. */
  selectedId: string | undefined;
  /** Called with the confirmed single selection when the picker commits. */
  onSelect: (id: string | undefined) => void;
  /** Called when the picker is dismissed without committing. */
  onCancel: () => void;
}

/**
 * Standalone single-select media picker dialog for an `upload` field
 * filter row — `media/MediaPicker.tsx` itself is NOT
 * reusable here: its `field` prop is a live TanStack Form field-API
 * object, not a plain value/callback pair (confirmed by reading its
 * props, `field: AnyFieldApi`, used only to seed its own local
 * `selectedIds` state). This component reuses `MediaPicker`'s own
 * internal document-grid (`MediaLibraryGrid`) and upload-dropzone
 * (`MediaUploadForm`) PIECES — both already fully decoupled from the
 * form API — in the SAME Dialog/Tabs composition `MediaPicker` uses, the
 * same "reuse the pieces, not the form-coupled shell" pattern `ListViewPeek`
 * used for its own copy button vs. `ListViewCopyLinkButton`'s toast
 * convention. `RelationshipPickerProps`-shaped (`{ targetCollection,
 * selectedId, onSelect, onCancel }`, plus `fieldDef` like that picker
 * also carries) so `upload/FilterInput.tsx` mirrors
 * `relationship/FilterInput.tsx`'s own shape exactly.
 *
 * @param props - Component props.
 * @returns The tabbed modal dialog (Library + Upload tabs), single-select only.
 */
export function UploadFilterPicker(props: UploadFilterPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(props.selectedId ? [props.selectedId] : []);
  const [activeTab, setActiveTab] = useState<"library" | "upload">("library");

  function handleSelect() {
    props.onSelect(selectedIds[0]);
  }

  function handleUploadComplete(mediaIds: string[]) {
    props.onSelect(mediaIds[0]);
  }

  function handleBackToLibrary() {
    setActiveTab("library");
  }

  return (
    <Dialog open onOpenChange={props.onCancel}>
      <DialogContent className="w-[90svw] !max-w-6xl">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 flex-none items-center justify-center rounded bg-accent text-accent-foreground">
            <Icon name="Image" size={20} />
          </div>
          <div className="text">
            <h1 className="font-mono">
              Select {props.targetCollection.labels.singular} —{" "}
              <b className="text-primary">{props.fieldDef.label}</b>
            </h1>
            <p className="text-xs">Choose from the list below, or upload more</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "library" | "upload")}>
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
                  Upload
                </Button>
              }
            />
          </TabsList>

          <TabsContent value="library">
            <MediaLibraryGrid
              targetCollectionConfig={props.targetCollection}
              multi={false}
              onSelect={setSelectedIds}
              selectedIds={selectedIds}
              accept={props.fieldDef.accept}
            />
            <div className="flex items-center justify-between pt-4">
              <p className="pt-2">{selectedIds.length === 1 ? "1 item" : "0 items"} selected</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={props.onCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSelect} disabled={selectedIds.length === 0}>
                  Select
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-0">
            <MediaUploadForm
              fieldDef={props.fieldDef}
              collectionConfig={props.targetCollection}
              multi={false}
              onComplete={handleUploadComplete}
              onCancel={handleBackToLibrary}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
