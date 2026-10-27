"use client";

import { useRef, useState } from "react";
import { DialogContent, DialogHeader } from "../ui";
import { Modal } from "../modals/BaseModal";
import { type CollectionSlug } from "@vexcms/core";
import { MODALS } from "../modals/constants";
import { CreateDocumentForm } from "./CreateDocumentForm";
import { useVexConfig } from "../config/VexConfigContext";
import { parseAsBoolean, useQueryState } from "nuqs";

/**
 * Modal for creating a new document in a collection.
 *
 * Opens when `?createNew=true` is in the URL (see `MODALS.createDocument`).
 * Renders `CreateDocumentForm`, closing by clearing the URL param on both
 * create and cancel.
 *
 * @param props - Component props.
 * @param props.collection - The slug of the collection the new document will be created in.
 * @returns A URL-state-driven `<Modal>` containing the creation form, or `null`
 *   when `collection` does not resolve against the current config.
 * @throws Never — resolution failure renders `null` instead of throwing.
 */
export function CreateDocumentModal(props: {
  collection: CollectionSlug;
  fieldsMode?: "required" | "all";
  initialValues?: Record<string, unknown>;
  submitOnOpen?: boolean;
}) {
  const config = useVexConfig();
  const collection = config.collections.find(
    (c) => c.slug === props.collection,
  );

  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(
    MODALS.createDocument.urlParam,
    parseAsBoolean,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  if (!collection) {
    return null;
  }

  return (
    <Modal
      urlParam={MODALS.createDocument.urlParam}
      dismissible={!isSubmitting}
    >
      <DialogContent
        ref={dialogRef}
        initialFocus={dialogRef}
        className="flex h-[80svh] w-full flex-col sm:h-[50svh] sm:w-[50svw]"
      >
        <DialogHeader className="px-2 pb-4">
          Create {collection.labels.singular}
        </DialogHeader>
        <CreateDocumentForm
          collection={collection}
          fieldsMode={props.fieldsMode}
          initialValues={props.initialValues}
          submitOnOpen={props.submitOnOpen}
          onCreated={() => setOpen(null)}
          onCancel={() => setOpen(null)}
          onSubmittingChange={setIsSubmitting}
        />
      </DialogContent>
    </Modal>
  );
}
