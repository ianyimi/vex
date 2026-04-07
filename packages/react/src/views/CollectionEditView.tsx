import { useQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { useForm } from "@tanstack/react-form";
import { vexConvexApi } from "@vexcms/core";
import type { CollectionEditViewProps } from "@vexcms/core";
import { AppForm } from "~/components/form/AppForm";
import { VexLink } from "~/components/ui/VexLink";
import { Button } from "~/components/ui/button";
import { fieldToInputComponent } from "~/fields";

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
      collection: props.collection.slug,
      id: props.documentId ?? "",
    }),
    initialData: props.initialData,
    enabled: isEditing,
  });

  // Build defaultValues from the fetched document (or empty strings for new).
  // Keys match collection field keys — the same keys passed as `name` to each input.
  const defaultValues = Object.fromEntries(
    Object.keys(props.collection.fields).map((key) => [
      key,
      typeof document?.[key] === "string" ? document[key] : "",
    ]),
  ) as Record<string, string>;

  const form = useForm({
    defaultValues,
    onSubmit: async () => {
      // Wired in a future spec — save mutation goes here
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {isEditing
          ? `Edit ${props.collection.labels.singular}`
          : `New ${props.collection.labels.singular}`}
      </h1>
      {/* @ts-expect-error TODO: fix incorrect form type */}
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
          <Button type="submit">Save</Button>
          <Button
            type="button"
            variant="outline"
            render={<VexLink href={`/admin/${props.collection.slug}`} />}
          >
            Cancel
          </Button>
        </div>
      </AppForm>
    </div>
  );
}
