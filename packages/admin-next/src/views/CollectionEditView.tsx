"use client";

import { useMemo, useState, useCallback, useRef } from "react";
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
import { DEFAULT_AUTOSAVE_INTERVAL } from "@vexcms/core";
import { DeleteDocumentDialog } from "../components/DeleteDocumentDialog";
import { UploadFieldWrapper } from "../components/UploadFieldWrapper";
import { StatusBadge } from "../components/StatusBadge";
import { VersionHistoryDropdown } from "../components/VersionHistoryDropdown";
import { useAutosave } from "../hooks/useAutosave";
import { usePermissions } from "../hooks/usePermissions";

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
  const isVersioned = !!collection.versions?.drafts;

  // Fetch the document reactively
  const documentQuery = useQuery({
    ...convexQuery(
      isVersioned
        ? anyApi.vex.versions.getDocumentForEdit
        : anyApi.vex.collections.getDocument,
      {
        collectionSlug: collection.slug,
        documentId: documentID,
      },
    ),
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
  const saveDraftMutation = useMutation(anyApi.vex.versions.saveDraft);
  const publishMutation = useMutation(anyApi.vex.versions.publish);
  const unpublishMutation = useMutation(anyApi.vex.versions.unpublish);

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Ref to get current form values for publish
  const getFormValuesRef = useRef<(() => Record<string, unknown>) | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Restored version state — when a user picks a version from history,
  // we store its snapshot here to override the form's default values.
  // The user must then explicitly "Save Draft" to persist it.
  const [restoredSnapshot, setRestoredSnapshot] = useState<Record<string, unknown> | null>(null);
  const [restoredFromVersion, setRestoredFromVersion] = useState<number | null>(null);

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

  // Permission checks
  const fieldKeys = Object.keys(collection.fields as Record<string, VexField>);
  const perms = usePermissions({
    resource: collection.slug,
    fields: fieldKeys,
    data: document ?? undefined,
  });

  const disableDelete = (collection.admin?.disableDelete ?? false) || !perms.delete.allowed;

  // Generate Zod schema from collection fields
  const schema = useMemo(
    () =>
      generateFormSchema({
        fields: collection.fields as Record<string, VexField>,
      }),
    [collection],
  );

  // Build field entries (excluding hidden fields and fields user can't read)
  const fieldEntries: FieldEntry[] = useMemo(
    () =>
      Object.entries(collection.fields as Record<string, VexField>)
        .filter(([name, field]) => {
          if (field.admin?.hidden) return false;
          if (!perms.read.isFieldAllowed(name)) return false;
          return true;
        })
        .map(([name, field]) => ({
          name,
          field,
          readOnly: !perms.update.isFieldAllowed(name),
        })),
    [collection, perms.read, perms.update],
  );

  // Build default values from the fetched document or restored snapshot
  const defaultValues = useMemo(() => {
    const source = restoredSnapshot ?? document;
    if (!source) return {};
    const values: Record<string, unknown> = {};
    for (const entry of fieldEntries) {
      values[entry.name] = source[entry.name];
    }
    return values;
  }, [document, fieldEntries, restoredSnapshot]);

  const handleSubmit = async (changedFields: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      if (isVersioned) {
        await saveDraftMutation({
          collectionSlug: collection.slug,
          documentId: documentID,
          fields: changedFields,
          restoredFrom: restoredFromVersion ?? undefined,
        });
        // Clear restored state — the reactive getDocumentForEdit query
        // will update with the new version's snapshot
        if (restoredFromVersion !== null) {
          setRestoredSnapshot(null);
          setRestoredFromVersion(null);
        }
      } else {
        await updateDocument({
          collectionSlug: collection.slug,
          documentId: documentID,
          fields: changedFields,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      // Send current form values so publish captures any unsaved changes
      const currentFields = getFormValuesRef.current?.() ?? undefined;
      await publishMutation({
        collectionSlug: collection.slug,
        documentId: documentID,
        fields: currentFields,
      });
      if (restoredFromVersion !== null) {
        setRestoredSnapshot(null);
        setRestoredFromVersion(null);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    setIsPublishing(true);
    try {
      await unpublishMutation({
        collectionSlug: collection.slug,
        documentId: documentID,
      });
    } finally {
      setIsPublishing(false);
    }
  };

  // Autosave configuration
  const autosaveConfig = collection.versions?.autosave;
  const autosaveEnabled = isVersioned && !!autosaveConfig && !!document;
  const autosaveInterval =
    typeof autosaveConfig === "object" ? autosaveConfig.interval : DEFAULT_AUTOSAVE_INTERVAL;

  useAutosave({
    collectionSlug: collection.slug,
    documentId: documentID,
    enabled: autosaveEnabled,
    interval: autosaveInterval,
    getChangedFields: () => {
      // Stub — implement based on AppForm's dirty state API
      return null;
    },
  });

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
            {isVersioned && document && typeof document.vex_status === "string" && (
              <StatusBadge status={document.vex_status} />
            )}
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

            {isVersioned ? (
              <>
                <VersionHistoryDropdown
                  collectionSlug={collection.slug}
                  documentId={documentID}
                  currentVersion={
                    restoredFromVersion ??
                    (typeof document?.vex_version === "number" ? document.vex_version : undefined)
                  }
                  onRestore={(snapshot, versionNum) => {
                    setRestoredSnapshot(snapshot);
                    setRestoredFromVersion(versionNum);
                  }}
                />
                <Button
                  type="submit"
                  form="collection-edit-form"
                  variant="outline"
                  size="sm"
                  disabled={isSaving || !perms.update.allowed}
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                {document && document.vex_status === "published" ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleUnpublish}
                    disabled={isPublishing}
                  >
                    {isPublishing ? "..." : "Unpublish"}
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={
                    isPublishing ||
                    !perms.update.allowed ||
                    (document?.vex_status === "published" && !isFormDirty && restoredFromVersion === null)
                  }
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                form="collection-edit-form"
                disabled={isSaving || fieldEntries.length === 0 || !perms.update.allowed}
              >
                {isSaving ? "Saving..." : "Save"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && <p className="text-muted-foreground">Loading...</p>}

        {!isLoading && document == null && (
          <p className="text-muted-foreground">Document not found.</p>
        )}

        {!isLoading && document != null && (
          <div className="" key={`${documentID}-${restoredFromVersion ?? "latest"}`}>
            <AppForm
              formId="collection-edit-form"
              schema={schema}
              fieldEntries={fieldEntries}
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              submitAllFields={isVersioned}
              getValuesRef={isVersioned ? getFormValuesRef : undefined}
              onDirtyChange={isVersioned ? setIsFormDirty : undefined}
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
