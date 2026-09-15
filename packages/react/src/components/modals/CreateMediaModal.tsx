"use client";

import { useRef } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";
import type { MediaCollectionSlug, StorageAdapterSlug } from "@vexcms/core";
import { Button, DialogClose, DialogContent, DialogFooter, DialogHeader } from "../ui";
import { Modal } from "./BaseModal";
import { MODALS } from "./constants";
import { MediaUploadDropzone } from "../media";
import { useVexConfig } from "../../context";

/**
 * Modal for uploading media into a media collection.
 *
 * The media counterpart to {@link CreateDocumentModal}. Instead of rendering
 * field inputs, it hosts a {@link MediaUploadDropzone} that uploads files via
 * the collection's storage adapter (`generateUploadUrl` → POST → create media
 * document). Opens when `?upload=true` is in the URL (see `MODALS.uploadMedia`).
 *
 * The underlying list query is a live Convex subscription, so newly uploaded
 * media appears in the table automatically — this modal only closes itself once
 * an upload completes.
 *
 * @param props - Component props.
 * @param props.collection - The slug of the media collection uploads are created in.
 * @returns A URL-state-driven `<Modal>` containing the upload dropzone, or `null`
 *   when `collection` does not resolve against the current config.
 * @throws Never — resolution failure renders `null` instead of throwing.
 */
export function CreateMediaModal(props: { collection: MediaCollectionSlug }) {
  const config = useVexConfig();
  const collection = config.mediaCollections.find((c) => c.slug === props.collection);

  if (!collection) {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(MODALS.uploadMedia.urlParam, parseAsBoolean);

  // The adapter that owns this media collection (set during config resolution).
  const adapterName: StorageAdapterSlug = collection.meta?.storageAdapter ?? "convex";

  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Modal urlParam={MODALS.uploadMedia.urlParam}>
      <DialogContent ref={dialogRef} initialFocus={dialogRef} className="flex w-full flex-col sm:w-[50svw]">
        <DialogHeader className="px-2 pb-4">Upload {collection.labels.singular}</DialogHeader>
        <div className="px-2">
          <MediaUploadDropzone
            targetCollection={collection.slug}
            adapterName={adapterName}
            onUploadComplete={() => {
              void setOpen(null);
            }}
          />
        </div>
        <DialogFooter className="p-1">
          <DialogClose render={<Button variant="outline">Done</Button>} />
        </DialogFooter>
      </DialogContent>
    </Modal>
  );
}
