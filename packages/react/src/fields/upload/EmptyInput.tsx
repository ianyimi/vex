import { Button } from "../../ui";
import type { MediaCollectionConfig, UploadField } from "@vexcms/core";
import { fileMatchesAccept } from "./utils";
import { useCallback } from "react";

/**
 * Props for UploadEmpty component.
 */
export interface UploadEmptyProps {
  /** The field's name — applied as the dropzone input's `id` so the `FormLabel` (`htmlFor={name}`) associates with it. */
  name: string;
  /** Callback to open the media picker modal. */
  onPickerOpen: () => void;
  /** Callback when files are selected via dropzone (NOT uploaded yet). */
  onFilesSelected: (files: File[]) => Promise<void>;
  /** The UploadField of the field being uploaded to. */
  fieldDef: UploadField;
  /** The media collection slug for the upload. */
  targetCollectionConfig: MediaCollectionConfig;
  /** Whether the field is read-only. */
  readOnly?: boolean;
  /** Called when the dropzone input loses focus — wired to `field.handleBlur`. */
  onBlur?: () => void;
}

/**
 * Empty state for upload field — shows dropzone and "Browse media library" button.
 *
 * Matches the `UploadEmpty` design: dropzone with drag-active state + "Browse media library" ghost button below.
 *
 * @param props - Component props.
 * @returns The dropzone + "Browse media library" button UI.
 */
export function UploadEmpty({
  name,
  onPickerOpen,
  onFilesSelected,
  fieldDef,
  targetCollectionConfig,
  readOnly,
  onBlur,
}: UploadEmptyProps) {
  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (readOnly) return;

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        fileMatchesAccept(file, fieldDef.accept),
      );
      if (files.length > 0) {
        await onFilesSelected(files);
      }
    },
    [fieldDef.accept, onFilesSelected, readOnly],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
    },
    [onFilesSelected],
  );

  return (
    <div className="grid grid-cols-1 gap-2 @lg/form:grid-cols-2 @lg/form:gap-0">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-input 
          p-8 text-center transition-colors hover:border-primary"
      >
        <input
          id={name}
          type="file"
          multiple={fieldDef.hasMany}
          onChange={handleFileInput}
          onBlur={onBlur}
          className="absolute inset-0 cursor-pointer opacity-0"
          disabled={readOnly}
          accept={fieldDef.accept}
          aria-required={fieldDef.required}
          aria-labelledby={`${name}-label`}
        />
        <div className="pointer-events-none space-y-2">
          <div className="text-muted-foreground">
            <p className="text-sm">Drop files here or click to browse</p>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onPickerOpen}
        className="h-full justify-self-start @lg/form:self-center @lg/form:justify-self-auto"
        icon="Folder"
        disabled={readOnly}
      >
        Browse {targetCollectionConfig.labels.plural}
      </Button>
    </div>
  );
}
