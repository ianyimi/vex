"use client";

import * as React from "react";
import type { UploadFieldDef } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Label } from "../../ui/label";
import { MediaPicker, type MediaDocument } from "../../ui/media-picker";
import { FilePreview } from "../../ui/file-preview";

interface UploadFieldProps {
  field: any;
  fieldDef: UploadFieldDef;
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
  /** Whether initial results are loading */
  isLoading: boolean;
  /** Whether a search query is in-flight */
  isSearching?: boolean;
  /** Called to open the upload modal */
  onUploadNew: () => void;
  /** The currently selected media document (for display) */
  selectedMedia?: MediaDocument | null;
  /** Href to the media document edit view. When provided, the preview is clickable. */
  mediaEditHref?: string;
  /** Link component for client-side navigation (e.g., Next.js Link). */
  linkComponent?: React.ComponentType<{
    href: string;
    className?: string;
    children: React.ReactNode;
  }>;
}

function UploadField({
  field,
  fieldDef,
  name,
  mediaResults,
  searchTerm,
  onSearchChange,
  canLoadMore,
  onLoadMore,
  isLoading,
  isSearching,
  onUploadNew,
  selectedMedia,
  mediaEditHref,
  linkComponent: LinkComponent,
}: UploadFieldProps) {
  const label = (fieldDef.hasMany ? fieldDef.labels?.singular : fieldDef.label) ?? toTitleCase(name);
  const description = fieldDef.admin?.description ?? fieldDef.description;
  const errors: unknown[] = field.state.meta.errors ?? [];

  // Track popover open state so we can disable the preview Link while open.
  // Base UI's popover dismisses on pointerdown, but the click event from that
  // same interaction can propagate to the Link — causing unintended navigation.
  // Disabling pointer-events on the Link while the popover is open prevents this entirely.
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const handlePickerOpenChange = React.useCallback((open: boolean) => {
    setPickerOpen(open);
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {fieldDef.required && <span className="text-destructive ml-1">*</span>}
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
        isSearching={isSearching}
        onUploadNew={onUploadNew}
        disabled={fieldDef.admin?.readOnly}
        selectedLabel={selectedMedia?.filename}
        onOpenChange={handlePickerOpenChange}
      />

      {selectedMedia && (() => {
        const preview = (
          <div className="flex items-center gap-2 text-sm group">
            <FilePreview
              url={selectedMedia.url}
              mimeType={selectedMedia.mimeType}
              alt={selectedMedia.alt || selectedMedia.filename}
              size={40}
            />
            <span className={mediaEditHref ? "text-primary underline-offset-4 group-hover:underline" : "text-muted-foreground"}>
              {selectedMedia.filename}
            </span>
          </div>
        );

        if (mediaEditHref) {
          const Link = LinkComponent ?? "a";
          return (
            <Link
              href={mediaEditHref}
              className={pickerOpen ? "pointer-events-none" : undefined}
            >
              {preview}
            </Link>
          );
        }
        return preview;
      })()}

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
