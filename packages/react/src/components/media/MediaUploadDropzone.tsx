"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone"; // or custom implementation
import { StorageAdapterSlug, vexConvexApi } from "@vexcms/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { useStorageAdapterMap } from "../../context";

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
 * Batch upload: multiple files are uploaded in parallel via `Promise.all` on
 * single-file upload calls.
 *
 * @param props — Dropzone component props.
 */
export function MediaUploadDropzone(props: MediaUploadDropzoneProps) {
  const queryClient = useQueryClient();

  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });

  const { mutateAsync: createMediaDocument } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.createMediaDocument),
  });

  const storageAdapterMap = useStorageAdapterMap();
  const uploadFile = useCallback(
    async (file: File) => {
      const adapterUploadFile = storageAdapterMap[props.adapterName];

      if (!adapterUploadFile) {
        throw new Error(`Storage adapter "${props.adapterName}" not found in context`);
      }

      // 1. Get upload URL from adapter
      const { url } = await generateUploadUrl({ adapter: props.adapterName });

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

      // 4. Invalidate media collection query
      queryClient.invalidateQueries({
        queryKey: ["media", props.targetCollection],
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
      // Batch upload: Promise.all on single-file upload
      const uploadPromises = acceptedFiles.map(async (file) => {
        const mediaId = await uploadFile(file);
        return mediaId;
      });

      const results = await Promise.all(uploadPromises);
      // For single-file dropzone, call onUploadComplete with the first result
      if (results.length > 0) {
        props.onUploadComplete(results[0]);
      }
    },
    [props.targetCollection, props.onUploadComplete, uploadFile],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
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
