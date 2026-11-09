"use client";

import {
  CRUD_ACTIONS,
  type EditSlotProps,
} from "@vexcms/core";
import { usePermission } from "../../access";
import { adminHref } from "../../admin/adminHref";
import { useVexConfig } from "../../config/VexConfigContext";
import { useVexNavigate } from "../../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../../documents/useUnsavedChangesGuard";
import { useVexDocument } from "../../documents/VexDocumentContext";
import { useEditActionsMenuDialog } from "../../documents/EditActionsMenuDialogContext";
import { EditActionsMenuItem } from "../../documents/EditActionsMenuItem";
import { Dialog, DialogContent, DialogHeader, Icon } from "../../ui";
import { ModalSurfaceProvider } from "../../modals";
import { ListViewCreateDocumentForm } from "../listView/create/ListViewCreateDocumentForm";
import { useDuplicateCollectionDocument } from "./useDuplicateCollectionDocument";

/**
 * Built-in `vex.duplicate` contribution for `edit.actionsMenu`, folding the former
 * `CollectionDuplicateAction` in here. Offered on
 * non-media collections only (`props.slug` is always a non-media `CollectionConfig`
 * here, `config.collections` already excludes media), gated on
 * {@link useDuplicateCollectionDocument}'s create permission and on
 * `collection.disableCreate` — a collection with no admin-authored create
 * workflow (the auth user collection, decision D2) has nothing for "Duplicate"
 * to create into either.
 *
 * On a rejected create, opens the all-fields fallback dialog through
 * `useEditActionsMenuDialog().open(...)` — it cannot own that dialog itself, since the rejection
 * resolves after this item has already unmounted (base-ui tears down `DropdownMenuContent` and
 * every item in it the instant the dropdown closes on select).
 *
 * @param props - `EditSlotProps` — `{ kind: "collection", slug }`.
 * @returns The Duplicate menu item, or `null` for a global, an unresolvable slug, or a
 *   `disableCreate` collection.
 */
export function CollectionDuplicateMenuItem(props: EditSlotProps) {
  const config = useVexConfig();
  const navigate = useVexNavigate();
  const releaseUnsavedChangesGuard = useReleaseUnsavedChangesGuard();
  const dialog = useEditActionsMenuDialog();
  const { saved } = useVexDocument();
  const collection = config.collections.find((c) => c.slug === props.slug);
  const canCreate = usePermission({ resource: props.slug, action: CRUD_ACTIONS.create });

  const { duplicate, isPending } = useDuplicateCollectionDocument({
    collection: collection!,
    document: saved,
    onConflict: (clone) => {
      dialog.open(
        <Dialog open onOpenChange={(open) => !open && dialog.close()}>
          <ModalSurfaceProvider>
            <DialogContent className="flex h-[80svh] w-full flex-col sm:h-[50svh] sm:w-[50svw]">
              <DialogHeader>
                Duplicate {collection!.labels.singular} — resolve the conflict
              </DialogHeader>
              <ListViewCreateDocumentForm
                collection={collection!}
                fieldsMode="all"
                initialValues={clone}
                submitOnOpen
                onCreated={(id) => {
                  dialog.close();
                  // Same navigation as the hook's own success path (decision 6 — "one
                  // click" lands on the new document either way).
                  releaseUnsavedChangesGuard();
                  navigate(adminHref({ type: "document", slug: props.slug, id }, config.basePath));
                }}
                onCancel={dialog.close}
              />
            </DialogContent>
          </ModalSurfaceProvider>
        </Dialog>,
      );
    },
  });

  if (props.kind !== "collection" || !collection || collection.disableCreate) return null;

  return (
    <EditActionsMenuItem
      disabled={!saved || !canCreate || isPending}
      icon={<Icon name="Copy" />}
      onSelect={duplicate}
    >
      Duplicate
    </EditActionsMenuItem>
  );
}
