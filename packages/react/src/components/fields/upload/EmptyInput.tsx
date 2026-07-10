import { Button, Icon } from "../../ui";
import { MediaUploadDropzone } from "../../media/MediaUploadDropzone";
import type { StorageAdapterSlug } from "@vexcms/core";

/**
 * Props for UploadEmpty component.
 */
export interface UploadEmptyProps {
  /** Callback to open the media picker modal. */
  onPickerOpen: () => void;
  /** Callback when a file is uploaded via dropzone. */
  onFileUpload: (mediaId: string) => void;
  /** The media collection slug for the upload. */
  targetCollection: string;
  /** The storage adapter name. */
  adapterName: StorageAdapterSlug;
}

/**
 * Empty state for upload field — shows dropzone and "Browse media library" button.
 *
 * Matches the `UploadEmpty` design: dropzone with drag-active state + "Browse media library" ghost button below.
 *
 * @param props - Component props.
 */
export function UploadEmpty({
  onPickerOpen,
  onFileUpload,
  targetCollection,
  adapterName,
}: UploadEmptyProps) {
  return (
    <div className="flex flex-col gap-2">
      <MediaUploadDropzone
        targetCollection={targetCollection}
        adapterName={adapterName}
        onUploadComplete={onFileUpload}
      />
      <Button variant="ghost" size="sm" onClick={onPickerOpen} className="self-start">
        <Icon name="Folder" size={12} />
        Browse media library
      </Button>
    </div>
  );
}
