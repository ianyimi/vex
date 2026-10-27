"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import {
  BUILTIN_CONTRIBUTION_IDS,
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  getDataFields,
  GlobalEditViewProps,
  resolveLivePreviewSettings,
  SLOT_IDS,
  vexConvexApi,
} from "@vexcms/core";
import type { EditComponentsConfig, EditComponentsConfigInput } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { AppForm } from "../forms";
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
import { RenderFields } from "../fields/RenderFields";
import { FormCompactProvider } from "../forms/FormCompactContext";
import { DocumentTimestamps } from "../versions/DocumentTimestamps";
import { applyFieldPermissionReadOnly } from "../fields/applyFieldPermissionReadOnly";
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
import { LivePreviewMobileOverlay } from "../livePreview/LivePreviewMobileOverlay";
import { useLivePreviewServerUrl } from "../livePreview/useLivePreviewServerUrl";
import {
  DocumentEditRuntimeProvider,
  DocumentEditSlotOutlet,
  DocumentEditActionsMenu,
  VexDocumentProvider,
  documentEditBuiltinContributions,
  useHeaderActionsCollapse,
  DocumentCancelAction,
} from "../documents";
import { LivePreviewToggleAction } from "../livePreview/LivePreviewToggleAction";

/**
 * Global document edit form.
 *
 * When the global declares `admin.livePreview`, a "Show preview" toggle
 * splits the view into a resizable form/preview pair — exactly as
 * `CollectionEditView` does, including the bottom-sheet overlay and
 * auto-close/auto-reopen behavior below the mobile breakpoint.
 *
 * @param props - View props.
 * @param props.global - The slug of the global whose fields are rendered.
 * @param props.initialData - Server-prefetched document for SSR hydration.
 * @param props.initialPreviewPanelOpen - Server-read panel open state, so the
 *   split pane renders correctly on first paint.
 * @returns The edit form, or a not-found message when `global` does not resolve.
 * @throws Never — resolution failure renders a not-found message instead of throwing.
 */
export function GlobalEditView(props: GlobalEditViewProps) {
  const config = useVexConfig();
  const global = config.globals.find((g) => g.slug === props.global);

  // Resolved before any hook that reads `global.slug`/`global.fields`: unlike the old
  // destructured-prop version (where this check sat after 4 hooks, verifying a value
  // TypeScript already guaranteed truthy), `global` here comes from a runtime `.find()`
  // and can genuinely be `undefined` — deferring the check would dereference `.slug` on
  // `undefined` inside the `useQuery` call below.
  if (!global) {
    // TODO: add proper not found component or screen
    return <p>Global document not found.</p>;
  }

  // Root-level `edit.*` config is type-erased to the base `ComponentHKT` (declared outside a
  // framework-typed context); the collection-level config, one more layer down, carries the
  // same erasure. Every call site here renders through React.
  const rootEdit = config.admin.components.edit as unknown as EditComponentsConfig<ReactHKT>;
  const resourceEdit = global.admin.components?.edit as unknown as
    | EditComponentsConfigInput<ReactHKT>
    | undefined;
  // Runtime slug (`global.slug`) — uses the generic endpoint rather than the
  // per-slug `getGlobal()` wrapper. See the note in `CollectionEditView`.
  const { data: globalDoc } = useQuery({
    ...convexQuery(vexConvexApi.globals.get, {
      slug: global.slug,
      drafts: global.versions.drafts,
    }),
    initialData: props.initialData,
  });

  const isVersioned = global.versions.drafts;

  const [viewedVersion, setViewedVersion] = useState<ViewedVersion | null>(null);
  const formDocument = viewedVersion
    ? { _id: globalDoc?._id, ...viewedVersion.snapshot }
    : globalDoc;
  const restoredFrom = viewedVersion ? { restoredFrom: viewedVersion.version } : {};

  const { mutateAsync } = useVexMutation({
    collection: global.slug,
    getChanges: ({ args }) => [{ after: { ...(globalDoc ?? {}), ...args.data } }],
    mutationFn: vexConvexApi.globals.upsert,
    operation: "upsert",
  });

  const dataFields = useMemo(() => getDataFields({ fields: global.fields }), [global.fields]);
  const visibleFields = useVisibleFields({
    resource: global.slug,
    fields: dataFields,
    data: globalDoc,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useFieldsForm<Record<string, unknown>>({
    document: formDocument,
    fields: global.fields,
    readableFieldKeys,
    onSubmit: async ({ value }) => {
      // A global has no separate create view: before the first save,
      // `globalDoc` is undefined and `value` carries the field defaults,
      // which a diff (built against those same defaults) would omit.
      if (!globalDoc) {
        await mutateAsync({ slug: global.slug, data: value });
        form.reset();
        return;
      }
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await mutateAsync({ slug: global.slug, data: changes });
      resetWhenSaved(changes);
    },
  });

  useLiveFieldMerge({
    form,
    document: formDocument,
    fieldKeys: readableFieldKeys,
  });

  // Post-save resets wait for the live row to reflect the save — see the hook.
  const resetWhenSaved = useResetWhenSaved({ form, document: globalDoc });

  const canEdit = usePermission({
    resource: global.slug,
    action: isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: globalDoc as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: global.slug,
    action: isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: globalDoc,
  });

  const isDraftDoc =
    (globalDoc as { vex_status?: "draft" | "published" } | undefined)?.vex_status === "draft";

  const viewedVersionNumber = viewedVersion?.version ?? null;
  const lastViewedVersionRef = useRef(viewedVersionNumber);
  useEffect(() => {
    if (lastViewedVersionRef.current === viewedVersionNumber) return;
    lastViewedVersionRef.current = viewedVersionNumber;
    form.reset();
  }, [viewedVersionNumber]);

  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const autosaveEnabled = isVersioned && global.versions.autosave.enabled && canEdit;

  const { mutateAsync: saveDraftMutation } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });
  const { hasUnsavedChanges: autosaveHasUnsavedChanges } = useAutosave({
    values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),
    onSave: async (changes) => {
      await saveDraftMutation({ global: global.slug, data: changes, ...restoredFrom });
      setViewedVersion(null);
      // Keystrokes typed during the save stay dirty for autosave's follow-up save.
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

  const formValues = useStore(form.store, (state) => state.values);
  const isMobile = useIsMobile();
  const livePreview = resolveLivePreviewSettings({
    config: config.admin.livePreview,
    kind: "global",
    slug: global.slug,
    admin: global.admin.livePreview,
  });
  const previewPanel = useLivePreviewPanelState({
    slug: global.slug,
    initialOpen: props.initialPreviewPanelOpen ?? false,
    enabled: livePreview !== undefined,
    isMobile,
  });
  const clientPreviewUrl = resolveLivePreviewUrl({
    url: livePreview?.url,
    collectionSlug: global.slug,
    baseDoc: (globalDoc ?? {}) as Record<string, unknown>,
    formValues,
  });

  // A `{ server }` resolver reads the database, so it cannot be evaluated
  // here; this issues the Convex round trip for that form only and passes
  // the client-resolved URL straight through otherwise.
  const previewUrl = useLivePreviewServerUrl({
    url: livePreview?.url,
    clientUrl: clientPreviewUrl,
    initialUrl: props.initialPreviewUrl,
    kind: "global",
    slug: global.slug,
    documentId: global.slug,
    formValues,
    debounceMs: livePreview?.debounceMs,
  });
  const previewIsActive = Boolean(livePreview && previewPanel.isOpen && previewUrl);
  const breakpoints = livePreview?.breakpoints ?? config.admin.livePreview.breakpoints;

  // See `CollectionEditView`: split mode fills `main`'s content box exactly and
  // cancels its bottom padding, so the form column scrolls on its own and runs
  // to the bottom edge.
  const isSplit = previewIsActive && !isMobile;

  // BOTH panels need an explicit `defaultSize`: react-resizable-panels renders a
  // panel that has none at flex-grow 0 until it measures the group after mount,
  // which is a preview pane that flashes at zero width on every load.
  const formPanelSize = props.initialPreviewPanelSize ?? DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE;
  // See CollectionEditView: per-column pixel floors expressed as shares of the
  // width available, the preview's being the larger of the two.
  const { ref: splitRef, minSizes: panelMinSizes } = useLivePreviewPanelMinSize();
  // See CollectionEditView: the scroll container changes with the split, so
  // the offset is carried across by hand.
  const formScroll = usePreservedScrollTop();

  const hasSidebarFields = Object.values(global.fields).some(
    (fieldDef) =>
      "admin" in fieldDef &&
      "position" in fieldDef.admin &&
      fieldDef.admin.position === "sidebar",
  );
  const showSidebar = hasSidebarFields || globalDoc !== undefined;
  const documentStatus =
    isVersioned && globalDoc ? (isDraftDoc ? "draft" : "published") : undefined;
  const renderedFields = applyFieldPermissionReadOnly({
    fields: global.fields,
    fieldPermissions,
  });

  const slotProps = { kind: "global" as const, slug: global.slug };
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
          collection={global}
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
          <DocumentTimestamps creationTime={globalDoc?._creationTime} />
          <RenderFields
            fields={renderedFields}
            collection={global}
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

  return (
    <UnsavedChangesGuardContext.Provider
      value={{
        release: releaseUnsavedChangesGuard,
        attemptNavigation: attemptUnsavedChangesNavigation,
      }}
    >
      <VexDocumentProvider
        value={{
          kind: "global",
          slug: global.slug,
          saved: globalDoc as Record<string, unknown> | undefined,
          isDirty: !useStore(form.store, (state) => state.isDefaultValue),
          status: isVersioned && globalDoc ? (isDraftDoc ? "draft" : "published") : undefined,
          canEdit,
        }}
      >
      <DocumentEditRuntimeProvider
        value={{
          viewedVersion,
          onViewVersion: setViewedVersion,
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
            // See CollectionEditView: outside the scroll container, no bottom
            // margin so the divider through the handle meets this border.
            className="z-10 -mx-6 flex shrink-0 items-center justify-between gap-2 border-b bg-background px-6 pt-4 pb-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <DocumentEditSlotOutlet
                slotId={SLOT_IDS.edit.headerBefore}
                root={{ contributions: rootEdit.header?.before }}
                resource={{ contributions: resourceEdit?.header?.before }}
                builtins={[]}
                contributedProps={slotProps}
              />
              <h1 className="flex min-w-0 items-baseline overflow-hidden text-2xl font-bold">
                <span ref={titlePrefixRef} className="shrink-0 whitespace-nowrap">
                  Edit Global -{" "}
                </span>
                <span className="min-w-0 truncate text-primary">
                  {global.label}
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
                    ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.cancel, component: DocumentCancelAction }]
                    : []),
                  ...(headerCollapse.collapsePreview
                    ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.livePreview, component: LivePreviewToggleAction }]
                    : []),
                  ...(isVersioned
                    ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.versionHistory, component: VersionHistoryMenuItem }]
                    : []),
                ]}
                contributedProps={{ ...slotProps, placement: "menu" as const }}
              />
              {isVersioned && globalDoc && (
                <StatusBadge status={isDraftDoc ? "draft" : "published"} />
              )}
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
                    // DocumentEditActionsMenu's builtins above, with placement="menu".
                    ...(headerCollapse.collapsePreview
                      ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.livePreview, hidden: true as const }]
                      : []),
                    ...(headerCollapse.collapseCancel
                      ? [{ id: BUILTIN_CONTRIBUTION_IDS.edit.cancel, hidden: true as const }]
                      : []),
                  ],
                  overrides: resourceEdit?.header?.overrides,
                }}
                builtins={documentEditBuiltinContributions()}
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
            // See CollectionEditView: `-mr-6` on this wrapper (not the group, whose
            // width is pinned inline) runs the preview to the shell edge, and the
            // same element carries the min-size measurement.
            <div ref={splitRef} className="-mr-6 flex min-h-0 flex-1">
              <ResizablePanelGroup
                direction="horizontal"
                className="min-h-0 flex-1"
                onLayout={([formPanelSize]) => {
                  if (formPanelSize !== undefined) {
                    writeLivePreviewLayoutCookie({ slug: global.slug, formPanelSize });
                  }
                }}
              >
                <ResizablePanel defaultSize={formPanelSize} minSize={panelMinSizes.form}>
                  <div
                    ref={formScroll.ref}
                    onScroll={formScroll.onScroll}
                    className="vex-scroll-area relative h-full overflow-y-auto pt-4 pr-4 pb-6 [container-type:size] [container-name:form]"
                  >
                    <FormCompactProvider>{formContent}</FormCompactProvider>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={100 - formPanelSize} minSize={panelMinSizes.preview}>
                  <LivePreviewPanel
                    previewUrl={previewUrl as string}
                    collectionSlug={global.slug}
                    documentId={global.slug}
                    debounceMs={livePreview?.debounceMs}
                    breakpoints={breakpoints}
                    form={form}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          ) : (
            // See CollectionEditView: bleed over `main`'s gutter and re-add the
            // padding inside, so the scrollbar rides the shell edge instead of
            // sitting against the inputs.
            <div
              ref={formScroll.ref}
              onScroll={formScroll.onScroll}
              className="vex-scroll-area relative -mx-6 min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6 [container-type:size] [container-name:form]"
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
              collectionSlug={global.slug}
              documentId={global.slug}
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
