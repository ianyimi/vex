"use client";

import { useState } from "react";
import { MediaUploadDropzone } from "./MediaUploadDropzone";
import type { StorageAdapterSlug } from "@vexcms/core";

/**
 * Props for the MediaPicker component.
 */
interface MediaPickerProps {
  /** The slug of the target media collection. */
  targetCollection: string;
  /** The adapter name — comes from the target media collection's `meta.storageAdapter`. */
  adapterName: StorageAdapterSlug;
  /** Callback invoked when a media file is selected. */
  onSelect: (mediaId: string) => void;
  /** Callback invoked when the picker is cancelled. */
  onCancel: () => void;
}

/**
 * Media picker popover — shows a grid of media files from the target collection.
 *
 * Allows selecting an existing file or uploading a new one directly.
 * Searches within one collection at a time — no cross-collection search.
 *
 * @param props — Media picker component props.
 */
export function MediaPicker(props: MediaPickerProps) {
  const [showUpload, setShowUpload] = useState(false);

  // TODO: Fetch media documents from the target collection via Convex query
  const mediaItems: { id: string; filename: string }[] = [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-lg w-[600px] max-h-[500px] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Select Media</h3>
          <button
            onClick={() => setShowUpload(true)}
            className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded"
          >
            Upload New
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {showUpload ? (
            <MediaUploadDropzone
              targetCollection={props.targetCollection}
              adapterName={props.adapterName}
              onUploadComplete={(id) => {
                props.onSelect(id);
                setShowUpload(false);
              }}
            />
          ) : mediaItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No media files yet. Click "Upload New" to add one.
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {mediaItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => props.onSelect(item.id)}
                  className="border rounded-md p-2 hover:border-primary transition-colors"
                >
                  <div className="bg-muted rounded w-full h-20 flex items-center justify-center text-xs">
                    📄
                  </div>
                  <p className="text-xs truncate mt-1">{item.filename}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button onClick={props.onCancel} className="text-sm px-3 py-1 border rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
