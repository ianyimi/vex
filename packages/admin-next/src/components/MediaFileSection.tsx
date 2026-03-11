"use client";

import type { UseUrlToFileReturn } from "../hooks/useUrlToFile";
import { FilePreview, UploadDropzone, Input, Label } from "@vexcms/ui";
import { AlertCircle, Loader2 } from "lucide-react";

interface FileMetadata {
  filename: string;
  mimeType: string;
  size: number;
  url: string;
}

interface MediaFileSectionProps {
  /** Current file metadata (existing document or newly selected file) */
  currentFile: FileMetadata | null;
  /** Whether a new file has been staged (not yet uploaded) */
  hasPendingFile: boolean;
  /** The staged File object for upload (from file input) */
  pendingFile: File | null;
  /** Local preview URL for the pending file (from URL.createObjectURL) */
  pendingPreviewUrl?: string | null;
  /** Metadata for pending file (from either dropzone or URL fetch) */
  pendingMetadata?: { filename: string; mimeType: string; size: number } | null;
  /** Set the pending file (from UploadDropzone) */
  onFileSelect: (file: File) => void;
  /** Clear the pending file */
  onClearPendingFile: () => void;
  /** URL-to-file hook return */
  urlToFile: UseUrlToFileReturn;
  /** Accepted MIME types */
  accept?: string[];
  /** Max file size in bytes */
  maxSize?: number;
  /** Whether inputs are disabled (e.g., during save) */
  disabled?: boolean;
  /** Layout mode */
  layout: "stacked" | "side-by-side";
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function MediaFileSection(props: MediaFileSectionProps) {
  // Determine what to display
  const displayMeta = props.pendingMetadata ??
    (props.urlToFile.result
      ? {
          filename: props.urlToFile.result.filename,
          mimeType: props.urlToFile.result.mimeType,
          size: props.urlToFile.result.size,
        }
      : null) ??
    (props.currentFile
      ? {
          filename: props.currentFile.filename,
          mimeType: props.currentFile.mimeType,
          size: props.currentFile.size,
        }
      : null);

  const displayUrl = props.currentFile?.url ?? "";
  const previewUrl = props.pendingPreviewUrl ?? props.currentFile?.url ?? null;
  const previewMimeType = displayMeta?.mimeType ?? "application/octet-stream";

  const inputSection = (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label>Import from URL</Label>
        <div className="relative">
          <Input
            value={props.urlToFile.url}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              props.urlToFile.setUrl(e.target.value)
            }
            placeholder="Paste a URL..."
            disabled={props.disabled || !!props.pendingFile}
          />
          {props.urlToFile.isFetching && (
            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {props.urlToFile.error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle size={14} /> {props.urlToFile.error}
          </p>
        )}
      </div>

      {!props.urlToFile.url && !props.urlToFile.result && (
        <>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 border-t" />
            <span>or</span>
            <div className="flex-1 border-t" />
          </div>
          <UploadDropzone
            accept={props.accept}
            maxSize={props.maxSize}
            onFileSelect={props.onFileSelect}
            selectedFile={props.pendingFile}
            onClear={props.onClearPendingFile}
            disabled={props.disabled}
          />
        </>
      )}
    </div>
  );

  const metaSection = displayMeta ? (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <FilePreview
          url={previewUrl}
          mimeType={previewMimeType}
          alt={displayMeta.filename}
          size={64}
        />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div>
            <Label className="text-xs text-muted-foreground">Type</Label>
            <Input value={displayMeta.mimeType} readOnly className="h-8 text-sm" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Size</Label>
            <Input
              value={formatBytes(displayMeta.size)}
              readOnly
              className="h-8 text-sm"
            />
          </div>
          {displayUrl && (
            <div>
              <Label className="text-xs text-muted-foreground">URL</Label>
              <Input
                value={displayUrl}
                readOnly
                className="h-8 text-sm font-mono text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  if (props.layout === "side-by-side") {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div>{metaSection}</div>
        <div>{inputSection}</div>
      </div>
    );
  }

  // Stacked layout
  return (
    <div className="space-y-4">
      {inputSection}
      {metaSection}
    </div>
  );
}

export { MediaFileSection, type MediaFileSectionProps, type FileMetadata };
