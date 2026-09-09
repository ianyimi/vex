import { Button } from "../../ui";
import type { MediaCollectionConfig, UploadField } from "@vexcms/core";
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
 * Checks whether a file matches an HTML `accept` attribute pattern list —
 * mirrors the native `<input type="file" accept="...">` matching semantics
 * (comma-separated file extensions, MIME types, or `type/*` wildcards).
 *
 * @param file - The candidate file.
 * @param accept - The `accept` attribute value, e.g. `"image/*, .pdf"`.
 * @returns `true` when `accept` is empty or the file matches one of its patterns.
 */
function fileMatchesAccept(file: File, accept: string): boolean {
  const patterns = accept
    .split(",")
    .map((pattern) => pattern.trim().toLowerCase())
    .filter(Boolean);
  if (patterns.length === 0) return true;

  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  const mimeCategory = mimeType.split("/")[0];

  return patterns.some((pattern) => {
    if (pattern.startsWith(".")) {
      return fileName.endsWith(pattern);
    }
    if (pattern.endsWith("/*")) {
      return mimeCategory === pattern.slice(0, -2);
    }
    return mimeType === pattern;
  });
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
    <div className="grid grid-cols-2">
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
        className="self-center h-full"
        icon="Folder"
        disabled={readOnly}
      >
        Browse {targetCollectionConfig.labels.plural}
      </Button>
    </div>
  );
}
