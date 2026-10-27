"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import {
  BUILTIN_CONTRIBUTION_IDS,
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  getDataFields,
  resolveLivePreviewSettings,
  SLOT_IDS,
  VERSION_STATUSES,
  vexConvexApi,
} from "@vexcms/core";
import type {
  CollectionConfig,
  CollectionEditViewProps,
  CollectionSlug,
  EditComponentsConfig,
  EditComponentsConfigInput,
  VexDocument,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { AppForm } from "../forms";
import { RenderFields } from "../fields/RenderFields";
import { FormCompactProvider } from "../forms/FormCompactContext";
import { DocumentTimestamps } from "../versions/DocumentTimestamps";
import { applyFieldPermissionReadOnly } from "../fields/applyFieldPermissionReadOnly";
import { useFieldsForm } from "../fields/useFieldsForm";
import { useLiveFieldMerge } from "../fields/useLiveFieldMerge";
import { useVisibleFields } from "../fields/useVisibleFields";
import { useFieldPermissions, usePermission } from "../access";
import {
  useAutosave,
  useResetWhenSaved,
  StatusBadge,
  VersionHistoryMenuItem,
  type ViewedVersion,
} from "../versions";
import {
  UnsavedChangesGuardContext,
  useUnsavedChangesGuard,
} from "../documents/useUnsavedChangesGuard";
import { useVexMutation } from "../hooks";
import { changedValues } from "../forms/changedValues";
import { useVexConfig } from "../config/VexConfigContext";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "../ui/resizable";
import { useIsMobile } from "../hooks/use-mobile";
import {
  useLivePreviewPanelMinSize,
  useLivePreviewPanelState,
  writeLivePreviewLayoutCookie,
} from "../livePreview/useLivePreviewPanelState";
import { usePreservedScrollTop } from "../admin/usePreservedScrollTop";
import { LivePreviewPanel, resolveLivePreviewUrl } from "../livePreview/LivePreviewPanel";
import { useLivePreviewServerUrl } from "../livePreview/useLivePreviewServerUrl";
import { LivePreviewMobileOverlay } from "../livePreview/LivePreviewMobileOverlay";
import {
  DocumentEditRuntimeProvider,
  DocumentEditSlotOutlet,
  DocumentEditActionsMenu,
  VexDocumentProvider,
  documentEditBuiltinContributions,
  useHeaderActionsCollapse,
  DocumentCancelAction,
} from "../documents";
import { CollectionDeleteAction } from "./CollectionDeleteAction";
import { CollectionDuplicateMenuItem } from "./CollectionDuplicateMenuItem";
import { RevalidateMenuItem } from "../revalidate/RevalidateMenuItem";
import { LivePreviewToggleAction } from "../livePreview/LivePreviewToggleAction";

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
 * splits the view into a resizable form/preview pair. Below the mobile
 * breakpoint it opens instead as a bottom-sheet overlay
 * (`LivePreviewMobileOverlay`); narrowing past that breakpoint while the
 * split panel is open auto-closes it (remembered so widening back reopens
 * it) rather than letting it render as a full-screen takeover.
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
  // Root-level `edit.*` config is type-erased to the base `ComponentHKT` (declared outside a
  // framework-typed context, same reason `AdminComponentsInput.fields` is — types.ts's own
  // doc comment on `EditComponentsConfig`); every call site here renders through React.
  const rootEdit = config.admin.components.edit as unknown as EditComponentsConfig<ReactHKT>;
  // Same type erasure as `rootEdit`, one level down.
  const resourceEdit = collection.admin.components?.edit as unknown as
    | EditComponentsConfigInput<ReactHKT>
    | undefined;

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
    document: formDocument,
    fields: collection.fields,
    readableFieldKeys,
    onSubmit: async () => {
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await plainUpdateMutation.mutateAsync({
        id: currentDocument._id,
        collection: collection.slug,
        data: changes,
      });
      resetWhenSaved(changes);
    },
  });

  // Only the non-versioned onSubmit path above still needs a dedicated mutation at this level —
  // `DocumentSaveAction` owns the versioned write. Kept here (not inside the built-in) because `AppForm`'s
  // native submit (Enter in a text field) still calls `form.handleSubmit`, which this `onSubmit`
  // backs regardless of which button is visible.
  const plainUpdateMutation = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: CRUD_ACTIONS.update,
  });

  useLiveFieldMerge({
    form,
    document: formDocument,
    fieldKeys: readableFieldKeys,
  });

  const resetWhenSaved = useResetWhenSaved({ form, document: currentDocument });

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

  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const autosaveEnabled = isVersioned && collection.versions.autosave.enabled && canEdit;

  const { mutateAsync: saveDraftMutation } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });
  const { hasUnsavedChanges: autosaveHasUnsavedChanges } = useAutosave({
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
      resetWhenSaved(changes);
    },
    enabled: autosaveEnabled,
  });

  const {
    dialog: unsavedChangesDialog,
    release: releaseUnsavedChangesGuard,
    attemptNavigation: attemptUnsavedChangesNavigation,
  } = useUnsavedChangesGuard({
    isDirty: !isDefaultValue,
    hasUnsavedChanges: autosaveHasUnsavedChanges,
    autosaveEnabled,
  });

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
    isMobile,
  });
  const [tempId] = useState(() => crypto.randomUUID());
  const savedDocumentId = currentDocument._id as string | undefined;
  const formValues = useStore(form.store, (state) => state.values);
  const clientPreviewUrl = resolveLivePreviewUrl({
    url: livePreview?.url,
    collectionSlug: collection.slug,
    baseDoc: currentDocument,
    formValues,
    tempId,
  });
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
  const isSplit = previewIsActive && !isMobile;

  const hasSidebarFields = Object.values(collection.fields).some(
    (fieldDef) =>
      "admin" in fieldDef && "position" in fieldDef.admin && fieldDef.admin.position === "sidebar",
  );
  const showSidebar = hasSidebarFields || currentDocument._creationTime !== undefined;
  const documentStatus = isVersioned
    ? isDraftDoc
      ? VERSION_STATUSES.draft.key
      : VERSION_STATUSES.published.key
    : undefined;
  const renderedFields = applyFieldPermissionReadOnly({
    fields: collection.fields,
    fieldPermissions,
  });

  const slotProps = { kind: "collection" as const, slug: collection.slug };
  const headerRef = useRef<HTMLDivElement>(null);
  const titlePrefixRef = useRef<HTMLSpanElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const headerCollapse = useHeaderActionsCollapse({
    header: headerRef,
    titlePrefix: titlePrefixRef,
    actions: actionsRef,
  });

  const formContent = (
    <div className={showSidebar ? "flex flex-col gap-6 @3xl/form:flex-row" : undefined}>
      <div className="min-w-0 flex-1">
        <DocumentEditSlotOutlet
          slotId={SLOT_IDS.edit.beforeFields}
          root={{ contributions: rootEdit.beforeFields }}
          resource={{ contributions: resourceEdit?.beforeFields }}
          builtins={[]}
          contributedProps={slotProps}
        />
        <RenderFields
          fields={renderedFields}
          collection={collection}
          readOnly={!canEdit}
          documentStatus={documentStatus}
          fieldKeys={readableFieldKeys}
          region={showSidebar ? "main" : "all"}
          isTopLevel
        />
        <DocumentEditSlotOutlet
          slotId={SLOT_IDS.edit.afterFields}
          root={{ contributions: rootEdit.afterFields }}
          resource={{ contributions: resourceEdit?.afterFields }}
          builtins={[]}
          contributedProps={slotProps}
        />
      </div>
      {showSidebar && (
        <div className="vex-scroll-area w-full space-y-4 @3xl/form:sticky @3xl/form:top-0 @3xl/form:-m-1 @3xl/form:max-h-[100cqh] @3xl/form:w-72 @3xl/form:shrink-0 @3xl/form:self-start @3xl/form:overflow-y-auto @3xl/form:p-1">
          <DocumentEditSlotOutlet
            slotId={SLOT_IDS.edit.sidebarBefore}
            root={{ contributions: rootEdit.sidebar?.before }}
            resource={{ contributions: resourceEdit?.sidebar?.before }}
            builtins={[]}
            contributedProps={slotProps}
          />
          <DocumentTimestamps creationTime={currentDocument._creationTime} />
          <RenderFields
            fields={renderedFields}
            collection={collection}
            readOnly={!canEdit}
            documentStatus={documentStatus}
            fieldKeys={readableFieldKeys}
            region="sidebar"
            isTopLevel
          />
          <DocumentEditSlotOutlet
            slotId={SLOT_IDS.edit.sidebarAfter}
            root={{ contributions: rootEdit.sidebar?.after }}
            resource={{ contributions: resourceEdit?.sidebar?.after }}
            builtins={[]}
            contributedProps={slotProps}
          />
        </div>
      )}
    </div>
  );

  const formPanelSize = props.initialPreviewPanelSize ?? DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE;
  const { ref: splitRef, minSizes: panelMinSizes } = useLivePreviewPanelMinSize();
  const formScroll = usePreservedScrollTop();

  return (
    <UnsavedChangesGuardContext.Provider
      value={{
        release: releaseUnsavedChangesGuard,
        attemptNavigation: attemptUnsavedChangesNavigation,
      }}
    >
      <VexDocumentProvider
        value={{
          kind: "collection",
          slug: collection.slug,
          id: activeDocumentId as string,
          saved: currentDocument,
          isDirty: !useStore(form.store, (state) => state.isDefaultValue),
          status: isVersioned ? (isDraftDoc ? "draft" : "published") : undefined,
          canEdit,
        }}
      >
        <DocumentEditRuntimeProvider
          value={{
            viewedVersion,
            onViewVersion: setViewedVersion,
            onDocumentIdChange: (id) => setActiveDocumentId(id as VexDocument["_id"]),
            onSaved: resetWhenSaved,
            livePreview: livePreview && {
              isOpen: previewPanel.isOpen,
              toggle: previewPanel.toggle,
              isSplit,
            },
          }}
        >
          <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
            <div
              ref={headerRef}
              className="z-10 -mx-6 flex min-h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-6"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <DocumentEditSlotOutlet
                  slotId={SLOT_IDS.edit.headerBefore}
                  root={{ contributions: rootEdit.header?.before }}
                  resource={{ contributions: resourceEdit?.header?.before }}
                  builtins={[]}
                  contributedProps={slotProps}
                />
                <h1 className="flex min-w-0 items-baseline gap-2 overflow-hidden text-2xl font-bold">
                  <span ref={titlePrefixRef} className="shrink-0 whitespace-nowrap">
                    Edit {collection.labels.singular}
                  </span>
                  <span className="shrink-0 whitespace-nowrap">-</span>
                  <span className="min-w-0 truncate text-primary">
                    {String(currentDocument[collection.admin.useAsTitle] ?? "")}
                  </span>
                </h1>
              </div>
              <div ref={actionsRef} className="flex shrink-0 items-center gap-2">
                <DocumentEditActionsMenu
                  root={{
                    contributions: rootEdit.actionsMenu?.items,
                    overrides: rootEdit.actionsMenu?.overrides,
                  }}
                  resource={{
                    contributions: resourceEdit?.actionsMenu?.items,
                    overrides: resourceEdit?.actionsMenu?.overrides,
                  }}
                  builtins={[
                    ...(headerCollapse.collapseCancel
                      ? [
                          {
                            id: BUILTIN_CONTRIBUTION_IDS.edit.cancel,
                            component: DocumentCancelAction,
                          },
                        ]
                      : []),
                    ...(headerCollapse.collapsePreview
                      ? [
                          {
                            id: BUILTIN_CONTRIBUTION_IDS.edit.livePreview,
                            component: LivePreviewToggleAction,
                          },
                        ]
                      : []),
                    ...(isVersioned
                      ? [
                          {
                            id: BUILTIN_CONTRIBUTION_IDS.edit.versionHistory,
                            component: VersionHistoryMenuItem,
                          },
                        ]
                      : []),
                    {
                      id: BUILTIN_CONTRIBUTION_IDS.edit.revalidate,
                      component: RevalidateMenuItem,
                      access: (ctx) => ctx.resource?.kind === "collection",
                    },
                    {
                      id: BUILTIN_CONTRIBUTION_IDS.edit.duplicate,
                      component: CollectionDuplicateMenuItem,
                    },
                    ...(headerCollapse.collapseDelete
                      ? [
                          {
                            id: BUILTIN_CONTRIBUTION_IDS.edit.delete,
                            component: CollectionDeleteAction,
                          },
                        ]
                      : []),
                  ]}
                  contributedProps={{ ...slotProps, placement: "menu" as const }}
                />
                {isVersioned && <StatusBadge status={isDraftDoc ? "draft" : "published"} />}
                <DocumentEditSlotOutlet
                  slotId={SLOT_IDS.edit.headerActions}
                  root={{
                    contributions: rootEdit.header?.actions,
                    overrides: rootEdit.header?.overrides,
                  }}
                  resource={{
                    contributions: [
                      ...(resourceEdit?.header?.actions ?? []),
                      // Responsive collapse (useHeaderActionsCollapse): hide the collapsed
                      // built-in here — its SAME component mounts instead through
                      // DocumentEditActionsMenu's builtins above, with placement="menu". A
                      // synthetic hide directive, not a config change; harmless alongside any
                      // real hide/order the project already configured for the same id.
                      ...(headerCollapse.collapsePreview
                        ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.livePreview, hidden: true as const }]
                        : []),
                      ...(headerCollapse.collapseCancel
                        ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.cancel, hidden: true as const }]
                        : []),
                      ...(headerCollapse.collapseDelete
                        ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.delete, hidden: true as const }]
                        : []),
                    ],
                    overrides: resourceEdit?.header?.overrides,
                  }}
                  builtins={[
                    ...documentEditBuiltinContributions(),
                    { id: BUILTIN_CONTRIBUTION_IDS.edit.delete, component: CollectionDeleteAction },
                  ]}
                  contributedProps={{ ...slotProps, placement: "inline" as const }}
                />
                <DocumentEditSlotOutlet
                  slotId={SLOT_IDS.edit.headerAfter}
                  root={{ contributions: rootEdit.header?.after }}
                  resource={{ contributions: resourceEdit?.header?.after }}
                  builtins={[]}
                  contributedProps={slotProps}
                />
              </div>
            </div>
            {isSplit ? (
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
                      className="vex-scroll-area [container-type:size] relative h-full overflow-y-auto pt-4 pr-4 pb-6 [container-name:form]"
                    >
                      <FormCompactProvider>{formContent}</FormCompactProvider>
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
              <div
                ref={formScroll.ref}
                onScroll={formScroll.onScroll}
                className="vex-scroll-area [container-type:size] relative -mx-6 min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6 [container-name:form]"
              >
                <FormCompactProvider>{formContent}</FormCompactProvider>
              </div>
            )}
            {livePreview && isMobile && (
              <LivePreviewMobileOverlay
                open={previewIsActive}
                onOpenChange={(open) => {
                  if (!open) previewPanel.toggle();
                }}
                previewUrl={previewUrl as string}
                collectionSlug={collection.slug}
                documentId={savedDocumentId}
                tempId={savedDocumentId ? undefined : tempId}
                debounceMs={livePreview?.debounceMs}
                breakpoints={breakpoints}
                form={form}
              />
            )}
            {unsavedChangesDialog}
          </AppForm>
        </DocumentEditRuntimeProvider>
      </VexDocumentProvider>
    </UnsavedChangesGuardContext.Provider>
  );
}
