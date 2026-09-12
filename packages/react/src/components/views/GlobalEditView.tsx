"use client";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { CRUD_ACTIONS, GlobalEditViewProps, isFieldAllowed, vexConvexApi } from "@vexcms/core";
import { AppForm } from "../form";
import {
  useFieldPermissions,
  useGlobalForm,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";

/**
 * Global document edit form.
 *
 * Fetches the current value via `vexConvexApi.globals.get` (TanStack Query +
 * Convex subscription), initialises a `useGlobalForm` instance with the
 * current field values, and renders an `<AppForm>` with one input component
 * per field. Submits via `vexConvexApi.globals.upsert`.
 *
 * @param props - View props.
 * @param props.global - The global config whose fields are rendered.
 * @param props.initialData - Server-prefetched document for SSR hydration.
 * @returns The edit form, or a not-found message when `global` is falsy.
 */
export function GlobalEditView({ global, initialData }: GlobalEditViewProps) {
  // Runtime slug (`global.slug`) — uses the generic endpoint rather than the
  // per-slug `getGlobal()` wrapper. See the note in `CollectionEditView`.
  const { data: globalDoc } = useQuery({
    ...convexQuery(vexConvexApi.globals.get, { slug: global.slug }),
    initialData,
  });

  const { mutateAsync, isPending } = useVexMutation({
    collection: global.slug,
    // A global has no per-document identity, so one change carrying the
    // upserted data is enough — a global's mapper keys on the slug, which
    // travels as `collection`. Merged with the loaded document (like
    // `CollectionEditView`'s own `getChanges`) so a partial diff still
    // resolves revalidation targets from the full post-write state.
    getChanges: ({ args }) => [{ after: { ...(globalDoc ?? {}), ...args.data } }],
    mutationFn: vexConvexApi.globals.upsert,
    operation: "upsert",
  });

  const visibleFields = useVisibleFields({
    resource: global.slug,
    fields: global.fields,
    data: globalDoc,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useGlobalForm({
    document: globalDoc,
    global,
    readableFieldKeys,
    onSubmit: async ({ value }: { value: unknown }) => {
      // A global has no separate create view: before the first save,
      // `globalDoc` is undefined and `value` carries the field defaults,
      // which a diff (built against those same defaults) would omit.
      if (!globalDoc) {
        await mutateAsync({ slug: global.slug, data: value as Record<string, unknown> });
        form.reset();
        return;
      }
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({ slug: global.slug, data: changes });
      form.reset();
    },
  });

  if (!global) {
    // TODO: add proper not found component or screen
    return <p>Global document not found.</p>;
  }

  useLiveFieldMerge({
    form,
    document: globalDoc,
    fieldKeys: readableFieldKeys,
  });

  const canEdit = usePermission({
    resource: global.slug,
    action: CRUD_ACTIONS.update,
    data: globalDoc as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: global.slug,
    action: CRUD_ACTIONS.update,
    data: globalDoc,
  });
  return (
    <AppForm form={form} className="relative">
      <div className="sticky top-12 z-10 mb-6 flex items-center justify-between bg-background pt-4">
        <h1 className="text-2xl font-bold">
          Edit Global - <span className="text-primary">{global.label}</span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex gap-2">
              <Button
                type="submit"
                className="transition-all duration-300"
                isPending={isPending}
                disabled={isDefaultValue || !canEdit}
              >
                Save
              </Button>
              <Button
                type="button"
                variant="outline"
                className="transition-all duration-300"
                disabled={isDefaultValue || !canEdit}
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
              collection={global}
            />
          );
        })}
      </div>
    </AppForm>
  );
}
