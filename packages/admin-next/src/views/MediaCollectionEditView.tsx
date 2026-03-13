"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { VexCollection, ClientVexConfig, VexField } from "@vexcms/core";
import { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "@vexcms/core";
import {
  Button,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Input,
  Label,
} from "@vexcms/ui";
import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { useUrlToFile } from "../hooks/useUrlToFile";
import { MediaFileSection } from "../components/MediaFileSection";
import { DeleteDocumentDialog } from "../components/DeleteDocumentDialog";
import { usePermissions } from "../hooks/usePermissions";

const STANDARD_MEDIA_FIELDS: Set<string> = new Set([
  ...LOCKED_MEDIA_FIELDS,
  ...OVERRIDABLE_MEDIA_FIELDS,
]);

async function extractImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

export default function MediaCollectionEditView(props: {
  config: ClientVexConfig;
  collection: VexCollection;
  documentID: string;
}) {
  const router = useRouter();

  // Fetch document
  const documentQuery = useQuery({
    ...convexQuery(anyApi.vex.collections.getDocument, {
      collectionSlug: props.collection.slug,
      documentId: props.documentID,
    }),
  });

  const document = documentQuery.data as
    | Record<string, unknown>
    | null
    | undefined;

  const updateDocument = useMutation(anyApi.vex.collections.updateDocument);
  const generateUploadUrl = useMutation(anyApi.vex.media.generateUploadUrl);

  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(
    null,
  );
  const [pendingMeta, setPendingMeta] = useState<{
    filename: string;
    mimeType: string;
    size: number;
  } | null>(null);
  const [urlStorageId, setUrlStorageId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Local edits — track only fields the user has explicitly changed.
  // Unedited fields fall through to the live document values.
  const [localEdits, setLocalEdits] = useState<Record<string, unknown>>({});

  const urlToFile = useUrlToFile({
    maxSize: (props.collection as any).maxSize ?? 25 * 1024 * 1024,
  });

  // Permission checks
  const perms = usePermissions({
    resource: props.collection.slug,
    data: document ?? undefined,
  });

  const disableDelete = (props.collection.admin?.disableDelete ?? false) || !perms.delete.allowed;

  // Custom fields
  const customFields = useMemo(() => {
    const fields = props.collection.fields as Record<string, VexField>;
    return Object.entries(fields)
      .filter(([name, field]) => {
        if (STANDARD_MEDIA_FIELDS.has(name)) return false;
        if (field.admin?.hidden) return false;
        return true;
      })
      .map(([name, field]) => ({ name, field }));
  }, [props.collection]);

  // Derive current field values: local edits take priority over document values.
  // This avoids the useEffect init/reset dance that caused blank renders.
  const filename = "filename" in localEdits
    ? (localEdits.filename as string)
    : (document?.filename as string) || "";
  const altText = "alt" in localEdits
    ? (localEdits.alt as string)
    : (document?.alt as string) || "";
  const width = "width" in localEdits
    ? (localEdits.width as number | undefined)
    : (document?.width as number | undefined);
  const height = "height" in localEdits
    ? (localEdits.height as number | undefined)
    : (document?.height as number | undefined);
  const customValues = useMemo(() => {
    const cv: Record<string, unknown> = {};
    for (const { name } of customFields) {
      cv[name] = name in localEdits ? localEdits[name] : document?.[name];
    }
    return cv;
  }, [customFields, localEdits, document]);

  // When URL fetch succeeds
  useEffect(() => {
    if (urlToFile.result) {
      setPendingMeta({
        filename: urlToFile.result.filename,
        mimeType: urlToFile.result.mimeType,
        size: urlToFile.result.size,
      });
      setUrlStorageId(urlToFile.result.storageId);
      setPendingFile(null);
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
    }
  }, [urlToFile.result]);

  const handleFileSelect = useCallback(
    async (file: File) => {
      setPendingFile(file);
      const preview = URL.createObjectURL(file);
      setPendingPreviewUrl(preview);
      setPendingMeta({
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });
      setUrlStorageId(null);
      urlToFile.clear();

      const dims = await extractImageDimensions(file);
      if (dims) {
        setLocalEdits((prev) => ({ ...prev, width: dims.width, height: dims.height }));
      }
    },
    [urlToFile],
  );

  const handleClearFile = useCallback(() => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setPendingMeta(null);
    setUrlStorageId(null);
  }, [pendingPreviewUrl]);

  async function handleSave() {
    if (!document) return;

    setIsSaving(true);
    setError(null);

    try {
      const changedFields: Record<string, unknown> = {};

      // Handle new file upload
      if (pendingFile) {
        const uploadUrl = await generateUploadUrl();
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": pendingFile.type },
          body: pendingFile,
        });
        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }
        const data = await response.json();
        changedFields.storageId = data.storageId;
        changedFields.mimeType = pendingFile.type;
        changedFields.size = pendingFile.size;
        changedFields.url = ""; // Will be resolved from storageId
      } else if (urlStorageId) {
        changedFields.storageId = urlStorageId;
        changedFields.mimeType =
          pendingMeta?.mimeType || "application/octet-stream";
        changedFields.size = pendingMeta?.size || 0;
        changedFields.url = "";
      }

      // Check changed scalar fields
      if (filename !== (document.filename as string)) {
        changedFields.filename = filename;
      }
      if (altText !== (document.alt as string || "")) {
        changedFields.alt = altText;
      }
      if (width !== (document.width as number | undefined)) {
        changedFields.width = width;
      }
      if (height !== (document.height as number | undefined)) {
        changedFields.height = height;
      }

      // Custom fields
      for (const { name } of customFields) {
        if (customValues[name] !== document[name]) {
          changedFields[name] = customValues[name];
        }
      }

      if (Object.keys(changedFields).length === 0) {
        setIsSaving(false);
        return;
      }

      await updateDocument({
        collectionSlug: props.collection.slug,
        documentId: props.documentID,
        fields: changedFields,
      });

      // Clear pending state — document will update via live query
      setLocalEdits({});
      setPendingFile(null);
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
      setPendingPreviewUrl(null);
      setPendingMeta(null);
      setUrlStorageId(null);
      urlToFile.clear();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }

  const isLoading = documentQuery.isPending;
  const hasPendingFile = !!pendingFile || !!urlStorageId;
  const pluralLabel = props.collection.labels?.plural ?? props.collection.slug;
  const singularLabel =
    props.collection.labels?.singular ?? props.collection.slug;
  const documentTitle = document
    ? (document.filename as string) || props.documentID
    : props.documentID;

  const currentFile = document
    ? {
        filename: document.filename as string,
        mimeType: document.mimeType as string,
        size: document.size as number,
        url: document.url as string,
      }
    : null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="shrink-0 border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link href={props.config.basePath} />}
                >
                  Admin
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={
                    <Link
                      href={`${props.config.basePath}/${props.collection.slug}`}
                    />
                  }
                >
                  {pluralLabel}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{documentTitle}</BreadcrumbPage>
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
              onClick={handleSave}
              disabled={isSaving || !document || !perms.update.allowed}
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
          <div className="space-y-6 max-w-3xl" key={props.documentID}>
            <MediaFileSection
              layout="side-by-side"
              currentFile={currentFile}
              hasPendingFile={hasPendingFile}
              pendingFile={pendingFile}
              pendingPreviewUrl={pendingPreviewUrl}
              pendingMetadata={pendingMeta}
              onFileSelect={handleFileSelect}
              onClearPendingFile={handleClearFile}
              urlToFile={urlToFile}
              accept={(props.collection as any).accept}
              maxSize={(props.collection as any).maxSize}
              disabled={isSaving}
            />

            <div className="space-y-2">
              <Label htmlFor="edit-filename">Filename</Label>
              <Input
                id="edit-filename"
                value={filename}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocalEdits((prev) => ({ ...prev, filename: e.target.value }))
                }
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-alt">Alt Text</Label>
              <Input
                id="edit-alt"
                value={altText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setLocalEdits((prev) => ({ ...prev, alt: e.target.value }))
                }
                placeholder="Describe this file for accessibility"
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-width">Width (px)</Label>
                <Input
                  id="edit-width"
                  type="number"
                  value={width ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalEdits((prev) => ({
                      ...prev,
                      width: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  disabled={isSaving}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-height">Height (px)</Label>
                <Input
                  id="edit-height"
                  type="number"
                  value={height ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalEdits((prev) => ({
                      ...prev,
                      height: e.target.value ? Number(e.target.value) : undefined,
                    }))
                  }
                  disabled={isSaving}
                />
              </div>
            </div>

            {customFields.map(({ name, field }) => (
              <div key={name} className="space-y-2">
                <Label htmlFor={`edit-${name}`}>
                  {"label" in field && field.label ? field.label : name}
                </Label>
                <Input
                  id={`edit-${name}`}
                  value={(customValues[name] as string) ?? ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLocalEdits((prev) => ({
                      ...prev,
                      [name]: e.target.value,
                    }))
                  }
                  disabled={isSaving}
                />
              </div>
            ))}

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle size={14} /> {error}
              </p>
            )}
          </div>
        )}
      </div>

      {!disableDelete && document && (
        <DeleteDocumentDialog
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          documents={[
            {
              _id: props.documentID,
              title: documentTitle,
            },
          ]}
          collectionSlug={props.collection.slug}
          singularLabel={singularLabel}
          pluralLabel={pluralLabel}
          onDeleted={() => {
            router.push(
              `${props.config.basePath}/${props.collection.slug}`,
            );
          }}
        />
      )}
    </div>
  );
}
