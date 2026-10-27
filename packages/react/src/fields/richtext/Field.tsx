"use client";

import { useState, type ComponentType } from "react";
import type { AnyFieldApi } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { useDebounceValue } from "@ts-hooks-kit/core";
import {
  vexConvexApi,
  type AdminDataField,
  type FieldComponentProps,
  type RichTextDocument,
  type RichTextField,
  type VexEditorComponentProps,
  type VexMediaDocument,
} from "@vexcms/core";
import { useVexMutation } from "../../hooks";
import { toast } from "sonner";
import { getVexErrorMessage } from "../../utils/errors";
import { useFieldContext, useFormContext, isFieldShowingError } from "../../forms";
import { FieldError, FieldGroupBox } from "../../ui/field";
import { useVexConfig } from "../../config/VexConfigContext";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * Extracts a field's current validation-error message, if any. TanStack
 * Form v1 stores Standard Schema issue objects in `errors[]`, not strings —
 * this reads `.message` when the error is an object (Zod v4 issues carry
 * `{ origin, code, minimum, inclusive, path, message }`).
 *
 * @param field - The field instance to read the current validation error from.
 * @returns The error message, or `undefined` if the field has no error.
 */
function getFieldErrorMessage(field: AnyFieldApi): string | undefined {
  const rawError = field.state.meta.errors[0];
  return typeof rawError === "string"
    ? rawError
    : (rawError as { message?: string } | undefined)?.message;
}

/**
 * Rich text admin field's own render body.
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
 * @param props - {@link FieldComponentProps} narrowed to `RichTextField`.
 * @returns The rich text field's render body.
 */
function RichTextFieldAdminInner(props: FieldComponentProps<{}, RichTextField>) {
  const field = useFieldContext<RichTextDocument>();
  const config = useVexConfig();
  // Both readOnly sources are independent — either one alone disables
  // editing, matching every other field type's own OR-composition.
  const isReadOnly = props.readOnly || props.fieldDef.admin.readOnly;

  // Inline-image target — optional, unlike `upload()`'s required `to`. An
  // unknown slug already threw `VexStorageConfigError` at `defineConfig()`.
  const targetCollectionConfig = props.fieldDef.mediaCollectionSlug
    ? config.mediaCollections.find((mc) => mc.slug === props.fieldDef.mediaCollectionSlug)
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
      id={`${props.name}-label`}
      className="relative flex items-center gap-2 text-sm leading-none font-medium select-none"
    >
      {props.index !== undefined ? `[${props.index + 1}] - ` : ""}
      {props.fieldDef.label || props.name}
      {props.fieldDef.required && <span className="text-red-500">*</span>}
    </span>
  );

  if (!config.editor) {
    return (
      <FieldGroupBox labelId={`${props.name}-label`} label={label} description={props.fieldDef.description}>
        <div
          role="alert"
          className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
        >
          Rich text field <code>{props.name}</code> needs an editor adapter. Add{" "}
          <code>editor: plateEditor()</code> (from{" "}
          <code>@vexcms/richtext-plate</code>) to your <code>vex.config.ts</code>.
        </div>
      </FieldGroupBox>
    );
  }

  const EditorComponent = config.editor
    .editorComponent as ComponentType<VexEditorComponentProps>;

  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const showError = isFieldShowingError({ field, submissionAttempts });
  const errorMessage = getFieldErrorMessage(field);

  return (
    <FieldGroupBox
      labelId={`${props.name}-label`}
      label={label}
      description={props.fieldDef.description}
      disabled={isReadOnly}
      error={showError && <FieldError role="alert">{errorMessage}</FieldError>}
    >
      <EditorComponent
        value={field.state.value ?? props.fieldDef.defaultValue ?? []}
        onChange={(next) => field.handleChange(next)}
        readOnly={isReadOnly}
        name={props.name}
        label={props.fieldDef.label}
        description={props.fieldDef.description}
        placeholder={props.fieldDef.admin.placeholder}
        mediaCollectionSlug={props.fieldDef.mediaCollectionSlug}
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
    </FieldGroupBox>
  );
}

/**
 * Rich text admin field — binds `props.name` to the nearest `<AppForm>` (or
 * an explicit `field` prop) via `AdminFieldBinding`, then renders the
 * configured editor adapter.
 *
 * @param props - {@link FieldComponentProps} narrowed to `RichTextField`.
 * @returns The rich text field's rendered state.
 */
export function RichTextFieldAdmin(
  props: FieldComponentProps<{}, RichTextField> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <RichTextFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
