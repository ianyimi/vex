"use client";

import { useStore } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { CRUD_ACTIONS, DRAFT_ACTIONS, vexConvexApi, type CollectionSlug, type EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "./VexDocumentContext";
import { useVexForm } from "../forms/useVexForm";
import { useVexConfig } from "../config/VexConfigContext";
import { usePermission } from "../access";
import { useVexMutation } from "../hooks";
import { useDocumentEditRuntime } from "./DocumentEditRuntimeContext";
import { changedValues } from "../forms/changedValues";
import { getVexErrorMessage } from "../utils/errors";
import { Button } from "../ui";
import { toast } from "sonner";

/**
 * Built-in `vex.save` contribution for `edit.header.actions`. Writes the form's dirty diff —
 * `vexConvexApi.versions.saveDraft` for a versioned resource, `vexConvexApi.update` /
 * `vexConvexApi.globals.upsert` otherwise — the same endpoints a plugin replacing this button
 * would call (decision 13).
 *
 * @param props - `{ kind, slug }` (`EditSlotProps`).
 * @returns The Save / Save Draft button.
 * @throws Never — a rejected mutation is toasted, never re-thrown.
 */
export function DocumentSaveAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const form = useVexForm()!;
  const runtime = useDocumentEditRuntime();
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);

  const isVersioned =
    props.kind === "collection"
      ? Boolean(config.collections.find((c) => c.slug === props.slug)?.versions.drafts)
      : Boolean(config.globals.find((g) => g.slug === props.slug)?.versions.drafts);

  const canEdit = usePermission({
    resource: props.slug,
    action: isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: document.saved,
  });

  // `saveDraft` has no draft-workflow member on `VexMutationOperation`
  // (`packages/core/src/revalidate/types.ts`), so the draft write bypasses
  // `useVexMutation`'s purge pipeline — matches today's edit views.
  const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });

  const { mutateAsync: updateMutation, isPending: isUpdating } = useVexMutation({
    collection: props.slug,
    getChanges: ({ args }) => [
      { after: { ...(document.saved ?? {}), ...args.data }, before: document.saved },
    ],
    mutationFn: vexConvexApi.update,
    operation: CRUD_ACTIONS.update,
  });

  const { mutateAsync: upsertMutation, isPending: isUpserting } = useVexMutation({
    collection: props.slug,
    getChanges: ({ args }) => [{ after: { ...(document.saved ?? {}), ...args.data } }],
    mutationFn: vexConvexApi.globals.upsert,
    operation: "upsert",
  });

  const isPending = isVersioned
    ? isSavingDraft
    : props.kind === "collection"
      ? isUpdating
      : isUpserting;

  /**
   * Saves the form's current changes through this resource's resolved write endpoint.
   *
   * @returns Promise resolving once the write settles.
   * @throws Never — a rejected mutation is caught and toasted, never re-thrown.
   */
  async function handleSave(): Promise<void> {
    const restoredFrom =
      runtime.viewedVersion !== null ? { restoredFrom: runtime.viewedVersion.version } : {};
    if (isVersioned) {
      try {
        // A versioned global never yet saved: `changedValues` would be empty even though
        // the field defaults need to persist — send the full form value instead, same
        // first-save special case the non-versioned path already has.
        if (props.kind === "global" && document.saved === undefined) {
          await saveDraftMutation({
            global: props.slug,
            data: form.state.values as Record<string, unknown>,
            ...restoredFrom,
          });
          form.reset();
          return;
        }
        const changes = changedValues(form);
        const newId = await saveDraftMutation(
          props.kind === "collection"
            ? { collection: props.slug as CollectionSlug, id: document.id!, data: changes, ...restoredFrom }
            : { global: props.slug, data: changes, ...restoredFrom },
        );
        if (props.kind === "collection") runtime.onDocumentIdChange?.(newId);
        runtime.onViewVersion(null);
        runtime.onSaved(changes);
      } catch (error) {
        toast.error("Save draft failed", { description: getVexErrorMessage(error) });
      }
      return;
    }
    const changes = changedValues(form);
    if (Object.keys(changes).length === 0 && document.saved !== undefined) return;
    if (props.kind === "collection") {
      await updateMutation({ id: document.id!, collection: props.slug, data: changes });
    } else {
      await upsertMutation({
        slug: props.slug,
        data: document.saved === undefined ? (form.state.values as Record<string, unknown>) : changes,
      });
      if (document.saved === undefined) form.reset();
    }
    runtime.onSaved(changes);
  }

  // Viewing an old version with no further edits: still enabled — saving restores
  // the viewed version as the current draft (matches today's toolbar's disabled logic).
  const disabled = !canEdit || (runtime.viewedVersion === null && isDefaultValue);

  return (
    <Button
      type="button"
      variant={isVersioned ? "outline" : "default"}
      className="transition-all duration-300"
      isPending={isPending}
      disabled={disabled}
      onClick={() => void handleSave()}
    >
      {isVersioned ? "Save Draft" : "Save"}
    </Button>
  );
}
