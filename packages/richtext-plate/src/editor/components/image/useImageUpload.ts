"use client";

import { useCallback } from "react";

interface UseImageUploadProps {
  mediaCollection?: string;
  generateUploadUrl?: () => Promise<string>;
  createMediaDocument?: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<string>;
}

export interface UploadResult {
  url: string;
  mediaId: string;
  alt?: string;
  width?: number;
  height?: number;
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
 * Returns { uploadFile: null, isEnabled: false } if media collection is not configured.
 */
export function useImageUpload(props: UseImageUploadProps) {
  const { mediaCollection, generateUploadUrl, createMediaDocument } = props;

  const isEnabled = !!(mediaCollection && generateUploadUrl && createMediaDocument);

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!mediaCollection || !generateUploadUrl || !createMediaDocument) {
        throw new Error("Media collection not configured");
      }

      // Get presigned upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the file
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const { storageId } = (await uploadResponse.json()) as { storageId: string };

      // Get image dimensions if it's an image
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

      // Create media document
      const documentId = await createMediaDocument({
        collectionSlug: mediaCollection,
        fields: {
          storageId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          url: "",
          alt: "",
          width: width ?? 0,
          height: height ?? 0,
        },
      });

      // The URL gets resolved server-side, but we can create a temporary
      // object URL for immediate display while the server URL resolves
      const tempUrl = URL.createObjectURL(file);

      return {
        url: tempUrl,
        mediaId: documentId,
        width,
        height,
      };
    },
    [mediaCollection, generateUploadUrl, createMediaDocument]
  );

  return { uploadFile: isEnabled ? uploadFile : null, isEnabled };
}
