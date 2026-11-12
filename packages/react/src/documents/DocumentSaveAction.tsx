"use client";

import { useStore } from "@tanstack/react-form";
import { DRAFT_ACTIONS, CRUD_ACTIONS, type EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "./VexDocumentContext";
import { useVexForm } from "../forms/useVexForm";
import { useVexConfig } from "../config/VexConfigContext";
import { usePermission } from "../access";
import { useDocumentEditRuntime } from "./DocumentEditRuntimeContext";
import { Button } from "../ui";

/**
 * Built-in `vex.save` contribution for `edit.header.actions`. Writes the form's dirty diff —
 * `vexConvexApi.versions.saveDraft` for a versioned resource, `vexConvexApi.update` /
 * `vexConvexApi.globals.upsert` otherwise — the same endpoints a plugin replacing this button
 * would call (decision 13).
 *
 * A plain `form.handleSubmit()` call, same as `AppForm`'s own native submit (Enter in a text
 * field): the versioned/non-versioned write itself lives in the owning view's `onSubmit`
 * (`CollectionEditView`'s `onSubmit`, `GlobalEditView`'s `onSubmit`) — this button no longer
 * owns a mutation of its own, so a client validation failure blocks the write before any
 * network call, and a rejected write counts as a submit attempt regardless of which control
 * triggered it (`AppForm.tsx`'s `failedSubmitAttempt` effect needs exactly that to run
 * `focusFirstFieldError`).
 *
 * @param props - `{ kind, slug }` (`EditSlotProps`).
 * @returns The Save / Save Draft button.
 * @throws Never — `form.handleSubmit()`'s rejection (the owning view's `onSubmit` already
 *   applied the field error and rethrew) is caught here so it never becomes an unhandled
 *   promise rejection at this button's `onClick`.
 */
export function DocumentSaveAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const form = useVexForm()!;
  const runtime = useDocumentEditRuntime();
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const isVersioned =
    props.kind === "collection"
      ? Boolean(config.collections.find((c) => c.slug === props.slug)?.versions.drafts)
      : Boolean(config.globals.find((g) => g.slug === props.slug)?.versions.drafts);

  const canEdit = usePermission({
    resource: props.slug,
    action: isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: document.saved,
  });

  // Viewing an old version with no further edits: still enabled — saving restores
  // the viewed version as the current draft (matches today's toolbar's disabled logic).
  const disabled = !canEdit || (runtime.viewedVersion === null && isDefaultValue);

  return (
    <Button
      type="button"
      variant={isVersioned ? "outline" : "default"}
      className="transition-all duration-300"
      isPending={isSubmitting}
      disabled={disabled}
      onClick={() => void form.handleSubmit().catch(() => {})}
    >
      {isVersioned ? "Save Draft" : "Save"}
    </Button>
  );
}
