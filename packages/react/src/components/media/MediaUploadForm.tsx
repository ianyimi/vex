"use client";

import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi, formatBytes, formatMimeType } from "@vexcms/core";
import type { MediaCollectionConfig, StorageAdapterSlug, UploadField } from "@vexcms/core";
import { Button, Icon, Input, Label } from "../ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { AppForm } from "../form/AppForm";

/**
 * Props for MediaUploadForm component.
 */
export interface MediaUploadFormProps {
  /** The media collection configuration. */
  collection: MediaCollectionConfig;
  /** The storage adapter name. */
  adapterName: StorageAdapterSlug;
  /** Whether to allow multiple file selection (from field.hasMany). */
  multi: boolean;
  /** The UploadField of the field being uploaded to. */
  fieldDef: UploadField;
  /** Pre-staged files from EmptyInput or direct drops in the modal. */
  stagedFiles?: File[];
  /** Called with array of created media document IDs after successful upload. */
  onComplete: (mediaIds: string[]) => void;
  /** Called when user cancels upload or closes modal. */
  onCancel: () => void;
}

// /**
//  * Internal staged file representation with editable metadata.
//  *
//  * Each staged file has a temporary client-side ID and stores both the File
//  * object and editable metadata fields (filename, alt). Additional fields from
//  * the media collection config can be added here.
//  */
// interface StagedFile {
//   /** Temporary client-side ID (crypto.randomUUID()). */
//   id: string;
//   /** The File object to upload. */
//   file: File;
//   /** Editable filename (default: file.name). */
//   filename: string;
//   /** Editable alt text (default: empty string). */
//   alt: string;
//   /** Auto-detected MIME type (file.type). */
//   mimeType: string;
//   /** Auto-detected file size in bytes (file.size). */
//   size: number;
// }

/**
 * Two-step upload form for MediaPicker's "Upload new" tab.
 *
 * Uses TanStack Form array field API (field.pushValue, field.removeValue).
 * Pattern follows FormArray and FormBlocks.
 *
 * Step 1 (empty state): Dropzone + file picker for staging files.
 * Step 2 (files staged): Accordion forms for editing metadata before upload.
 *
 * Uploads all files in parallel with Promise.all, shows progress as fraction
 * (e.g. "2/5"), and auto-closes modal on success.
 *
 * **Key behavior:**
 * - Does NOT upload immediately on file selection
 * - Stages files using TanStack Form array field API (field.pushValue)
 * - Lets user edit metadata via form.Field components
 * - Uploads on "Create & select" button click
 * - Single-select mode (multi={false}): only one file at a time
 * - Multi-select mode (multi={true}): multiple files, "Add more" button
 *
 * @param props - Component props.
 */
export function MediaUploadForm({
  fieldDef,
  collection,
  adapterName,
  multi,
  stagedFiles = [],
  onComplete,
  onCancel,
}: MediaUploadFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });

  const { mutateAsync: createMediaDoc } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.createMediaDocument),
  });

  // Initialize TanStack Form with array field
  const form = useForm({
    defaultValues: {
      files: stagedFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        filename: file.name,
        alt: "",
        mimeType: file.type,
        size: file.size,
      })),
    },
    onSubmit: async ({ value }) => {
      const files = value.files;

      try {
        const createdIds = await Promise.all(
          files.map(async (fileData) => {
            // 1. Generate upload URL
            const { url } = await generateUploadUrl({ adapter: adapterName });

            // 2. Upload file to Convex storage
            const uploadResponse = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": fileData.file.type },
              body: fileData.file,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Upload failed for ${fileData.filename}`);
            }

            const { storageId } = await uploadResponse.json();

            // 3. Create media document
            const mediaDocId = await createMediaDoc({
              adapter: adapterName,
              collectionSlug: collection.slug,
              storageId,
              filename: fileData.filename,
              mimeType: fileData.file.type,
              size: fileData.file.size,
              alt: fileData.alt,
            });

            return mediaDocId;
          }),
        );

        onComplete(createdIds);
        form.reset();
      } catch (error) {
        console.error("Upload failed:", error);
        // TODO: Show error toast
      }
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    // Access the files field to add files
    const filesFieldState = form.getFieldValue("files");
    const staged = droppedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      alt: "",
      mimeType: file.type,
      size: file.size,
    }));

    if (multi) {
      // Multi-select: append to existing
      form.setFieldValue("files", [...filesFieldState, ...staged]);
    } else {
      // Single-select: replace all
      form.setFieldValue("files", staged);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const filesFieldState = form.getFieldValue("files");
    const staged = selectedFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      filename: file.name,
      alt: "",
      mimeType: file.type,
      size: file.size,
    }));

    if (multi) {
      form.setFieldValue("files", [...filesFieldState, ...staged]);
    } else {
      form.setFieldValue("files", staged);
    }

    e.target.value = "";
  };

  return (
    <AppForm form={form}>
      <form.Field name="files" mode="array">
        {(filesField) => {
          const files = filesField.state.value ?? [];

          // Empty state - show dropzone
          if (files.length === 0) {
            return (
              <>
                <div>
                  <div
                    className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-12 text-center transition-colors hover:border-primary/50 hover:bg-primary/5"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Icon name="Image" size={24} className="text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop Files here, or click to choose</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        PNG, JPG, SVG, WebP · up to 10 MB · stored via {adapterName}
                      </p>
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      multiple={multi}
                      accept={fieldDef.accept}
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border bg-muted/30 px-5 py-3">
                  <span className="text-xs text-muted-foreground">Step 1 of 2 · choose files</span>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={onCancel}>
                      Cancel
                    </Button>
                    <Button disabled>Create &amp; select</Button>
                  </div>
                </div>
              </>
            );
          }

          // Files staged - show accordion forms
          return (
            <>
              <div className="flex max-h-[420px] flex-col gap-4 overflow-y-auto">
                <Accordion multiple defaultValue={files.map((f) => f.id)}>
                  {files.map((fileData, index) => (
                    <AccordionItem key={fileData.id} value={fileData.id}>
                      <AccordionTrigger
                        postIconChildren={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => filesField.removeValue(index)}
                            className="text-destructive hover:text-destructive/60 ml-4"
                            disabled={form.state.isSubmitting}
                            icon="Trash"
                          />
                        }
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground tabular-nums">
                            {index + 1}
                          </span>
                          <Icon name="Image" size={14} />
                          <span className="truncate max-w-[200px] text-sm font-medium">
                            {fileData.filename}
                          </span>
                          <span className="ml-auto text-xs text-muted-foreground">
                            {formatMimeType(fileData.mimeType)} · {formatBytes(fileData.size)}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-4 pt-3">
                          {/* Filename field */}
                          <form.Field name={`files[${index}].filename`}>
                            {(field) => (
                              <div className="space-y-1.5">
                                <Label htmlFor={field.name} className="text-xs font-medium">
                                  Filename{" "}
                                  {collection.fields.alt?.required && (
                                    <span className="text-destructive">*</span>
                                  )}
                                </Label>
                                <Input
                                  id={field.name}
                                  value={field.state.value}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                  className="h-9 text-sm"
                                />
                              </div>
                            )}
                          </form.Field>

                          {/* Alt text field */}
                          <form.Field name={`files[${index}].alt`}>
                            {(field) => (
                              <div className="space-y-1.5">
                                <Label htmlFor={field.name} className="text-xs font-medium">
                                  Alt text
                                </Label>
                                <Input
                                  id={field.name}
                                  value={field.state.value}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                  placeholder="Describe the image"
                                  className="h-9 text-sm"
                                />
                              </div>
                            )}
                          </form.Field>

                          {/* TODO: Render other fields from collection.fields using fieldToInputComponent */}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>

              <div className="flex items-center justify-between border-t border-border bg-muted/30 py-3">
                {multi && (
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={form.state.isSubmitting}
                      className="self-start"
                      icon="Plus"
                    >
                      Add {collection.labels.plural}
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      multiple={fieldDef.hasMany}
                      accept={fieldDef.accept}
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={form.state.isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => form.handleSubmit()}
                    disabled={form.state.isSubmitting}
                  >
                    {form.state.isSubmitting ? "Uploading..." : `Create & select (${files.length})`}
                  </Button>
                </div>
              </div>
            </>
          );
        }}
      </form.Field>
    </AppForm>
  );
}
