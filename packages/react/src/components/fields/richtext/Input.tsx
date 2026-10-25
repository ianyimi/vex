"use client";

import { useState, type ComponentType } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { useDebounceValue } from "@ts-hooks-kit/core";
import {
  vexConvexApi,
  type AdminDataField,
  type RichTextDocument,
  type RichTextField,
  type VexEditorComponentProps,
  type VexMediaDocument,
} from "@vexcms/core";
import { useVexMutation } from "../../../hooks";
import { toast } from "sonner";
import { getVexErrorMessage } from "../../../lib/errors";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormError } from "../../form/FormError";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Rich text field input component for the admin edit form.
 *
 * Reads the configured editor adapter from `useVexConfig().editor` and
 * renders its `editorComponent` — VexCMS ships no editor of its own
 * (`@vexcms/richtext-plate`'s `plateEditor()` is the reference adapter); a
 * project with a `richtext()` field but no `editor:` entry in `vex.config.ts`
 * sees a configuration error here, never a crash or a silent plain-text
 * fallback (Design Decision 7).
 *
 * Renders inside a `role="group" aria-labelledby` wrapper (LABEL-1), like
 * `array`/`group`/`blocks`/`upload`: the editor adapter's root element is
 * never a single native form control a `<label htmlFor>` could point at.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<RichTextDocument>`) from a `<form.Field>` render prop.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <RichTextFieldInput name="body" fieldDef={bodyField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const RichTextFieldInput = createFieldInput<
  RichTextDocument,
  {},
  RichTextField
>(({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
  const config = useVexConfig();
  // Both readOnly sources are independent — either one alone disables
  // editing, matching every other field type's own OR-composition.
  const isReadOnly = readOnly || fieldDef.admin.readOnly;

  // Inline-image target — optional, unlike `upload()`'s required `to`. An
  // unknown slug already threw `VexStorageConfigError` at `defineConfig()`.
  const targetCollectionConfig = fieldDef.mediaCollectionSlug
    ? config.mediaCollections.find((mc) => mc.slug === fieldDef.mediaCollectionSlug)
    : undefined;
  const adapterName = targetCollectionConfig?.meta.storageAdapter;

  // Media search state, mirroring `MediaLibraryGrid`.
  const [mediaSearchTerm, setMediaSearchTerm] = useState("");
  const [debouncedSearch] = useDebounceValue(mediaSearchTerm, 200);
  const [mediaLimit, setMediaLimit] = useState(24);

  const { data: allResults = [], isPending: allPending } = useQuery({
    ...convexQuery(
      vexConvexApi.find,
      !targetCollectionConfig || debouncedSearch.length > 0
        ? "skip"
        : { collection: targetCollectionConfig.slug, limit: mediaLimit },
    ),
    enabled: !!targetCollectionConfig && debouncedSearch.length === 0,
  });
  const { data: searchResults = [], isPending: searchPending } = useQuery({
    ...convexQuery(
      vexConvexApi.search,
      !targetCollectionConfig || debouncedSearch.length === 0
        ? "skip"
        : {
            collection: targetCollectionConfig.slug,
            query: debouncedSearch,
            searchField: targetCollectionConfig.admin.useAsTitle,
            limit: mediaLimit,
            searchIndexName: `search_${targetCollectionConfig.admin.useAsTitle}`,
          },
    ),
    enabled: !!targetCollectionConfig && debouncedSearch.length > 0,
  });
  const mediaResults = (
    debouncedSearch.length > 0 ? searchResults : allResults
  ) as VexMediaDocument[];
  const mediaIsLoading = debouncedSearch.length > 0 ? searchPending : allPending;

  const { mutateAsync: generateUploadUrl } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.media.generateUploadUrl),
  });
  const { mutateAsync: createMediaDoc } = useVexMutation({
    collection: targetCollectionConfig?.slug ?? "",
    getChanges: ({ args, result }) => [{ after: { ...args, _id: result } }],
    mutationFn: vexConvexApi.media.createMediaDocument,
    operation: "create",
  });
  const queryClient = useQueryClient();

  /**
   * Surfaces an upload-pipeline failure as a long-lived error toast, then
   * rethrows so the editor's own UI (the popover's inline error) also reacts.
   * Errors stay longer than the default toast: they carry action the user
   * must read (permission denied, misconfigured collection), not a status.
   *
   * @param error - The failure to report.
   * @throws Always rethrows `error`.
   */
  function reportMediaError(error: unknown): never {
    toast.error("Image upload failed", {
      description: getVexErrorMessage(error),
      duration: 10_000,
    });
    throw error;
  }

  async function handleGenerateUploadUrl(): Promise<string> {
    if (!adapterName || !targetCollectionConfig) {
      throw new Error("Media collection not configured");
    }
    try {
      const { url } = await generateUploadUrl({
        adapter: adapterName,
        collection: targetCollectionConfig.slug,
      });
      return url;
    } catch (error) {
      reportMediaError(error);
    }
  }

  async function handleCreateMediaDocument(props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }): Promise<{ mediaId: string; url?: string }> {
    if (!adapterName) throw new Error("Media collection not configured");
    try {
      const mediaId = await createMediaDoc({
        adapter: adapterName,
        collectionSlug: props.collectionSlug,
        storageId: props.fields.storageId as string,
        filename: props.fields.filename as string,
        mimeType: props.fields.mimeType as string,
        size: props.fields.size as number,
        alt: props.fields.alt as string | undefined,
      });
      // Resolves the same `src` the server computed at doc-creation time.
      const { url } = await queryClient.fetchQuery(
        convexQuery(vexConvexApi.media.getUrl, { adapter: adapterName, mediaId }),
      );
      return { mediaId, url };
    } catch (error) {
      reportMediaError(error);
    }
  }

  const label = (
    <span
      id={`${name}-label`}
      className="relative flex items-center gap-2 text-sm leading-none font-medium select-none"
    >
      {index !== undefined ? `[${index + 1}] - ` : ""}
      {fieldDef.label || name}
      {fieldDef.required && <span className="text-red-500">*</span>}
    </span>
  );

  if (!config.editor) {
    return (
      <div
        className="flex flex-col gap-1.5"
        role="group"
        aria-labelledby={`${name}-label`}
      >
        {label}
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          Rich text field <code>{name}</code> needs an editor adapter. Add{" "}
          <code>editor: plateEditor()</code> (from{" "}
          <code>@vexcms/richtext-plate</code>) to your <code>vex.config.ts</code>.
        </div>
        <FormDescription field={fieldDef} />
      </div>
    );
  }

  const EditorComponent = config.editor
    .editorComponent as ComponentType<VexEditorComponentProps>;

  return (
    <div
      className="flex flex-col gap-1.5"
      role="group"
      aria-labelledby={`${name}-label`}
      aria-disabled={isReadOnly}
    >
      {label}
      <EditorComponent
        value={field.state.value ?? fieldDef.defaultValue ?? []}
        onChange={(next) => field.handleChange(next)}
        readOnly={isReadOnly}
        name={name}
        label={fieldDef.label}
        description={fieldDef.description}
        placeholder={fieldDef.admin.placeholder}
        mediaCollectionSlug={fieldDef.mediaCollectionSlug}
        mediaAltRequired={(targetCollectionConfig?.fields.alt as AdminDataField | undefined)?.required === true}
        mediaResults={targetCollectionConfig ? mediaResults : undefined}
        mediaSearchTerm={targetCollectionConfig ? mediaSearchTerm : undefined}
        onMediaSearchChange={targetCollectionConfig ? setMediaSearchTerm : undefined}
        mediaCanLoadMore={targetCollectionConfig ? mediaResults.length >= mediaLimit : undefined}
        onMediaLoadMore={
          targetCollectionConfig ? () => setMediaLimit((limit) => limit + 24) : undefined
        }
        mediaIsLoading={targetCollectionConfig ? mediaIsLoading : undefined}
        generateUploadUrl={targetCollectionConfig ? handleGenerateUploadUrl : undefined}
        createMediaDocument={targetCollectionConfig ? handleCreateMediaDocument : undefined}
      />
      <FormDescription field={fieldDef} />
      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
});
