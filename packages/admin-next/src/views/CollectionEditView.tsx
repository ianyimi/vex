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
  LivePreviewPanel,
  PreviewToggleButton,
} from "@vexcms/ui";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState, parseAsBoolean } from "nuqs";
import { Trash2 } from "lucide-react";
import { DEFAULT_AUTOSAVE_INTERVAL } from "@vexcms/core";
import { DeleteDocumentDialog } from "../components/DeleteDocumentDialog";
import { UploadFieldWrapper } from "../components/UploadFieldWrapper";
import { StatusBadge } from "../components/StatusBadge";
import { VersionHistoryDropdown } from "../components/VersionHistoryDropdown";
import { useAutosave } from "../hooks/useAutosave";
import { usePermissions } from "../hooks/usePermissions";
import { usePreviewSnapshot } from "../hooks/usePreviewSnapshot";

export default function CollectionEditView({
  config,
  collection,
  documentID,
  renderRichTextField,
  livePreviewConfigs,
}: {
  config: ClientVexConfig;
  collection: VexCollection;
  documentID: string;
  renderRichTextField?: (props: Record<string, any>) => React.ReactNode;
  /** Map of collection slug → { url } for collections with function-based preview URLs */
  livePreviewConfigs?: Record<string, { url: (doc: { _id: string; [key: string]: any }) => string }>;
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
  const deleteSnapshotMutation = useMutation(anyApi.vex.previewSnapshot.remove);
  const upsertSnapshotMutation = useMutation(anyApi.vex.previewSnapshot.upsert);

  // Live preview state — persisted in URL so it survives page refresh
  const hasPreview = !!collection.admin?.livePreview;
  const [previewOpen, setPreviewOpen] = useQueryState(
    "preview",
    parseAsBoolean.withDefault(false),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Ref to get current form values for publish
  const getFormValuesRef = useRef<(() => Record<string, unknown>) | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);

  // Counter to force form remount on reset
  const [formResetKey, setFormResetKey] = useState(0);

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
    // For richtext fields with mediaCollection, default to image/* accept
    if (field?.type === "richtext") return { accept: ["image/*"] } as UploadFieldDef;
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
        // Clear restored state and mark form as clean
        setRestoredSnapshot(null);
        setRestoredFromVersion(null);
        setIsFormDirty(false);
        // Remount form so defaultValues sync with the new latest version
        setFormResetKey((k) => k + 1);
      } else {
        await updateDocument({
          collectionSlug: collection.slug,
          documentId: documentID,
          fields: changedFields,
        });
      }
      // Clean up transient preview snapshot after save — getPreviewSnapshot
      // will now fall back to the latest version in vex_versions
      if (hasPreview) {
        deleteSnapshotMutation({
          collectionSlug: collection.slug,
          documentId: documentID,
        }).catch(() => {});
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
      setRestoredSnapshot(null);
      setRestoredFromVersion(null);
      setIsFormDirty(false);
      setFormResetKey((k) => k + 1);
      // Clean up preview snapshot after publish
      if (hasPreview) {
        deleteSnapshotMutation({
          collectionSlug: collection.slug,
          documentId: documentID,
        }).catch(() => {});
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

  // Preview snapshot — writes debounced snapshot on form value changes when preview is open
  const { onValuesChange: onPreviewValuesChange, isSyncing: isPreviewSyncing } = usePreviewSnapshot({
    collectionSlug: collection.slug,
    documentId: documentID,
    enabled: previewOpen && hasPreview && !!document,
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
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
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
              <StatusBadge
                status={
                  // Show "published" only when the document is published AND form has no changes
                  document.vex_status === "published" && !isFormDirty && restoredFromVersion === null
                    ? "published"
                    : "draft"
                }
              />
            )}
            {hasPreview && document && (
              <PreviewToggleButton
                isOpen={previewOpen}
                onToggle={() => setPreviewOpen((prev) => !prev)}
              />
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
                    typeof document?.vex_version === "number" ? document.vex_version : undefined
                  }
                  activeVersion={restoredFromVersion ?? undefined}
                  onRestore={(snapshot, versionNum) => {
                    const docVersion = typeof document?.vex_version === "number" ? document.vex_version : undefined;
                    if (versionNum === docVersion) {
                      setRestoredSnapshot(null);
                      setRestoredFromVersion(null);
                      // Revert preview to latest version
                      if (hasPreview) {
                        deleteSnapshotMutation({
                          collectionSlug: collection.slug,
                          documentId: documentID,
                        }).catch(() => {});
                      }
                    } else {
                      setRestoredSnapshot(snapshot);
                      setRestoredFromVersion(versionNum);
                      // Update preview with the restored version's snapshot
                      if (hasPreview && snapshot) {
                        upsertSnapshotMutation({
                          collectionSlug: collection.slug,
                          documentId: documentID,
                          snapshot,
                        }).catch(() => {});
                      }
                    }
                  }}
                />
                {/* Reset: discard form changes and go back to the latest version */}
                {(isFormDirty || restoredFromVersion !== null) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setRestoredSnapshot(null);
                      setRestoredFromVersion(null);
                      setIsFormDirty(false);
                      setFormResetKey((k) => k + 1);
                      // Delete transient preview snapshot — getPreviewSnapshot
                      // will fall back to the latest version
                      if (hasPreview) {
                        deleteSnapshotMutation({
                          collectionSlug: collection.slug,
                          documentId: documentID,
                        }).catch(() => {});
                      }
                    }}
                  >
                    Reset
                  </Button>
                )}
                <Button
                  type="submit"
                  form="collection-edit-form"
                  variant="outline"
                  size="sm"
                  disabled={isSaving || !perms.update.allowed || (!isFormDirty && restoredFromVersion === null)}
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </Button>
                {document && document.vex_status === "published" && !isFormDirty && restoredFromVersion === null ? (
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

      <div className={`flex-1 min-h-0 ${previewOpen && hasPreview ? "flex overflow-hidden" : "overflow-y-auto"}`}>
        <div className={`p-6 ${previewOpen && hasPreview ? "w-1/2 border-r overflow-y-auto" : "w-full"}`}>
          {isLoading && <p className="text-muted-foreground">Loading...</p>}

          {!isLoading && document == null && (
            <p className="text-muted-foreground">Document not found.</p>
          )}

          {!isLoading && document != null && (
            <div className="" key={`${documentID}-${restoredFromVersion ?? "latest"}-${formResetKey}`}>
              <AppForm
                formId="collection-edit-form"
                schema={schema}
                fieldEntries={fieldEntries}
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                submitAllFields={isVersioned}
                getValuesRef={isVersioned || hasPreview ? getFormValuesRef : undefined}
                onDirtyChange={isVersioned ? setIsFormDirty : undefined}
                onValuesChange={onPreviewValuesChange}
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
                renderRichTextField={renderRichTextField ? (richtextProps: any) => {
                  return renderRichTextField({
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
          )}
        </div>
        {previewOpen && hasPreview && document && (
          <div className="w-1/2 overflow-hidden flex flex-col">
            <LivePreviewPanel
              url={
                // Use function URL from livePreviewConfigs if available (for function-based URLs
                // that were stripped during RSC serialization), otherwise use the serialized string URL
                livePreviewConfigs?.[collection.slug]?.url
                  ?? collection.admin!.livePreview!.url as string
              }
              doc={{ _id: documentID, ...document } as { _id: string; [key: string]: any }}
              breakpoints={collection.admin!.livePreview!.breakpoints}
              adminBreakpoints={config.admin.livePreview?.breakpoints}
              isSyncing={isPreviewSyncing}
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
