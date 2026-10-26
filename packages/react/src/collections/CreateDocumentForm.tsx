"use client";

import { useRef, useState } from "react";
import { Button, DialogFooter } from "../ui";
import { getDataFields, type CollectionConfig, vexConvexApi } from "@vexcms/core";
import { AppForm } from "../forms";
import { RenderFields } from "../fields/RenderFields";
import { useFieldsForm } from "../fields/useFieldsForm";
import { useVexMutation } from "../hooks";

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

  const fieldKeys = Object.entries(getDataFields({ fields: collection.fields }))
    .filter(([, fieldDef]) => fieldDef.required)
    .map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    fields: collection.fields,
    readableFieldKeys: fieldKeys,
    onSubmit: async ({ value }) => {
      let id: string;
      try {
        id = await mutateAsync({ collection: collection.slug, data: value });
      } finally {
        endSubmit();
      }
      onCreated(id);
    },
    onSubmitInvalid: endSubmit,
  });

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
