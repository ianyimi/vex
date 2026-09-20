"use client";

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { CRUD_ACTIONS, isFieldAllowed, vexConvexApi } from "@vexcms/core";
import type { MediaCollectionSlug, VexMediaDocument } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import {
  useCollectionForm,
  useFieldPermissions,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { useVexConfig } from "../../context/VexConfigContext";

/**
 * Props passed to the `MediaCollectionEditView` component.
 *
 * `TCollectionSlug` narrows to a literal when the caller supplies one — see
 * the note on {@link CollectionListViewProps} in `@vexcms/core`.
 */
export interface MediaCollectionEditViewProps<
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
> {
  /** The slug of the media collection whose fields will be rendered. */
  collection: TCollectionSlug;
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
 * Media collection document edit form.
 *
 * @param props - View props.
 * @param props.collection - The slug of the media collection whose fields are rendered.
 * @param props.documentId - Convex document ID to fetch and edit. Omit for new-document mode.
 * @param props.initialData - Server-prefetched document for SSR hydration. `null` means not found.
 * @returns The edit form, or a not-found message.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 */
export function MediaCollectionEditView<
  TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug,
>(props: MediaCollectionEditViewProps<TCollectionSlug>) {
  const config = useVexConfig();
  const collection = config.mediaCollections.find((c) => c.slug === props.collection);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  // Generic over `TCollectionSlug` — see the note in `CollectionEditView`: the slug is a
  // runtime value here, so this uses the generic endpoint rather than the
  // per-slug `get()` wrapper.
  const { data } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId as string,
      collection: collection.slug,
    }),
    initialData: props.initialData,
  });
  const currentDocument = data as VexMediaDocument;

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: "update",
  });
  const visibleFields = useVisibleFields({
    resource: collection.slug,
    fields: collection.fields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useCollectionForm({
    document: currentDocument,
    collection,
    readableFieldKeys,
    onSubmit: async () => {
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({
        id: currentDocument._id,
        collection: collection.slug,
        data: changes,
      });
      form.reset();
    },
  });

  useLiveFieldMerge({
    form,
    document: currentDocument,
    fieldKeys: readableFieldKeys,
  });

  const canEdit = usePermission({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    data: data as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument,
  });

  return (
    <AppForm form={form} className="relative flex flex-col gap-4 pt-4">
      <div className="bg-background sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-y-2">
        <h1 className="text-2xl font-bold">
          Edit {collection.labels.singular} -{" "}
          {/* @ts-expect-error currentDocument[collection.admin.useAsTitle]: string */}
          <span className="text-primary">{currentDocument[collection.admin.useAsTitle]}</span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                className="transition-all duration-300"
                isPending={isPending}
                disabled={!canEdit || isDefaultValue}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="transition-all duration-300"
                disabled={!canEdit || isDefaultValue}
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
        {visibleFields
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
                readOnly={
                  field.admin.readOnly || !canEdit || !isFieldAllowed(fieldPermissions, fieldKey)
                }
                collection={collection}
              />
            );
          })}
      </div>
    </AppForm>
  );
}
