"use client";

import { useCallback } from "react";
import { useDropzone, type Accept } from "react-dropzone"; // or custom implementation
import { StorageAdapterSlug, vexConvexApi } from "@vexcms/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { useStorageAdapterMap } from "../../context";
import { useVexMutation } from "../../hooks";

/**
 * MIME types this dropzone accepts, keyed the way react-dropzone's `useDropzone({ accept })`
 * option requires (`Record<mimeType, extension[]>`; extensions are unused here, only the
 * key is matched). `@vexcms/core`'s `MediaCollectionConfig` carries no per-collection
 * accepted-types setting today — unlike `UploadField.accept` at the field level
 * (`fields/upload/Input.tsx`) — so this is a fixed safe-media allowlist covering the
 * categories a real upload actually produces, plus the browser's generic "unknown binary"
 * fallback (`application/octet-stream`), which every legitimate large/opaque upload can
 * carry when the browser can't infer a specific type.
 */
const MEDIA_UPLOAD_ACCEPT: Accept = {
  "image/*": [],
  "video/*": [],
  "audio/*": [],
  "application/pdf": [],
  "application/octet-stream": [],
};

/**
 * Props for the MediaUploadDropzone component.
 */
interface MediaUploadDropzoneProps {
  /** The slug of the target media collection. */
  targetCollection: string;
  /** The adapter name — comes from the target media collection's `meta.storageAdapter`. */
  adapterName: StorageAdapterSlug;
  /** Callback invoked when a file upload completes. Receives the new media document ID. */
  onUploadComplete: (mediaId: string) => void;
}

/**
 * File upload dropzone — handles drag-and-drop and click-to-upload.
 *
 * Uploads files to the target media collection via vexConvexApi.media.*.
 * Uses the adapter's generateUploadUrl() to get a presigned URL, POSTs the file,
 * then calls createMediaDocument() to create the media document.
 *
 * Single-file: only the first dropped/selected file is uploaded, matching
 * `fields/upload/EmptyInput.tsx`'s single-select `slice(0, 1)` truncation.
 *
 * @param props — Dropzone component props.
 * @returns The drag-and-drop / click-to-upload dropzone element.
 */
export function MediaUploadDropzone(props: MediaUploadDropzoneProps) {
  const queryClient = useQueryClient();

  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });

  // Only this one is migrated: `generateUploadUrl` mints a signed URL and
  // writes no document, so there is nothing for it to purge.
  const { mutateAsync: createMediaDocument } = useVexMutation({
    collection: props.targetCollection,
    getChanges: ({ args, result }) => [{ after: { ...args, _id: result } }],
    mutationFn: vexConvexApi.media.createMediaDocument,
    operation: "create",
  });

  const storageAdapterMap = useStorageAdapterMap();
  const uploadFile = useCallback(
    async (file: File) => {
      const adapterUploadFile = storageAdapterMap[props.adapterName];

      if (!adapterUploadFile) {
        throw new Error(`Storage adapter "${props.adapterName}" not found in context`);
      }

      // 1. Get upload URL from adapter
      const { url } = await generateUploadUrl({
        adapter: props.adapterName,
        collection: props.targetCollection,
      });

      const { storageId } = await adapterUploadFile(file, url);

      // 3. Create media document
      const mediaId = await createMediaDocument({
        adapter: props.adapterName,
        collectionSlug: props.targetCollection,
        storageId, // Adapter-specific storage ID
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        alt: file.name,
      });

      return mediaId;
    },
    [
      props.adapterName,
      props.targetCollection,
      generateUploadUrl,
      createMediaDocument,
      queryClient,
    ],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      // Single-file dropzone: `useDropzone`'s own `multiple`/`maxFiles` gate
      // can only accept-or-reject an ENTIRE drop, never keep a subset of it —
      // verified against react-dropzone@15.0.0's `setFiles`, which empties
      // `acceptedFiles` outright once the count exceeds what's allowed. A
      // same-batch multi-file drop is therefore truncated to the first file
      // here instead, matching `fields/upload/EmptyInput.tsx`'s
      // `files.slice(0, 1)`.
      const [file] = acceptedFiles;
      if (!file) return;

      const mediaId = await uploadFile(file);
      props.onUploadComplete(mediaId);
    },
    [props.onUploadComplete, uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // `multiple: true` so react-dropzone's own count gate never fires and
    // discards every dropped file before `onDrop` runs — `onDrop` above does
    // the actual "keep only the first file" truncation. `accept` still
    // filters by MIME type independently of `multiple`.
    multiple: true,
    accept: MEDIA_UPLOAD_ACCEPT,
  });

  return (
    <div
      {...getRootProps()}
      className="border-2 border-dashed border-muted-foreground/25 rounded-md p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-sm text-muted-foreground">Drop the file here...</p>
      ) : (
        <p className="text-sm text-muted-foreground">📁 Drop file here or click to upload</p>
      )}
    </div>
  );
}
