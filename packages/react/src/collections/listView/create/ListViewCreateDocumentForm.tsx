"use client";

import { useEffect, useRef, useState } from "react";
import { Button, DialogFooter } from "../../../ui";
import {
  getDataFields,
  resolveNullableSaveValues,
  type CollectionConfig,
  type VexVersionStatus,
  vexConvexApi,
} from "@vexcms/core";
import { AppForm } from "../../../forms";
import { RenderFields } from "../../../fields/RenderFields";
import { useFieldsForm } from "../../../fields/useFieldsForm";
import { useVexMutation } from "../../../hooks";
import { applyVexFieldErrors, vexFieldErrorKeys } from "../../../utils/errors";

/**
 * Props for {@link ListViewCreateDocumentForm}.
 */
export interface ListViewCreateDocumentFormProps {
  /** The collection the new document will be created in. */
  collection: CollectionConfig;
  /** Called with the new document's id once the create mutation resolves. */
  onCreated: (id: string) => void;
  /** Called when the form is cancelled. */
  onCancel: () => void;
  /**
   * Called whenever the in-flight submit state changes — lets a host (a
   * modal, the relationship picker's Create tab) veto its own dismissal
   * while a create is in flight, the same guard `ListViewCreateDocumentModal` had
   * before this form was extracted.
   */
  onSubmittingChange?: (isSubmitting: boolean) => void;
  /**
   * Which fields to render. `"required"` (default) is the quick-create form's
   * existing behavior. `"all"` renders every field the caller can read, not
   * just the required ones.
   */
  fieldsMode?: "required" | "all";
  /**
   * Pre-fills the rendered fields' default values, overlaid on the fields'
   * own declared defaults — the same `document` overlay `useFieldsForm`
   * already applies in edit mode. Also merged beneath the submitted `data`
   * verbatim (the form's own values win for any key both define), so a key
   * `fieldsMode` doesn't render — a non-required field in `"required"` mode —
   * still creates with it. Duplicate relies on this: `cloneDocumentForDuplicate`'s
   * clone goes here, so only the required fields need review but every cloned
   * value is still carried onto the new document.
   */
  initialValues?: Record<string, unknown>;
  /**
   * Submits once, on mount, instead of waiting for a user click. Ignored on
   * every later render; a dialog that stays open across a failed
   * `submitOnOpen` attempt waits for the user from then on.
   */
  submitOnOpen?: boolean;
  /**
   * Forces the created document's `vex_status`, overriding `collection.versions.defaultStatus`
   * for this create only. Duplicate passes `"draft"` on a versioned collection — a duplicate
   * is unreviewed new content regardless of the collection's own default.
   */
  forceStatus?: VexVersionStatus;
  /**
   * Called instead of silently applying a rejected create's field error when that error targets
   * a key `fieldsMode` didn't render — nothing on screen could show it otherwise. Called with
   * the full submitted values (the form's own values merged over `initialValues`, same shape
   * `onCreated` would have gotten), so the caller can reopen with every field rendered and the
   * user's edits preserved. Duplicate passes a callback that reopens its dialog with
   * `fieldsMode: "all"`, those values as `initialValues`, and `submitOnOpen` so the identical
   * rejection recurs there and lands the error on the now-visible field.
   */
  onUnrenderedFieldError?: (values: Record<string, unknown>) => void;
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
export function ListViewCreateDocumentForm({
  collection,
  onCreated,
  onCancel,
  onSubmittingChange,
  fieldsMode = "required",
  initialValues,
  submitOnOpen = false,
  forceStatus,
  onUnrenderedFieldError,
}: ListViewCreateDocumentFormProps) {
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
  // `admin.readOnly` fields (e.g. the auth adapter's `emailVerified`/`createdAt`/
  // `updatedAt` — `betterAuthAttrToVexField` marks every non-editable system field
  // this way) are server-managed: a create form never collects them, in EITHER
  // mode — "required" would otherwise ask for a value it can't accept, and "all"
  // would render a disabled-looking input for a field this write path never sends.
  const fieldKeys =
    fieldsMode === "all"
      ? Object.entries(dataFields)
          .filter(([, fieldDef]) => !fieldDef.admin.readOnly)
          .map(([fieldKey]) => fieldKey)
      : Object.entries(dataFields)
          .filter(([, fieldDef]) => fieldDef.required && !fieldDef.admin.readOnly)
          .map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    fields: collection.fields,
    document: initialValues,
    readableFieldKeys: fieldKeys,
    onSubmit: async ({ value }) => {
      let id: string;
      const data = resolveNullableSaveValues({
        values: { ...initialValues, ...value },
        fields: collection.fields,
      });
      try {
        id = await mutateAsync({
          collection: collection.slug,
          data,
          ...(forceStatus !== undefined ? { status: forceStatus } : {}),
        });
      } catch (error) {
        const unrenderedKey = vexFieldErrorKeys(error).find((key) => !fieldKeys.includes(key));
        if (unrenderedKey !== undefined && onUnrenderedFieldError) {
          onUnrenderedFieldError(data);
        } else {
          applyVexFieldErrors(form, error);
        }
        throw error;
      } finally {
        endSubmit();
      }
      onCreated(id);
    },
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
      className="flex min-h-0 flex-1 flex-col"
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
