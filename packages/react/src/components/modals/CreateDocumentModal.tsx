"use client";

import { useRef, useState } from "react";
import { Button, DialogClose, DialogContent, DialogFooter, DialogHeader } from "../ui";
import { Modal } from "./BaseModal";
import { type CollectionSlug } from "@vexcms/core";
import { MODALS } from "./constants";
import { AppForm } from "../form";
import { useCollectionForm } from "../../hooks/useCollectionForm";
import { useVexMutation } from "../../hooks";
import { useVexConfig } from "../../context/VexConfigContext";
import { RenderFieldInputComponents } from "../fields";
import { vexConvexApi } from "@vexcms/core";
import { parseAsBoolean, useQueryState } from "nuqs";

/**
 * Modal for creating a new document in a collection.
 *
 * Opens when `?createNew=true` is in the URL (see `MODALS.createDocument`).
 * Builds a TanStack Form instance via `useCollectionForm`, renders only the
 * collection's required fields with `<RenderFieldInputComponents>` — a quick
 * create; non-required fields keep their configured defaults and are filled
 * in later from the edit view — and calls the Convex `create` mutation on
 * submit. Closes by clearing the URL param.
 *
 * @param props - Component props.
 * @param props.collection - The slug of the collection the new document will be created in.
 * @returns A URL-state-driven `<Modal>` containing the creation form, or `null`
 *   when `collection` does not resolve against the current config.
 * @throws Never — resolution failure renders `null` instead of throwing.
 */
export function CreateDocumentModal(props: { collection: CollectionSlug }) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collection);

  if (!collection) {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(MODALS.createDocument.urlParam, parseAsBoolean);

  // Guards the window between a submit attempt and `useVexMutation`'s
  // `isPending`, which only flips true *after* TanStack Form's async field
  // validation resolves (BUGS-REPORT MODAL-1/MODAL-2). `isSubmittingRef` is
  // read synchronously inside the capture-phase submit handler below — two
  // `submit` events fired back-to-back never get a React re-render in
  // between, so a `disabled`/`dismissible` prop driven only by state cannot
  // stop the second one. `isSubmitting` mirrors the ref into render so the
  // submit button and the modal's dismissibility can react to it.
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endSubmit = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
  };

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    // A create has no prior state; `result` is the new document's id, which the
    // submitted values alone cannot supply.
    getChanges: ({ args, result }) => [{ after: { ...args.data, _id: result } }],
    mutationFn: vexConvexApi.create,
    operation: "create",
    errorToast: {
      message: "some test message here on error",
    },
  });

  const fieldKeys = Object.entries(collection.fields)
    .filter(([_fieldKey, fieldDef]) => fieldDef.required)
    .map(([fieldKey, _fieldDef]) => fieldKey);
  const form = useCollectionForm({
    collection,
    readableFieldKeys: fieldKeys,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: async ({ value }: { value: any }) => {
      // `endSubmit` (not a trailing `finally` around the whole body) so the
      // guard clears *before* `setOpen(null)` clears the URL param — freeing
      // it after would force an extra render that races the URL-driven
      // close in `NuqsTestingAdapter`'s memoryless mode.
      try {
        await mutateAsync({ collection: collection.slug, data: value });
      } finally {
        endSubmit();
      }
      await setOpen(null);
    },
    // TanStack Form skips `onSubmit` entirely when validation fails, so the
    // in-flight guard above needs its own release on that path too.
    onSubmitInvalid: endSubmit,
  });

  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Modal urlParam={MODALS.createDocument.urlParam} dismissible={!isSubmitting}>
      <DialogContent
        ref={dialogRef}
        initialFocus={dialogRef}
        className="flex h-[80svh] w-full flex-col sm:h-[50svh] sm:w-[50svw]"
        onSubmitCapture={(event) => {
          if (isSubmittingRef.current) {
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          isSubmittingRef.current = true;
          setIsSubmitting(true);
        }}
      >
        <AppForm form={form} className="flex h-full flex-col overflow-hidden">
          <DialogHeader className="px-2 pb-4">Create {collection.labels.singular}</DialogHeader>
          <div className="flex grow flex-col overflow-y-auto px-2">
            <RenderFieldInputComponents
              collection={collection}
              fieldKeys={fieldKeys}
              className="flex grow flex-col gap-2"
            />
          </div>
          <DialogFooter className="p-1">
            <Button isPending={isPending || isSubmitting} type="submit">
              {MODALS.createDocument.label}
            </Button>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          </DialogFooter>
        </AppForm>
      </DialogContent>
    </Modal>
  );
}
