"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type {
  MediaCollectionConfig,
  MediaCollectionMeta,
  MediaCollectionSlug,
  VexMediaDocument,
} from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import { useCollectionForm } from "../../hooks/useCollectionForm";

/**
 * Props passed to the `CollectionEditView` component.
 *
 * `TCollectionSlug` is inferred from the `collection` prop. After `vex generate` runs,
 * passing a collection of the wrong slug is a compile-time error.
 *
 * @see {@link ViewComponentMap}
 */
export interface MediaCollectionEditViewProps<
  TFieldMeta extends {} = {},
  TCollectionMeta extends MediaCollectionMeta = MediaCollectionMeta,
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
> {
  /** The resolved collection configuration whose fields will be rendered. */
  collection: MediaCollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug>;
  /**
   * The Convex document ID of the document being edited.
   * Omit for new document creation — the form will be empty.
   */
  documentId: VexMediaDocument["_id"];
  /**
   * Pre-fetched document from the server for SSR hydration.
   * `null` explicitly means "no document found". `undefined` means "not loaded yet".
   */
  initialData?: VexMediaDocument | null;
}

/**
 * Collection document edit form.
 *
 * Fetches the document when editing via `vexConvexApi.get` (TanStack Query +
 * Convex subscription), initialises a `useCollectionForm` instance with the
 * current field values, and renders an `<AppForm>` with one input component per
 * field. Submits via `vexConvexApi.update`. Field inputs connect to the form
 * through `AppFormContext` — no controller prop needed.
 *
 * `TSlug` is inferred from the `collection` prop. After running `vex generate`,
 * passing a collection of one slug where another is expected is a type error.
 *
 * @param props - View props
 * @param props.collection - The collection whose fields are rendered.
 * @param props.documentId - Convex document ID to fetch and edit. Omit for new-document mode.
 * @param props.initialData - Server-prefetched document for SSR hydration. `null` means not found.
 * @returns The edit form, or a not-found message when the document cannot be loaded.
 *
 * @example
 * ```tsx
 * // New document
 * <CollectionEditView collection={postsCollection} />
 *
 * // Editing existing document
 * <CollectionEditView
 *   collection={postsCollection}
 *   documentId="k573abc..."
 *   initialData={serverDoc}
 * />
 * ```
 */
export function MediaCollectionEditView<
  TFieldMeta extends {} = {},
  TCollectionMeta extends MediaCollectionMeta = MediaCollectionMeta,
  TSlug extends MediaCollectionSlug = MediaCollectionSlug,
>(props: MediaCollectionEditViewProps<TFieldMeta, TCollectionMeta, TSlug>) {
  // Generic over `TSlug` — see the note in `CollectionEditView`: the slug is a
  // runtime value here, so this uses the generic endpoint rather than the
  // per-slug `get()` wrapper.
  const { data } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId as string,
      collection: props.collection.slug,
    }),
    initialData: props.initialData,
  });
  const currentDocument = data as VexMediaDocument;

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.update),
  });
  const form = useCollectionForm({
    document: currentDocument,
    collection: props.collection,
    onSubmit: async ({ value }: { value: any }) => {
      await mutateAsync({
        id: currentDocument._id,
        collection: props.collection.slug,
        data: value,
      });
      form.reset();
    },
  });

  return (
    <AppForm form={form} className="relative flex flex-col gap-4 pt-4">
      <div className="bg-background sticky top-12 z-10 flex h-16 items-center justify-between">
        <h1 className="text-2xl font-bold">
          Edit {props.collection.labels.singular} -{" "}
          {/* @ts-expect-error currentDocument[props.collection.admin.useAsTitle]: string */}
          <span className="text-primary">{currentDocument[props.collection.admin.useAsTitle]}</span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex gap-2">
              <Button
                type="submit"
                className="transition-all duration-300"
                isPending={isPending}
                disabled={isDefaultValue}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="transition-all duration-300"
                disabled={isDefaultValue}
                onClick={() => {
                  form.reset();
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        />
      </div>
      <div className="space-y-4">
        {Object.entries(props.collection.fields)
          .filter(([_, fieldDef]) => !fieldDef.admin.hidden)
          .map(([fieldKey, field]) => {
            const InputComponent = fieldToInputComponent(field.type);
            if (!InputComponent) {
              // TODO: handle missing component error here
              throw new Error(`Missing component for field type '${field.type}'`);
            }
            return (
              <InputComponent
                key={fieldKey}
                name={fieldKey}
                fieldDef={field}
                readOnly={field.admin.readOnly}
                collection={props.collection}
              />
            );
          })}
      </div>
    </AppForm>
  );
}
