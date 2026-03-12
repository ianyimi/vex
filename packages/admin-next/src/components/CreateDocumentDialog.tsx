"use client";

import { useMemo, useState } from "react";
import type { VexCollection, VexField } from "@vexcms/core";
import { generateFormSchema, generateFormDefaultValues } from "@vexcms/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  AppForm,
  type FieldEntry,
  Button,
} from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";

interface CreateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  collection: VexCollection;
  onCreated: (props: { documentId: string }) => void;
}

export function CreateDocumentDialog(props: CreateDocumentDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const createDocument = useMutation(anyApi.vex.collections.createDocument);

  const schema = useMemo(
    () =>
      generateFormSchema({
        fields: props.collection.fields as Record<string, VexField>,
      }),
    [props.collection],
  );

  const defaultValues = useMemo(
    () =>
      generateFormDefaultValues({
        fields: props.collection.fields as Record<string, VexField>,
      }),
    [props.collection],
  );

  const fieldEntries: FieldEntry[] = useMemo(
    () =>
      Object.entries(
        props.collection.fields as Record<string, VexField>,
      )
        .filter(([, field]) => !field.admin?.hidden)
        .map(([name, field]) => ({ name, field })),
    [props.collection],
  );

  const singularLabel =
    props.collection.labels?.singular ?? props.collection.slug;

  const handleSubmit = async (changedFields: Record<string, unknown>) => {
    setIsCreating(true);
    try {
      const allFields = { ...defaultValues, ...changedFields };
      const result = await createDocument({
        collectionSlug: props.collection.slug,
        fields: allFields,
      });
      props.onCreated({ documentId: result as string });
    } catch (err) {
      console.error("Create failed:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !isCreating) props.onClose();
      }}
    >
      <DialogContent
        className="w-[90vw] md:w-[70vw] lg:w-[50vw] max-h-[90vh] flex flex-col"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Create {singularLabel}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-6" key={props.open ? "open" : "closed"}>
          <AppForm
            formId="create-document-form"
            schema={schema}
            fieldEntries={fieldEntries}
            defaultValues={defaultValues}
            onSubmit={handleSubmit}
          />
        </div>

        <div className="shrink-0 border-t p-6 flex justify-end">
          <Button
            type="submit"
            form="create-document-form"
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { CreateDocumentDialogProps };
