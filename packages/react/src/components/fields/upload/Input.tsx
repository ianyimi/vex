"use client";

import { useState } from "react";
import type { StorageAdapterSlug, UploadField } from "@vexcms/core";
import { createFieldInput } from "../../form";
import { MediaUploadDropzone, MediaPicker } from "../../media";
import { useVexConfig } from "../../../context";

/**
 * Upload field input — supports drag-and-drop upload and media library picker.
 *
 * Empty state: shows a dropzone + "Browse media library" button.
 * Filled state: shows thumbnail + "Change" button that opens the picker.
 *
 * Reads the adapter name from the target media collection's meta.storageAdapter
 * and passes it to MediaUploadDropzone and MediaPicker.
 *
 * @param props — Field input component props.
 * @returns The upload field input element.
 */
export const UploadFieldInput = createFieldInput<string | undefined, UploadField>(
  ({ fieldDef, field, readOnly }) => {
    const [showPicker, setShowPicker] = useState(false);
    const value = field.state.value;
    const config = useVexConfig();

    // Get adapter name from the target media collection's meta.storageAdapter
    const adapterName: StorageAdapterSlug =
      config.mediaCollections.find((mc) => mc.slug === fieldDef.to)?.meta?.storageAdapter ??
      "convex";

    if (readOnly) {
      return value ? (
        <div className="text-sm text-muted-foreground">{value}</div>
      ) : (
        <div className="text-sm text-muted-foreground">—</div>
      );
    }

    return (
      <div className="space-y-2">
        {value ? (
          <div className="flex items-center gap-3">
            <div className="bg-muted rounded-md w-16 h-16 flex items-center justify-center text-xs text-muted-foreground">
              {value.slice(0, 8)}...
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="text-sm text-primary hover:underline"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => field.handleChange(undefined)}
                className="text-sm text-destructive hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <MediaUploadDropzone
              targetCollection={fieldDef.to}
              adapterName={adapterName}
              onUploadComplete={(mediaId) => field.handleChange(mediaId)}
            />
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="text-sm text-primary hover:underline"
            >
              Browse media library
            </button>
          </div>
        )}
        {showPicker && (
          <MediaPicker
            targetCollection={fieldDef.to}
            adapterName={adapterName}
            onSelect={(mediaId) => {
              field.handleChange(mediaId);
              setShowPicker(false);
            }}
            onCancel={() => setShowPicker(false)}
          />
        )}
      </div>
    );
  },
);
