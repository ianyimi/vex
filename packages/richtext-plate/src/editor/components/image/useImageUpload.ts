"use client";

import { useCallback } from "react";
import type {
  MediaCollectionSlug,
  VexEditorComponentProps,
} from "@vexcms/core";

interface UseImageUploadProps {
  mediaCollectionSlug?: MediaCollectionSlug;
  generateUploadUrl?: () => Promise<string>;
  createMediaDocument?: VexEditorComponentProps["createMediaDocument"];
}

/**
 * Result of a successful image upload — the stored URL and media document id.
 * Pixel dimensions are recorded on the media document itself, not here: an
 * inserted image renders at its own size until the user resizes it.
 */
export interface UploadResult {
  url: string;
  mediaId: string;
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image dimensions"));
    };
    img.src = url;
  });
}

/**
 * Hook that provides a function to upload an image file to the media collection.
 *
 * @param props - `mediaCollectionSlug` plus the upload URL / document creation
 *   callbacks used to perform the upload. `createMediaDocument` resolves
 *   `{ mediaId, url? }` — `url` is the stored file URL when the storage
 *   adapter can resolve it at creation time.
 * @returns `uploadFile` — the upload function, or `null` when
 *   `mediaCollectionSlug`, `generateUploadUrl`, and `createMediaDocument` are
 *   not all provided — and `isEnabled`, which reports whether uploads are
 *   configured.
 */
export function useImageUpload(props: UseImageUploadProps) {
  const { mediaCollectionSlug, generateUploadUrl, createMediaDocument } = props;

  const isEnabled = !!(
    mediaCollectionSlug &&
    generateUploadUrl &&
    createMediaDocument
  );

  const uploadFile = useCallback(
    async (file: File, options?: { alt?: string }): Promise<UploadResult> => {
      if (!mediaCollectionSlug || !generateUploadUrl || !createMediaDocument) {
        throw new Error("Media collection not configured");
      }

      const uploadUrl = await generateUploadUrl();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const { storageId } = (await uploadResponse.json()) as {
        storageId: string;
      };

      let width: number | undefined;
      let height: number | undefined;
      if (file.type.startsWith("image/")) {
        try {
          const dims = await getImageDimensions(file);
          width = dims.width;
          height = dims.height;
        } catch {
          // Non-critical — proceed without dimensions
        }
      }

      // `url` is the stored `src` the server computed at doc-creation time.
      const { mediaId, url } = await createMediaDocument({
        collectionSlug: mediaCollectionSlug,
        fields: {
          storageId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          // Absent (not "") when the user gave none: the adapter then falls
          // back to the filename, like the upload field's dropzone path.
          alt: options?.alt || undefined,
          width: width ?? 0,
          height: height ?? 0,
        },
      });

      // Blob URL only as a fallback for adapters that can't resolve a URL
      // synchronously — it does not survive a reload.
      return { url: url ?? URL.createObjectURL(file), mediaId };
    },
    [mediaCollectionSlug, generateUploadUrl, createMediaDocument],
  );

  return { uploadFile: isEnabled ? uploadFile : null, isEnabled };
}
