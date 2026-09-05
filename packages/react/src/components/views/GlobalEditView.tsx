"use client";

import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CRUD_ACTIONS, GlobalEditViewProps, vexConvexApi } from "@vexcms/core";
import { AppForm } from "../form";
import { useGlobalForm, usePermission } from "../../hooks";
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

  const { mutateAsync, isPending } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.globals.upsert),
  });

  const form = useGlobalForm({
    document: globalDoc,
    global,
    onSubmit: async ({ value }: { value: any }) => {
      await mutateAsync({
        slug: global.slug,
        data: value,
      });
      form.reset();
    },
  });

  if (!global) {
    // TODO: add proper not found component or screen
    return <p>Global document not found.</p>;
  }

  const canEdit = usePermission({
    resource: global.slug,
    action: CRUD_ACTIONS.update,
    data: globalDoc as {},
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
        {Object.entries(global.fields).map(([fieldKey, field]) => {
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
              readOnly={!canEdit || field.admin.readOnly}
              collection={global}
            />
          );
        })}
      </div>
    </AppForm>
  );
}
