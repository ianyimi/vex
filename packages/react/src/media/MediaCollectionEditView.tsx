"use client";

import { useMemo } from "react";
import { CRUD_ACTIONS, getDataFields, vexConvexApi, buildGetArgs } from "@vexcms/core";
import type {
  MediaCollectionConfig,
  MediaCollectionSlug,
  VexMediaDocument,
} from "@vexcms/core";
import { AppForm } from "../forms";
import { Button } from "../ui";
import { InlineQueryError } from "../ui/InlineQueryError";
import { RenderFields } from "../fields/RenderFields";
import { applyFieldPermissionReadOnly } from "../fields/applyFieldPermissionReadOnly";
import { useFieldsForm } from "../fields/useFieldsForm";
import { useLiveFieldMerge } from "../fields/useLiveFieldMerge";
import { useVisibleFields } from "../fields/useVisibleFields";
import { useFieldPermissions, usePermission } from "../access";
import { useVexDocQuery, useVexMutation } from "../hooks";
import { changedValues } from "../forms/changedValues";
import { useVexConfig } from "../config/VexConfigContext";

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

  return (
    <MediaCollectionEditViewData collection={collection} documentId={props.documentId} initialData={props.initialData} />
  );
}

/**
 * The data-resolving half of {@link MediaCollectionEditView} — split out for the same
 * hooks-order reason {@link CollectionEditView}'s own `CollectionEditViewData` is.
 *
 * Plain `useVexDocQuery` (reverting the shell-streaming
 * follow-up's `<Suspense>`+`useSuspenseVexDocQuery` split here specifically) — the edit
 * view's own primary document is essential and cheap to fetch, so `NextAdminPage.tsx` now
 * AWAITS it server-side and passes the resolved value as `initialData`, so `currentDocument`
 * is NEVER `undefined` on the very first render — the whole form renders at once. No
 * whole-form Suspense fallback; only individual fields that fetch their OWN data show their
 * own loading states.
 *
 * @param props - The resolved media collection, document id, and SSR-prefetched initial data.
 * @returns An inline query error when the fetch fails, a not-found message when the document
 *   doesn't exist, or the edit form once a document is loaded.
 */
function MediaCollectionEditViewData<TCollectionSlug extends MediaCollectionSlug = MediaCollectionSlug>(
  props: Pick<MediaCollectionEditViewProps<TCollectionSlug>, "documentId" | "initialData"> & {
    collection: MediaCollectionConfig;
  },
) {
  const { document: currentDocument, error, refetch } = useVexDocQuery<VexMediaDocument>({
    collection: props.collection.slug,
    id: props.documentId,
    drafts: buildGetArgs({ id: props.documentId, collection: props.collection }).drafts,
    initialData: props.initialData,
  });

  // Checked before `!currentDocument` — an unreadable document also leaves
  // `currentDocument` `undefined`, which would otherwise show the misleading "Document not
  // found" message for what's actually a permission/network failure.
  if (error) {
    return <InlineQueryError error={error} subject="this document" onRetry={refetch} />;
  }

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  return <MediaCollectionEditForm collection={props.collection} currentDocument={currentDocument} />;
}

/**
 * The edit form for one loaded media document. Split from
 * {@link MediaCollectionEditView} so every hook below runs on every render:
 * the outer view returns early while the document is missing (not found, or
 * deleted in another tab), and React requires the same hooks in the same
 * order on each render of one component.
 *
 * @param props - The resolved media collection and the loaded document.
 * @returns The edit form.
 */
function MediaCollectionEditForm(props: {
  collection: MediaCollectionConfig;
  currentDocument: VexMediaDocument;
}) {
  const { collection, currentDocument } = props;

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: "update",
  });
  const dataFields = useMemo(
    () => getDataFields({ fields: collection.fields }),
    [collection.fields],
  );
  const visibleFields = useVisibleFields({
    resource: collection.slug,
    fields: dataFields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    document: currentDocument,
    fields: collection.fields,
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
    data: currentDocument,
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
        <RenderFields
          fields={applyFieldPermissionReadOnly({
            fields: collection.fields,
            fieldPermissions,
          })}
          collection={collection}
          readOnly={!canEdit}
          fieldKeys={readableFieldKeys}
        />
      </div>
    </AppForm>
  );
}
