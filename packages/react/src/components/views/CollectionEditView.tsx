"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionEditViewProps } from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { VexLink } from "../ui/VexLink";
import { Button } from "../ui/button";
import { fieldToInputComponent } from "../fields";
import { useCollectionForm } from "../../hooks/useCollectionForm";

/**
 * Collection document edit form.
 *
 * Fetches the document when editing, initialises a TanStack Form instance with
 * the current field values (or empty strings for new documents), and renders an
 * `<AppForm>` containing one input component per field. Field inputs read the
 * form instance from `AppFormContext` — no controller prop needed.
 *
 * The form key in `form.defaultValues` for each field is the collection field key
 * (e.g. `"title"`, `"slug"`). Each `<InputComponent name={fieldKey} ...>` connects
 * to that key via `createFieldInput`'s `form.Field name={props.name}` call.
 *
 * **Note:** form submission (create/update mutations) is wired in a future spec.
 * For now the form renders correctly but Save is a no-op.
 *
 * @param props - View props
 * @param props.collection - The collection configuration whose fields are rendered
 * @param props.documentId - Convex ID of the document being edited (omit for new)
 * @param props.initialData - Pre-fetched document from the server (for SSR)
 * @returns <CollectionEditView collection={postsCollection} />
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
export function CollectionEditView(props: CollectionEditViewProps) {
  const isEditing = Boolean(props.documentId);

  const { data: document } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: props.documentId ?? "",
    }),
    initialData: props.initialData,
    enabled: isEditing,
  });

  if (!document) {
    return <p>Document not found.</p>;
  }

  const updateDocument = useConvexMutation(vexConvexApi.update);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: updateDocument,
  });
  const form = useCollectionForm({
    document,
    collection: props.collection,
    onSubmit: async ({ value }) => {
      await mutateAsync({ id: document._id, data: value });
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isEditing
          ? `Edit ${props.collection.labels.singular}`
          : `New ${props.collection.labels.singular}`}
      </h1>
      <AppForm form={form} className="max-w-2xl space-y-4">
        {Object.entries(props.collection.fields).map(([fieldKey, field]) => {
          const InputComponent = fieldToInputComponent(field.type);
          if (!InputComponent) return null;
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
