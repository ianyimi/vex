"use client";

import type { UploadFieldMeta } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Label } from "../../ui/label";
import { MediaPicker, type MediaDocument } from "../../ui/media-picker";

interface UploadFieldProps {
  field: any;
  meta: UploadFieldMeta;
  name: string;
  /** Paginated media documents from useMediaPicker */
  mediaResults: MediaDocument[];
  /** Search term for the media picker */
  searchTerm: string;
  /** Search term setter */
  onSearchChange: (term: string) => void;
  /** Whether more results can be loaded */
  canLoadMore: boolean;
  /** Load more results */
  onLoadMore: () => void;
  /** Whether results are loading */
  isLoading: boolean;
  /** Called to open the upload modal */
  onUploadNew: () => void;
  /** The currently selected media document (for display) */
  selectedMedia?: MediaDocument | null;
}

function UploadField({
  field,
  meta,
  name,
  mediaResults,
  searchTerm,
  onSearchChange,
  canLoadMore,
  onLoadMore,
  isLoading,
  onUploadNew,
  selectedMedia,
}: UploadFieldProps) {
  const label = meta.label ?? toTitleCase(name);
  const description = meta.admin?.description ?? meta.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {meta.required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <MediaPicker
        value={field.state.value as string | null}
        onSelect={(id) => field.handleChange(id)}
        results={mediaResults}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        canLoadMore={canLoadMore}
        onLoadMore={onLoadMore}
        isLoading={isLoading}
        onUploadNew={onUploadNew}
        disabled={meta.admin?.readOnly}
        selectedLabel={selectedMedia?.filename}
      />

      {selectedMedia && (
        <div className="flex items-center gap-2 text-sm">
          {selectedMedia.mimeType.startsWith("image/") && (
            <img
              src={selectedMedia.url}
              alt={selectedMedia.alt || ""}
              className="h-10 w-10 rounded object-cover"
            />
          )}
          <span className="text-muted-foreground">
            {selectedMedia.filename}
          </span>
        </div>
      )}

      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {errors.length > 0 && (
        <div>
          {errors.map((error: unknown, i: number) => (
            <p key={i} className="text-xs text-destructive">
              {typeof error === "string"
                ? error
                : ((error as any)?.message ?? String(error))}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export { UploadField };
