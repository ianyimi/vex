"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { VexCollection, VexField } from "@vexcms/core";
import { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "@vexcms/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
} from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";
import { AlertCircle } from "lucide-react";
import { useUrlToFile } from "../hooks/useUrlToFile";
import { MediaFileSection } from "./MediaFileSection";

interface CreateMediaDialogProps {
  open: boolean;
  onClose: () => void;
  collection: VexCollection;
  onCreated: (props: { documentId: string }) => void;
}

const STANDARD_MEDIA_FIELDS = new Set([
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

export function CreateMediaDialog(props: CreateMediaDialogProps) {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [altText, setAltText] = useState("");
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [height, setHeight] = useState<number | undefined>(undefined);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pending metadata from either file or URL
  const [pendingMeta, setPendingMeta] = useState<{
    filename: string;
    mimeType: string;
    size: number;
  } | null>(null);

  // Whether the file came from URL (storageId already exists) or from dropzone (needs upload)
  const [urlStorageId, setUrlStorageId] = useState<string | null>(null);

  const urlToFile = useUrlToFile({
    maxSize: (props.collection as any).maxSize ?? 25 * 1024 * 1024,
  });

  const generateUploadUrl = useMutation(anyApi.vex.media.generateUploadUrl);
  const createMediaDocument = useMutation(anyApi.vex.media.createMediaDocument);

  // Custom fields (not standard media fields, not hidden)
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

  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  // When URL fetch succeeds, populate metadata
  useEffect(() => {
    if (urlToFile.result) {
      setPendingMeta({
        filename: urlToFile.result.filename,
        mimeType: urlToFile.result.mimeType,
        size: urlToFile.result.size,
      });
      setFilename(urlToFile.result.filename.replace(/\.[^.]+$/, ""));
      setUrlStorageId(urlToFile.result.storageId);
      setPendingFile(null);
      setPendingPreviewUrl(null);
    }
  }, [urlToFile.result]);

  // When file selected via dropzone
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
      setFilename(file.name.replace(/\.[^.]+$/, ""));
      setUrlStorageId(null);
      urlToFile.clear();

      // Extract dimensions for images
      const dims = await extractImageDimensions(file);
      if (dims) {
        setWidth(dims.width);
        setHeight(dims.height);
      } else {
        setWidth(undefined);
        setHeight(undefined);
      }
    },
    [urlToFile],
  );

  const handleClearFile = useCallback(() => {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingFile(null);
    setPendingPreviewUrl(null);
    setPendingMeta(null);
    setFilename("");
    setUrlStorageId(null);
    setWidth(undefined);
    setHeight(undefined);
  }, [pendingPreviewUrl]);

  function handleClose() {
    handleClearFile();
    setAltText("");
    setError(null);
    setIsCreating(false);
    setCustomValues({});
    urlToFile.clear();
    props.onClose();
  }

  async function handleCreate() {
    if (!pendingFile && !urlStorageId) {
      setError("Please select a file or enter a URL");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      let storageId: string;

      if (urlStorageId) {
        // File came from URL — already in storage
        storageId = urlStorageId;
      } else if (pendingFile) {
        // File from dropzone — upload it
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
        storageId = data.storageId;
      } else {
        throw new Error("No file available");
      }

      const docId = await createMediaDocument({
        collectionSlug: props.collection.slug,
        fields: {
          storageId,
          filename: filename || pendingMeta?.filename || "untitled",
          mimeType: pendingMeta?.mimeType || "application/octet-stream",
          size: pendingMeta?.size || 0,
          url: "", // Resolved from storageId at query time
          alt: altText,
          ...(width != null ? { width } : {}),
          ...(height != null ? { height } : {}),
          ...customValues,
        },
      });

      props.onCreated({ documentId: docId as string });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
      setIsCreating(false);
    }
  }

  const hasFile = !!pendingFile || !!urlStorageId;
  const singularLabel =
    props.collection.labels?.singular ?? props.collection.slug;

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!open && !isCreating) handleClose();
      }}
    >
      <DialogContent
        className="w-[90vw] md:w-[70vw] lg:w-[50vw] max-h-[90vh] flex flex-col"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle>Create {singularLabel}</DialogTitle>
        </DialogHeader>

        <div
          className="min-h-0 flex-1 overflow-y-auto p-6 space-y-4"
          key={props.open ? "open" : "closed"}
        >
          <MediaFileSection
            layout="stacked"
            currentFile={null}
            hasPendingFile={hasFile}
            pendingFile={pendingFile}
            pendingPreviewUrl={pendingPreviewUrl}
            pendingMetadata={pendingMeta}
            onFileSelect={handleFileSelect}
            onClearPendingFile={handleClearFile}
            urlToFile={urlToFile}
            accept={(props.collection as any).accept}
            maxSize={(props.collection as any).maxSize}
            disabled={isCreating}
          />

          <div className="space-y-2">
            <Label htmlFor="media-filename">Filename</Label>
            <Input
              id="media-filename"
              value={filename}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFilename(e.target.value)
              }
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media-alt">Alt Text</Label>
            <Input
              id="media-alt"
              value={altText}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setAltText(e.target.value)
              }
              placeholder="Describe this file for accessibility"
              disabled={isCreating}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="media-width">Width (px)</Label>
              <Input
                id="media-width"
                type="number"
                value={width ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setWidth(e.target.value ? Number(e.target.value) : undefined)
                }
                disabled={isCreating}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="media-height">Height (px)</Label>
              <Input
                id="media-height"
                type="number"
                value={height ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setHeight(
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
                disabled={isCreating}
              />
            </div>
          </div>

          {customFields.map(({ name, field }) => (
            <div key={name} className="space-y-2">
              <Label htmlFor={`media-${name}`}>
                {field.label ?? name}
              </Label>
              <Input
                id={`media-${name}`}
                value={(customValues[name] as string) ?? ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCustomValues((prev) => ({ ...prev, [name]: e.target.value }))
                }
                disabled={isCreating}
              />
            </div>
          ))}

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircle size={14} /> {error}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t p-6 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!hasFile || isCreating || urlToFile.isFetching}
          >
            {isCreating ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type { CreateMediaDialogProps };
