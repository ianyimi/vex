"use client";

import { useEffect, useRef, useState } from "react";
import { Button, DialogFooter } from "../ui";
import { getDataFields, type CollectionConfig, vexConvexApi } from "@vexcms/core";
import { AppForm } from "../forms";
import { RenderFields } from "../fields/RenderFields";
import { useFieldsForm } from "../fields/useFieldsForm";
import { useVexMutation } from "../hooks";
import { applyVexFieldErrors } from "../utils/errors";

/**
 * Props for {@link CreateDocumentForm}.
 */
export interface CreateDocumentFormProps {
  /** The collection the new document will be created in. */
  collection: CollectionConfig;
  /** Called with the new document's id once the create mutation resolves. */
  onCreated: (id: string) => void;
  /** Called when the form is cancelled. */
  onCancel: () => void;
  /**
   * Called whenever the in-flight submit state changes — lets a host (a
   * modal, the relationship picker's Create tab) veto its own dismissal
   * while a create is in flight, the same guard `CreateDocumentModal` had
   * before this form was extracted.
   */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  /**
   * Which fields to render. `"required"` (default) is the quick-create form's
   * existing behavior. `"all"` is the duplicate fallback's all-fields mode
   * (decision 7) — every field the caller can read, not just the required ones.
   */
  fieldsMode?: "required" | "all";
  /**
   * Pre-fills the form's default values, overlaid on the fields' own declared
   * defaults — the same `document` overlay `useFieldsForm` already applies in
   * edit mode. The duplicate fallback passes the clone here.
   */
  initialValues?: Record<string, unknown>;
  /**
   * Submits once, on mount, instead of waiting for a user click — the
   * duplicate fallback's "submits immediately" behavior (decision 7). Ignored
   * on every later render; a dialog that stays open across a failed
   * `submitOnOpen` attempt waits for the user from then on.
   */
  submitOnOpen?: boolean;
}

/**
 * Quick-create form for a single document — renders only `collection`'s
 * required fields (non-required fields keep their configured defaults and are
 * filled in later from the edit view) and calls the Convex `create` mutation
 * on submit.
 *
 * Guards against a second submit firing while the first is still in flight:
 * `onSubmitCapture` on the wrapping `<div>` runs in the capture phase, ahead
 * of `AppForm`'s own `onSubmit`, so the second event never reaches
 * `form.handleSubmit()`.
 *
 * @param props - Component props.
 * @returns The field inputs plus a Create/Cancel footer.
 */
export function CreateDocumentForm({
  collection,
  onCreated,
  onCancel,
  onSubmittingChange,
  fieldsMode = "required",
  initialValues,
  submitOnOpen = false,
}: CreateDocumentFormProps) {
  const isSubmittingRef = useRef(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const endSubmit = () => {
    isSubmittingRef.current = false;
    setIsSubmitting(false);
    onSubmittingChange?.(false);
  };

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args, result }) => [
      { after: { ...args.data, _id: result } },
    ],
    mutationFn: vexConvexApi.create,
    operation: "create",
    errorToast: { message: `Failed to create ${collection.labels.singular}` },
  });

  const dataFields = getDataFields({ fields: collection.fields });
  const fieldKeys =
    fieldsMode === "all"
      ? Object.keys(dataFields)
      : Object.entries(dataFields)
          .filter(([, fieldDef]) => fieldDef.required)
          .map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    fields: collection.fields,
    document: initialValues,
    readableFieldKeys: fieldKeys,
    onSubmit: async ({ value }) => {
      let id: string;
      try {
        id = await mutateAsync({ collection: collection.slug, data: value });
      } catch (error) {
        applyVexFieldErrors(form, error);
        // Rethrown (not swallowed): TanStack's own `_handleSubmit` catches this,
        // sets `isSubmitSuccessful: false`, and re-throws — which is what
        // `AppForm`'s `failedSubmitAttempt` effect needs to run `focusFirstFieldError`
        // and land the user on the field `applyVexFieldErrors` just marked invalid.
        throw error;
      } finally {
        endSubmit();
      }
      onCreated(id);
    },
    onSubmitInvalid: endSubmit,
  });

  const submitOnOpenRef = useRef(submitOnOpen);
  useEffect(() => {
    if (!submitOnOpenRef.current) return;
    submitOnOpenRef.current = false;
    // Same as `AppForm`'s own submit handler: a rejection here already updated the
    // form's error state via this file's own `onSubmit` catch block above — this
    // `.catch` only prevents an unhandled promise rejection.
    form.handleSubmit().catch(() => {});
  }, [form]);

  return (
    <div
      onSubmitCapture={(event) => {
        if (isSubmittingRef.current) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        isSubmittingRef.current = true;
        setIsSubmitting(true);
        onSubmittingChange?.(true);
      }}
    >
      <AppForm form={form} className="flex h-full flex-col overflow-hidden">
        <div className="flex grow flex-col gap-2 overflow-y-auto px-2">
          <RenderFields
            fields={collection.fields}
            collection={collection}
            fieldKeys={fieldKeys}
          />
        </div>
        <DialogFooter className="p-1">
          <Button isPending={isPending || isSubmitting} type="submit">
            Create
          </Button>
          <Button variant="outline" type="button" onClick={onCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </AppForm>
    </div>
  );
}
