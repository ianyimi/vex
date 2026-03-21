"use client";

import { useMemo, useState, useCallback } from "react";
import type { VexCollection, VexField, ClientVexConfig, UploadFieldDef } from "@vexcms/core";
import { generateFormSchema, generateFormDefaultValues } from "@vexcms/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  AppForm,
  type FieldEntry,
  Button,
  CreateMediaModal,
} from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { useQueryState, parseAsString } from "nuqs";
import { UploadFieldWrapper } from "./UploadFieldWrapper";

interface CreateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  collection: VexCollection;
  config: ClientVexConfig;
  onCreated: (props: { documentId: string }) => void;
  renderRichTextField?: (props: Record<string, any>) => React.ReactNode;
}

export function CreateDocumentDialog(props: CreateDocumentDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const createDocument = useMutation(anyApi.vex.collections.createDocument);
  const createDraftDocument = useMutation(anyApi.vex.versions.createDraftDocument);
  const isVersioned = !!props.collection.versions?.drafts;

  // Media upload state (same pattern as CollectionEditView)
  const generateUploadUrl = useMutation(anyApi.vex.media.generateUploadUrl);
  const createMediaDocument = useMutation(anyApi.vex.media.createMediaDocument);
  const [pendingUploadFieldName, setPendingUploadFieldName] = useState<string | null>(null);
  const [newMediaSlug, setNewMediaSlug] = useQueryState(
    "createMediaSlug",
    parseAsString.withDefault(""),
  );
  const [uploadedMediaIds, setUploadedMediaIds] = useState<Record<string, string>>({});

  const handleOpenUploadModal = useCallback(
    (fieldName: string, collectionSlug: string) => {
      setPendingUploadFieldName(fieldName);
      setNewMediaSlug(collectionSlug);
    },
    [setNewMediaSlug],
  );

  const handleUploadComplete = useCallback(
    (documentId: string) => {
      if (pendingUploadFieldName) {
        setUploadedMediaIds((prev) => ({
          ...prev,
          [pendingUploadFieldName]: documentId,
        }));
      }
      setNewMediaSlug("");
      setPendingUploadFieldName(null);
    },
    [pendingUploadFieldName, setNewMediaSlug],
  );

  const currentUploadFieldDef = useMemo(() => {
    if (!pendingUploadFieldName) return null;
    const fields = props.collection.fields as Record<string, VexField>;
    const field = fields[pendingUploadFieldName];
    if (field?.type === "upload") return field as UploadFieldDef;
    if (field?.type === "richtext") return { accept: ["image/*"] } as UploadFieldDef;
    return null;
  }, [pendingUploadFieldName, props.collection]);

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

      if (isVersioned) {
        // Versioned collections: create as draft with initial version entry
        const result = await createDraftDocument({
          collectionSlug: props.collection.slug,
          fields: allFields,
        });
        props.onCreated({ documentId: (result as any).documentId as string });
      } else {
        // Non-versioned collections: create directly as published
        const result = await createDocument({
          collectionSlug: props.collection.slug,
          fields: allFields,
        });
        props.onCreated({ documentId: result as string });
      }
    } catch (err) {
      console.error("Create failed:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
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
              onOpenUploadModal={handleOpenUploadModal}
              renderUploadField={(uploadProps) => (
                <UploadFieldWrapper
                  field={uploadProps.field}
                  fieldDef={uploadProps.fieldDef}
                  name={uploadProps.name}
                  onUploadNew={uploadProps.onUploadNew}
                  uploadedMediaId={uploadedMediaIds[uploadProps.name]}
                  basePath={props.config.basePath}
                  initialValue={uploadProps.defaultValue as string | undefined}
                />
              )}
              renderRichTextField={props.renderRichTextField ? (richtextProps: any) => {
                return props.renderRichTextField!({
                  ...richtextProps,
                  generateUploadUrl: async () => await generateUploadUrl(),
                  createMediaDocument: async (p: any) => await createMediaDocument(p),
                  onUploadNew: richtextProps.fieldDef?.mediaCollection
                    ? () => handleOpenUploadModal(richtextProps.name, richtextProps.fieldDef.mediaCollection)
                    : undefined,
                });
              } : undefined}
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

      {/* Media Upload Modal */}
      {newMediaSlug && (
        <CreateMediaModal
          open={!!newMediaSlug}
          collectionSlug={newMediaSlug}
          onClose={() => {
            setNewMediaSlug("");
            setPendingUploadFieldName(null);
          }}
          onUploadComplete={handleUploadComplete}
          generateUploadUrl={async () => await generateUploadUrl()}
          createMediaDocument={async (mediaProps) =>
            await createMediaDocument(mediaProps)
          }
          accept={currentUploadFieldDef?.accept}
          maxSize={currentUploadFieldDef?.maxSize}
        />
      )}
    </>
  );
}

export type { CreateDocumentDialogProps };
