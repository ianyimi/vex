"use client";

import {
  CRUD_ACTIONS,
  type EditSlotProps,
} from "@vexcms/core";
import { usePermission } from "../../access";
import { useVexConfig } from "../../config/VexConfigContext";
import { useVexDocument } from "../../documents/VexDocumentContext";
import { useEditActionsMenuDialog } from "../../documents/EditActionsMenuDialogContext";
import { EditActionsMenuItem } from "../../documents/EditActionsMenuItem";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Icon } from "../../ui";
import { ModalSurfaceProvider } from "../../modals";
import { ListViewCreateDocumentForm } from "../listView/create/ListViewCreateDocumentForm";
import { useDuplicateCollectionDocument } from "./useDuplicateCollectionDocument";

/**
 * Built-in `vex.duplicate` contribution for `edit.actionsMenu`, folding the former
 * `CollectionDuplicateAction` in here. Offered on non-media collections only (`props.slug` is
 * always a non-media `CollectionConfig` here, `config.collections` already excludes media),
 * gated on `canCreate` and on `collection.disableCreate` — a collection with no admin-authored
 * create workflow (the auth user collection, decision D2) has nothing for "Duplicate" to create
 * into either.
 *
 * Always opens the SAME create-document dialog "New" uses (decision: developer feedback — no
 * more eager create-then-fallback-on-conflict), prefilled with the loaded document's clone
 * (`useDuplicateCollectionDocument`, title renamed). Only the collection's required fields show
 * for review; every other cloned value still creates with the document via
 * `ListViewCreateDocumentForm`'s `initialValues` merge — same reason the dialog cannot be owned
 * by this item itself: base-ui tears down `DropdownMenuContent` and every item in it the instant
 * the dropdown closes on select, so the dialog is opened through
 * `useEditActionsMenuDialog().open(...)` instead, which survives that.
 *
 * A rejected create's field error can target a key the required-only dialog never rendered
 * (e.g. a unique-value conflict on a non-required field) — invisible otherwise, since no input
 * exists to show it. `ListViewCreateDocumentForm.onUnrenderedFieldError` catches exactly that
 * case; this reopens the SAME dialog with `fieldsMode: "all"`, the values the user already
 * entered preserved, and `submitOnOpen` so the identical rejection recurs there and
 * `applyVexFieldErrors`/`focusFirstFieldError` land the user on the now-visible field — the
 * same two-step mechanism the pre-this-feature fallback dialog used.
 *
 * @param props - `EditSlotProps` — `{ kind: "collection", slug }`.
 * @returns The Duplicate menu item, or `null` for a global, an unresolvable slug, or a
 *   `disableCreate` collection.
 */
export function CollectionDuplicateMenuItem(props: EditSlotProps) {
  const config = useVexConfig();
  const dialog = useEditActionsMenuDialog();
  const { saved } = useVexDocument();
  const collection = config.collections.find((c) => c.slug === props.slug);
  const canCreate = usePermission({ resource: props.slug, action: CRUD_ACTIONS.create });

  const { clone, note, forceStatus, onCreated } = useDuplicateCollectionDocument({
    collection,
    document: saved,
  });

  if (props.kind !== "collection" || !collection || collection.disableCreate) return null;
  const resolvedCollection = collection;

  /**
   * Opens (or replaces) the duplicate dialog. `ListViewCreateDocumentForm` is keyed on
   * `options?.fieldsMode` — `onUnrenderedFieldError` calling this again, at the same tree
   * position, would otherwise update the EXISTING form instance instead of mounting a fresh
   * one, and `submitOnOpen`'s own `useEffect(..., [form])` (a stable reference across that
   * update) would never re-fire, silently dropping the resubmit.
   *
   * @param options - Overrides for a reopen; omitted for the initial open (clone, `"required"`
   *   fields, no auto-submit).
   */
  function openDuplicateDialog(options?: {
    fieldsMode?: "required" | "all";
    initialValues?: Record<string, unknown>;
    submitOnOpen?: boolean;
  }): void {
    dialog.open(
      <Dialog open onOpenChange={(open) => !open && dialog.close()}>
        <ModalSurfaceProvider>
          <DialogContent className="flex h-[80svh] w-full flex-col sm:h-[50svh] sm:w-[50svw]">
            <DialogHeader>
              <DialogTitle>Duplicate {resolvedCollection.labels.singular}</DialogTitle>
              <DialogDescription>{note}</DialogDescription>
            </DialogHeader>
            <ListViewCreateDocumentForm
              key={options?.fieldsMode ?? "required"}
              collection={resolvedCollection}
              fieldsMode={options?.fieldsMode}
              initialValues={options?.initialValues ?? clone}
              forceStatus={forceStatus}
              submitOnOpen={options?.submitOnOpen}
              onUnrenderedFieldError={(values) =>
                openDuplicateDialog({ fieldsMode: "all", initialValues: values, submitOnOpen: true })
              }
              onCreated={(id) => {
                dialog.close();
                onCreated(id);
              }}
              onCancel={dialog.close}
            />
          </DialogContent>
        </ModalSurfaceProvider>
      </Dialog>,
    );
  }

  return (
    <EditActionsMenuItem
      disabled={!saved || !canCreate}
      icon={<Icon name="Copy" />}
      onSelect={() => openDuplicateDialog()}
    >
      Duplicate
    </EditActionsMenuItem>
  );
}
