"use client";

import { useMemo, useState, useCallback } from "react";
import type {
  VexCollection,
  ClientVexConfig,
  VexField,
  UploadFieldDef,
} from "@vexcms/core";
import { generateFormSchema } from "@vexcms/core";
import {
  AppForm,
  type FieldEntry,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  CreateMediaModal,
} from "@vexcms/ui";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { Trash2 } from "lucide-react";
import { DeleteDocumentDialog } from "../components/DeleteDocumentDialog";
import { UploadFieldWrapper } from "../components/UploadFieldWrapper";

export default function CollectionEditView({
  config,
  collection,
  documentID,
}: {
  config: ClientVexConfig;
  collection: VexCollection;
  documentID: string;
}) {
  const router = useRouter();

  // Fetch the document reactively
  const documentQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.getDocument, {
      collectionSlug: collection.slug,
      documentId: documentID,
    }),
  });

  const document = documentQuery.data as
    | Record<string, unknown>
    | null
    | undefined;

  // Set up the mutation via Convex's useMutation
  const updateDocument = useMutation(anyApi.vex.collections.updateDocument);
  const generateUploadUrl = useMutation(
    anyApi.vex.media.generateUploadUrl,
  );
  const createMediaDocument = useMutation(
    anyApi.vex.media.createMediaDocument,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Media upload modal state
  const [newMediaSlug, setNewMediaSlug] = useQueryState("newMedia");
  const [pendingUploadFieldName, setPendingUploadFieldName] = useState<
    string | null
  >(null);
  // Store a ref to the form so we can set upload field values after upload
  const [uploadedMediaIds, setUploadedMediaIds] = useState<
    Record<string, string>
  >({});

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
      setNewMediaSlug(null);
      setPendingUploadFieldName(null);
    },
    [pendingUploadFieldName, setNewMediaSlug],
  );

  // Find the upload field def for the current modal (for accept/maxSize)
  const currentUploadFieldDef = useMemo(() => {
    if (!pendingUploadFieldName) return null;
    const fields = collection.fields as Record<string, VexField>;
    const field = fields[pendingUploadFieldName];
    if (field?.type === "upload") return field as UploadFieldDef;
    return null;
  }, [pendingUploadFieldName, collection]);

  const disableDelete = collection.admin?.disableDelete ?? false;

  // Generate Zod schema from collection fields
  const schema = useMemo(
    () =>
      generateFormSchema({
        fields: collection.fields as Record<string, VexField>,
      }),
    [collection],
  );

  // Build field entries (excluding hidden fields)
  const fieldEntries: FieldEntry[] = useMemo(
    () =>
      Object.entries(collection.fields as Record<string, VexField>)
        .filter(([, field]) => !field.admin?.hidden)
        .map(([name, field]) => ({ name, field })),
    [collection],
  );

  // Build default values from the fetched document
  const defaultValues = useMemo(() => {
    if (!document) return {};
    const values: Record<string, unknown> = {};
    for (const entry of fieldEntries) {
      values[entry.name] = document[entry.name];
    }
    return values;
  }, [document, fieldEntries]);

  const handleSubmit = async (changedFields: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      await updateDocument({
        collectionSlug: collection.slug,
        documentId: documentID,
        fields: changedFields,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = documentQuery.isPending;

  const useAsTitle = collection.admin?.useAsTitle as string | undefined;
  const documentTitle =
    useAsTitle && document
      ? (document[useAsTitle] as string | undefined)
      : undefined;
  const pluralLabel = collection.labels?.plural ?? collection.slug;
  const singularLabel = collection.labels?.singular ?? collection.slug;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href={config.basePath} />}>
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    <Link href={`${config.basePath}/${collection.slug}`} />
                  }
                >
                  {pluralLabel}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{documentTitle || documentID}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex items-center gap-2">
            {!disableDelete && document && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
            <Button
              type="submit"
              form="collection-edit-form"
              disabled={isSaving || fieldEntries.length === 0}
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <p className="text-muted-foreground">Loading...</p>}

        {!isLoading && document == null && (
          <p className="text-muted-foreground">Document not found.</p>
        )}

        {!isLoading && document != null && (
          <div className="" key={documentID}>
            <AppForm
              formId="collection-edit-form"
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
                  basePath={config.basePath}
                  initialValue={uploadProps.defaultValue as string | undefined}
                />
              )}
            />
          </div>
        )}
      </div>

      {newMediaSlug && (
        <CreateMediaModal
          open={!!newMediaSlug}
          onClose={() => {
            setNewMediaSlug(null);
            setPendingUploadFieldName(null);
          }}
          collectionSlug={newMediaSlug}
          accept={currentUploadFieldDef?.accept}
          maxSize={currentUploadFieldDef?.maxSize}
          onUploadComplete={handleUploadComplete}
          generateUploadUrl={async () => await generateUploadUrl()}
          createMediaDocument={async (props) =>
            await createMediaDocument(props)
          }
        />
      )}

      {!disableDelete && document && (
        <DeleteDocumentDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          documents={[{
            _id: documentID,
            title: documentTitle,
          }]}
          collectionSlug={collection.slug}
          singularLabel={singularLabel}
          pluralLabel={pluralLabel}
          onDeleted={() => {
            router.push(`${config.basePath}/${collection.slug}`);
          }}
        />
      )}
    </div>
  );
}
