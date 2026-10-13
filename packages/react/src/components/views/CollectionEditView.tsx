"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  CONSTRAINT_COMPARATORS,
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  getFieldsDefaultValues,
  isFieldAllowed,
  resolveLivePreviewSettings,
  VERSION_STATUSES,
  vexConvexApi,
} from "@vexcms/core";
import type {
  CollectionConfig,
  CollectionEditViewProps,
  CollectionSlug,
  VexDocument,
} from "@vexcms/core";
import { AppForm } from "../form/AppForm";
import { RevalidateButton } from "../RevalidateButton";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
import { useFieldsForm } from "../../hooks/useFieldsForm";
import {
  useAutosave,
  useFieldPermissions,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { pickReadableValues } from "../form/readableFields";
import { useVexConfig } from "../../context/VexConfigContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ui/resizable";
import { useIsMobile } from "../../hooks/use-mobile";
import {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
  writeLivePreviewLayoutCookie,
} from "../../hooks/useLivePreviewPanelState";
import { usePreservedScrollTop } from "../../hooks/usePreservedScrollTop";
import { LivePreviewPanel, resolveLivePreviewUrl } from "../livePreview/LivePreviewPanel";
import { useLivePreviewServerUrl } from "../../hooks/useLivePreviewServerUrl";
import { DraftToolbar, VersionHistoryDropdown, type ViewedVersion } from "../drafts";
import { applyVexFieldErrors, getVexErrorMessage } from "../../lib/errors";
import { toast } from "sonner";

/**
 * Collection document edit form.
 *
 * Fetches the document when editing via `vexConvexApi.get` (TanStack Query +
 * Convex subscription), initialises a `useFieldsForm` instance with the
 * current field values, and renders an `<AppForm>` with one input component per
 * field. Submits via `vexConvexApi.update`. Field inputs connect to the form
 * through `AppFormContext` — no controller prop needed.
 *
 * When the collection declares `admin.livePreview`, a "Show preview" toggle
 * splits the view into a resizable form/preview pair (a full-screen overlay
 * below the mobile breakpoint).
 *
 * @param props - View props.
 * @param props.collection - The slug of the collection whose fields are
 *   rendered, resolved from `useVexConfig()`.
 * @param props.documentId - Convex document ID to fetch and edit. Omit for new-document mode.
 * @param props.initialData - Server-prefetched document for SSR hydration. `null` means not found.
 * @param props.initialPreviewPanelOpen - Server-read panel open state, so the
 *   split pane renders correctly on first paint.
 * @returns The edit form, or a not-found message when `collection` does
 *   not resolve, or when the document cannot be loaded.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 *
 * @example
 * ```tsx
 * <CollectionEditView collection="posts" documentId="k573abc..." initialData={serverDoc} />
 * ```
 */
export function CollectionEditView<TCollectionSlug extends CollectionSlug = CollectionSlug>(
  props: CollectionEditViewProps<TCollectionSlug>,
) {
  const config = useVexConfig();
  const collection = config.collections.find((c) => c.slug === props.collection);

  if (!collection) {
    // TODO: add proper not found component or screen
    return <p>Collection not found.</p>;
  }

  // The row the editor is currently looking at. Seeded from the prop, so a
  // non-versioned collection's behavior is unchanged — it just never gets
  // re-pointed. `saveDraft` (Step 7) can return a different row id than the
  // one loaded (first draft save on a published document bootstraps a new
  // row); without tracking it locally, the editor would keep looking at the
  // published row and the badge would never flip to Draft after an
  // in-session save.
  const [activeDocumentId, setActiveDocumentId] = useState(props.documentId);

  // This view is generic over `TCollectionSlug` — the collection is only known at
  // runtime, so it queries the generic endpoint (`VexDocument`) directly. The
  // per-slug `get()` wrapper from `@vexcms/react/client` narrows only when the
  // slug is a literal at the call site, which is not the case here.
  const { data: currentDocument } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: activeDocumentId,
      collection: collection.slug,
      drafts: collection.versions.drafts,
    }),
    initialData: props.initialData,
  });

  if (!currentDocument) {
    // TODO: add proper not found component or screen
    return <p>Document not found.</p>;
  }

  return (
    <CollectionEditForm
      initialPreviewPanelOpen={props.initialPreviewPanelOpen}
      initialPreviewPanelSize={props.initialPreviewPanelSize}
      initialPreviewUrl={props.initialPreviewUrl}
      collection={collection}
      currentDocument={currentDocument}
      activeDocumentId={activeDocumentId}
      setActiveDocumentId={setActiveDocumentId}
    />
  );
}

/**
 * The edit form for one loaded document. Split from {@link CollectionEditView}
 * so every hook below runs on every render: the outer view returns early while
 * the document is missing (not found, deleted elsewhere, or a draft row deleted
 * by publish before the view re-points), and React requires the same hooks in
 * the same order on each render of one component. This component only mounts
 * once `currentDocument` exists.
 *
 * @param props - The resolved collection, the loaded document, the id the
 *   outer view is tracking (and its setter, so a draft save or publish can
 *   re-point it), and the live-preview SSR props.
 * @returns The edit form.
 */
function CollectionEditForm(
  props: Pick<
    CollectionEditViewProps,
    "initialPreviewPanelOpen" | "initialPreviewPanelSize" | "initialPreviewUrl"
  > & {
    collection: CollectionConfig;
    currentDocument: VexDocument;
    activeDocumentId: VexDocument["_id"];
    setActiveDocumentId: Dispatch<SetStateAction<VexDocument["_id"]>>;
  },
) {
  const config = useVexConfig();
  const { collection, currentDocument, activeDocumentId, setActiveDocumentId } = props;

  const [viewedVersion, setViewedVersion] = useState<ViewedVersion | null>(null);
  // Passed as the form's `document` (not `form.reset(snapshot)`): TanStack re-applies
  // `defaultValues` from props each render while untouched, which would undo a reset.
  const formDocument: VexDocument = viewedVersion
    ? ({
        _id: currentDocument._id,
        _creationTime: currentDocument._creationTime,
        ...viewedVersion.snapshot,
      } as VexDocument)
    : currentDocument;
  const restoredFrom = viewedVersion ? { restoredFrom: viewedVersion.version } : {};

  const { mutateAsync, isPending } = useVexMutation({
    collection: collection.slug,
    // The edit view holds both states: the loaded document, and that document
    // merged with the submitted values.
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: CRUD_ACTIONS.update,
  });

  const { mutateAsync: publishMutation, isPending: isPublishing } = useVexMutation({
    collection: collection.slug,
    errorToast: { message: "Publish failed" },
    getChanges: () => [{ after: { ...currentDocument, ...form.state.values } }],
    mutationFn: vexConvexApi.versions.publish,
    operation: "publish",
  });

  const { mutateAsync: unpublishMutation, isPending: isUnpublishing } = useVexMutation({
    collection: collection.slug,
    // The published row is what's currently loaded whenever Unpublish is
    // enabled — the toolbar disables it while a draft exists (edit 4 below) —
    // so `currentDocument` IS the "before" state this purges as a delete.
    getChanges: () => [{ before: currentDocument }],
    mutationFn: vexConvexApi.versions.unpublish,
    operation: "unpublish",
  });

  const canPublish = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.publish,
    data: currentDocument,
  });

  const canUnpublish = usePermission({
    resource: collection.slug,
    action: DRAFT_ACTIONS.unpublish,
    data: currentDocument,
  });

  /**
   * Publishes the currently-open draft (or, for a never-published document,
   * the published row), merging any not-yet-saved form edits on top in the
   * same mutation call — `versions.publish`'s `data` arg, surfaced as
   * field-level errors via {@link applyVexFieldErrors} on strict-validation
   * rejection, reusing the same `FormError` display every field input
   * already renders through.
   *
   * @returns Promise resolving once publish completes (or rejects).
   * @throws Never — every rejection is caught, handled, and never re-thrown.
   */
  async function handlePublish(): Promise<void> {
    try {
      const publishedId = await publishMutation({
        collection: collection!.slug,
        id: activeDocumentId,
        data: changedValues(form),
        version: viewedVersion?.version,
      });
      setActiveDocumentId(publishedId);
      setViewedVersion(null);
      form.reset();
    } catch (error) {
      applyVexFieldErrors(form, error);
    }
  }

  /**
   * Unpublishes the currently-open published document, flipping it back to
   * draft.
   *
   * @returns Promise resolving once unpublish completes (or rejects).
   * @throws Never — a rejected mutation is caught and toasted, never re-thrown.
   */
  async function handleUnpublish(): Promise<void> {
    try {
      await unpublishMutation({ collection: collection!.slug, id: activeDocumentId });
    } catch (error) {
      // Step 11 rejects while a draft row exists; `isDraftDoc` already
      // disables the calling button client-side, but a draft created in
      // another tab between render and click still surfaces as a rejected
      // mutation here — the server stays the source of truth, this is not
      // treated as a bug.
      toast.error("Unpublish failed", { description: getVexErrorMessage(error) });
    }
  }

  // Bypasses `useVexMutation` deliberately: that hook's `operation` param is
  // typed `VexMutationOperation` (`"create" | "remove" | "update" | "upsert"`
  // — `packages/core/src/revalidate/types.ts:19`), which has no
  // draft-workflow member, and nothing in this spec wires draft/publish/
  // unpublish into the ISR-purge pipeline `useVexMutation` exists for.
  const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });

  /**
   * Persists the form's currently-dirty field values as a draft, without
   * publishing them. Reuses `changedValues(form)` — the same diff-submit
   * helper the plain `update` path already uses — so a partial patch is
   * sent, matching `saveDraft`'s lenient-partial validation on the server.
   *
   * @returns Promise resolving once the draft row is saved.
   * @throws Never — a rejected mutation is caught and toasted, never
   *   re-thrown, since this is a manually-triggered action, not a form
   *   submit the caller is awaiting a result from.
   */
  async function handleSaveDraft(): Promise<void> {
    try {
      const draftId = await saveDraftMutation({
        collection: collection!.slug,
        id: activeDocumentId,
        data: changedValues(form),
        ...restoredFrom,
      });
      setActiveDocumentId(draftId);
      setViewedVersion(null);
      form.reset();
    } catch (error) {
      toast.error("Save draft failed", { description: getVexErrorMessage(error) });
    }
  }
  const visibleFields = useVisibleFields({
    resource: collection.slug,
    fields: collection.fields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    document: formDocument,
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
    document: formDocument,
    fieldKeys: readableFieldKeys,
  });

  // A versioned collection's editor writes drafts, never the published row,
  // so every edit affordance — the field inputs, the field-level map, and the
  // toolbar — checks `saveDraft`; a non-versioned collection checks `update`.
  const isVersioned = collection.versions.drafts;
  const editAction = isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update;
  const canEdit = usePermission({
    resource: collection.slug,
    action: editAction,
    data: currentDocument,
  });
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: editAction,
    data: currentDocument,
  });
  const isDraftDoc = currentDocument.vex_status === VERSION_STATUSES.draft.key;

  const viewedVersionNumber = viewedVersion?.version ?? null;
  const lastViewedVersionRef = useRef(viewedVersionNumber);
  useEffect(() => {
    if (lastViewedVersionRef.current === viewedVersionNumber) return;
    lastViewedVersionRef.current = viewedVersionNumber;
    form.reset();
  }, [viewedVersionNumber]);

  useAutosave({
    values: changedValues(form),
    onSave: async (changes) => {
      const draftId = await saveDraftMutation({
        collection: collection.slug,
        id: activeDocumentId,
        data: changes,
        ...restoredFrom,
      });
      setActiveDocumentId(draftId);
      setViewedVersion(null);
      // Keystrokes typed during the save stay dirty for autosave's follow-up save.
      if (CONSTRAINT_COMPARATORS.eq(changedValues(form), changes)) {
        form.reset();
      }
    },
    enabled: isVersioned && collection.versions.autosave.enabled && canEdit,
  });

  const { data: publishedRowWhileDraft } = useQuery({
    ...convexQuery(vexConvexApi.get, {
      id: (currentDocument.vex_publishedId as string | undefined) ?? currentDocument._id,
      collection: collection.slug,
    }),
    enabled: isVersioned && isDraftDoc,
  });
  const publishedDocument = isDraftDoc ? publishedRowWhileDraft : currentDocument;

  const [tempId] = useState(() => crypto.randomUUID());
  const savedDocumentId = currentDocument._id as string | undefined;
  const formValues = useStore(form.store, (state) => state.values);
  const matchesPublished =
    !!publishedDocument &&
    CONSTRAINT_COMPARATORS.eq(
      formValues,
      pickReadableValues(
        getFieldsDefaultValues({ fields: collection.fields, document: publishedDocument }),
        readableFieldKeys,
      ),
    );
  const isMobile = useIsMobile();
  const livePreview = resolveLivePreviewSettings({
    config: config.admin.livePreview,
    kind: "collection",
    slug: collection.slug,
    admin: collection.admin.livePreview,
  });
  const previewPanel = useLivePreviewPanelState({
    slug: collection.slug,
    initialOpen: props.initialPreviewPanelOpen ?? false,
    enabled: livePreview !== undefined,
  });
  const clientPreviewUrl = resolveLivePreviewUrl({
    url: livePreview?.url,
    collectionSlug: collection.slug,
    baseDoc: currentDocument,
    formValues,
    tempId,
  });

  // A `{ server }` resolver reads the database, so it cannot be evaluated
  // here; this issues the Convex round trip for that form only and passes
  // the client-resolved URL straight through otherwise.
  const previewUrl = useLivePreviewServerUrl({
    url: livePreview?.url,
    clientUrl: clientPreviewUrl,
    initialUrl: props.initialPreviewUrl,
    kind: "collection",
    slug: collection.slug,
    documentId: savedDocumentId,
    tempId: tempId,
    formValues,
    debounceMs: livePreview?.debounceMs,
  });
  const previewIsActive = Boolean(livePreview && previewPanel.isOpen && previewUrl);
  const breakpoints = livePreview?.breakpoints ?? config.admin.livePreview.breakpoints;

  const formContent = (
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
            collection={collection}
            documentStatus={
              isVersioned
                ? isDraftDoc
                  ? VERSION_STATUSES.draft.key
                  : VERSION_STATUSES.published.key
                : undefined
            }
          />
        );
      })}
    </div>
  );

  // `main` is the app's only scroll container and has a definite height, so
  // split mode fills it exactly: 100% of `main`'s content box plus the 1.5rem
  // bottom padding it cancels with `-mb-6`, which is what lets the form column
  // run to the bottom edge instead of stopping short of it.
  const isSplit = previewIsActive && !isMobile;

  const formPanelSize = props.initialPreviewPanelSize ?? DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE;
  const { ref: splitRef, minSizes: panelMinSizes } = useLivePreviewPanelMinSize();
  const formScroll = usePreservedScrollTop();

  return (
    <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
      <div
        className={
          "z-10 -mx-6 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-y-2 border-b bg-background px-6"
        }
      >
        <h1 className="text-2xl font-bold">
          Edit {collection.labels.singular} -{" "}
          <span className="text-primary">
            {String(currentDocument[collection.admin.useAsTitle] ?? "")}
          </span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex flex-wrap items-center gap-2">
              <RevalidateButton collection={collection.slug} doc={currentDocument} />
              {livePreview && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={previewPanel.toggle}
                  icon={isSplit ? "Eye" : "EyeOff"}
                >
                  Preview
                </Button>
              )}
              {isVersioned ? (
                <DraftToolbar
                  status={isDraftDoc ? "draft" : "published"}
                  saveDraft={{
                    onClick: handleSaveDraft,
                    isPending: isSavingDraft,
                    disabled: !canEdit || isDefaultValue,
                  }}
                  publish={{
                    onClick: handlePublish,
                    isPending: isPublishing,
                    disabled: !canPublish || matchesPublished,
                  }}
                  unpublish={{
                    onClick: handleUnpublish,
                    isPending: isUnpublishing,
                    disabled: !canUnpublish || isDraftDoc || !isDefaultValue,
                  }}
                >
                  <VersionHistoryDropdown
                    target={{
                      collection: collection.slug,
                      documentId: activeDocumentId,
                    }}
                    hasDraft={isDraftDoc}
                    viewingVersion={viewedVersion?.version ?? null}
                    onViewVersion={setViewedVersion}
                    hasUnsavedChanges={!isDefaultValue}
                  />
                </DraftToolbar>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
        />
      </div>
      {isSplit ? (
        // `-mr-6` spends `main`'s right gutter on the preview, so the frame
        // runs to the shell edge. It goes on this wrapper rather than the
        // group: `PanelGroup` pins `width: 100%` inline, and an inline width
        // beats any margin class — the margin shrank its box without widening
        // the element. This div also carries the measurement for
        // `useLivePreviewPanelMinSize`, since `PanelGroup` exposes only an
        // imperative handle as its ref.
        <div ref={splitRef} className="-mr-6 flex min-h-0 flex-1">
          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-0 flex-1"
            onLayout={([formPanelSize]) => {
              if (formPanelSize !== undefined) {
                writeLivePreviewLayoutCookie({ slug: collection.slug, formPanelSize });
              }
            }}
          >
            <ResizablePanel defaultSize={formPanelSize} minSize={panelMinSizes.form}>
              <div
                ref={formScroll.ref}
                onScroll={formScroll.onScroll}
                className="vex-scroll-area h-full overflow-y-auto pt-4 pr-4 pb-6"
              >
                {formContent}
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={100 - formPanelSize} minSize={panelMinSizes.preview}>
              <LivePreviewPanel
                previewUrl={previewUrl as string}
                collectionSlug={collection.slug}
                documentId={savedDocumentId}
                tempId={savedDocumentId ? undefined : tempId}
                debounceMs={livePreview?.debounceMs}
                breakpoints={breakpoints}
                form={form}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      ) : (
        // `-mx-6 px-6`: the scrollbar belongs to this element's right edge, so
        // without the bleed it lands 1.5rem inboard — pressed against the
        // inputs with `main`'s gutter sitting uselessly outside it. Bleeding
        // over the gutter and re-adding the same padding inside puts the
        // scrollbar on the shell edge and keeps the inputs evenly inset.
        <div
          ref={formScroll.ref}
          onScroll={formScroll.onScroll}
          className="vex-scroll-area -mx-6 min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6"
        >
          {formContent}
        </div>
      )}
      {previewIsActive && isMobile && (
        <LivePreviewPanel
          previewUrl={previewUrl as string}
          collectionSlug={collection.slug}
          documentId={savedDocumentId}
          tempId={savedDocumentId ? undefined : tempId}
          debounceMs={livePreview?.debounceMs}
          breakpoints={breakpoints}
          form={form}
          isMobile
          onClose={previewPanel.toggle}
        />
      )}
    </AppForm>
  );
}
