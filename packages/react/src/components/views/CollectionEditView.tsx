"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionEditViewProps, CollectionSlug } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { VexLink } from "../ui/VexLink";
import { Button } from "../ui/button";
import { fieldToInputComponent } from "../fields";
import { useCollectionForm } from "../../hooks/useCollectionForm";
import { get } from "@vexcms/core/client";

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
  const { data: currentDocument } = useQuery({
    // documentId comes from URL params (string). GenericId<TSlug> is the
    // branded Convex type but the runtime value is identical — cast here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...get({ id: props.documentId as any }),
    initialData: props.initialData,
  });

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: async ({ value }: { value: any }) => {
      await mutateAsync({ id: currentDocument._id, data: value });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Edit {props.collection.labels.singular} -{" "}
        <span className="text-primary">
          {currentDocument[props.collection.admin.useAsTitle]}
        </span>
      </h1>
      <AppForm form={form} className="space-y-4">
        {Object.entries(props.collection.fields).map(([fieldKey, field]) => {
          const InputComponent = fieldToInputComponent(field.type);
          if (!InputComponent) {
            // TODO: handle missing component error here
            return null;
          }
          return (
            <InputComponent
              key={fieldKey}
              name={fieldKey}
              fieldDef={field}
              readOnly={field.admin.readOnly}
            />
          );
        })}
        <div className="pt-2 flex gap-2">
          <Button type="submit" isPending={isPending}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            nativeButton={false}
            render={<VexLink href={`/admin/${props.collection.slug}`} />}
          >
            Cancel
          </Button>
        </div>
      </AppForm>
    </div>
  );
}
