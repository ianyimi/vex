"use client";

import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { CRUD_ACTIONS, isFieldAllowed, vexConvexApi } from "@vexcms/core";
import type { CollectionEditViewProps, CollectionSlug } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { RevalidateButton } from "../RevalidateButton";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import { useCollectionForm } from "../../hooks/useCollectionForm";
import {
  useFieldPermissions,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";

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
export function CollectionEditView<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TSlug extends CollectionSlug = CollectionSlug,
>(props: CollectionEditViewProps<TFieldMeta, TCollectionMeta, TSlug>) {
  // This view is generic over `TSlug` — the collection is only known at
  // runtime, so it queries the generic endpoint (`VexDocument`) directly. The
  // per-slug `get()` wrapper from `@vexcms/core/client` narrows only when the
  // slug is a literal at the call site, which is not the case here.
  const { data: currentDocument } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId,
      collection: props.collection.slug,
    }),
    initialData: props.initialData,
  });

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  const { mutateAsync, isPending } = useVexMutation({
    collection: props.collection.slug,
    // The edit view holds both states: the loaded document, and that document
    // merged with the submitted values.
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: CRUD_ACTIONS.update,
  });
  const visibleFields = useVisibleFields({
    resource: props.collection.slug,
    fields: props.collection.fields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useCollectionForm({
    document: currentDocument,
    collection: props.collection,
    readableFieldKeys,
    onSubmit: async () => {
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({
        id: currentDocument._id,
        collection: props.collection.slug,
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
    resource: props.collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument,
  });
  const fieldPermissions = useFieldPermissions({
    resource: props.collection.slug,
    action: CRUD_ACTIONS.update,
    data: currentDocument,
  });
  return (
    <AppForm form={form} className="relative">
      <div className="sticky top-12 z-10 flex h-16 items-center justify-between bg-background">
        <h1 className="text-2xl font-bold">
          Edit {props.collection.labels.singular} -{" "}
          <span className="text-primary">
            {String(currentDocument[props.collection.admin.useAsTitle] ?? "")}
          </span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex gap-2">
              <RevalidateButton collection={props.collection.slug} doc={currentDocument} />
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
        {visibleFields.map(([fieldKey, field]) => {
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
                !canEdit || field.admin.readOnly || !isFieldAllowed(fieldPermissions, fieldKey)
              }
              collection={props.collection}
            />
          );
        })}
      </div>
    </AppForm>
  );
}
