"use client";

import { useRef } from "react";
import {
  Button,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from "../../ui";
import { Modal } from "./BaseModal";
import { CollectionConfig } from "@vexcms/core";
import { MODALS } from "./constants";
import { AppForm } from "../../form";
import { useCollectionForm } from "../../../hooks/useCollectionForm";
import { RenderFieldInputComponents } from "../../../fields";
import { vexConvexApi } from "@vexcms/core";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { parseAsBoolean, useQueryState } from "nuqs";

/**
 * Modal for creating a new document in a collection.
 *
 * Opens when `?createNew=true` is in the URL (see `MODALS.createDocument`).
 * Builds a TanStack Form instance via `useCollectionForm`, renders all
 * collection fields with `<RenderFieldInputComponents>`, and calls the
 * Convex `create` mutation on submit. Closes by clearing the URL param.
 *
 * @param props - Component props.
 * @param props.collection - The collection the new document will be created in.
 * @returns A URL-state-driven `<Modal>` containing the creation form.
 *
 * @example
 * ```tsx
 * // Rendered inside CollectionListView — opens automatically when ?createNew=true
 * <CreateDocumentModal collection={postsCollection} />
 * ```
 */
export function CreateDocumentModal({
  collection,
}: {
  collection: CollectionConfig;
}) {
  // eslint-disable-next-line no-unused-vars
  const [_, setOpen] = useQueryState(
    MODALS.createDocument.urlParam,
    parseAsBoolean,
  );

  const createDocument = useConvexMutation(vexConvexApi.create);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: createDocument,
  });

  const form = useCollectionForm({
    collection,
    onSubmit: async ({ value }) => {
      await mutateAsync({ collection: collection.slug, data: value });
      await setOpen(null);
    },
  });

  const dialogRef = useRef<HTMLDivElement>(null);

  return (
    <Modal urlParam={MODALS.createDocument.urlParam}>
      <DialogContent ref={dialogRef} initialFocus={dialogRef} className="w-[50svw] h-[50svh] flex flex-col">
        <AppForm form={form} className="flex flex-col h-full overflow-hidden">
          <DialogHeader className="px-2 pb-4">
            Create {collection.labels.singular}
          </DialogHeader>
          <div className="overflow-y-auto grow flex flex-col px-2">
            <RenderFieldInputComponents
              fields={collection.fields}
              className="grow flex flex-col gap-2"
            />
          </div>
          <DialogFooter className="p-1">
            <Button isPending={isPending} type="submit">
              {MODALS.createDocument.label}
            </Button>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
          </DialogFooter>
        </AppForm>
      </DialogContent>
    </Modal>
  );
}
