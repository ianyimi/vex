"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import {
  valuesEqual,
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  getDataFields,
  getFieldsDefaultValues,
  GlobalEditViewProps,
  resolveLivePreviewSettings,
  vexConvexApi,
} from "@vexcms/core";
import { AppForm } from "../forms";
import { useFieldsForm } from "../fields/useFieldsForm";
import { useLiveFieldMerge } from "../fields/useLiveFieldMerge";
import { useVisibleFields } from "../fields/useVisibleFields";
import { useFieldPermissions, usePermission } from "../access";
import { useAutosave, useResetWhenSaved } from "../versions";
import { useVexMutation } from "../hooks";
import { changedValues } from "../forms/changedValues";
import { pickReadableValues } from "../fields/readableFields";
import { Button } from "../ui";
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
import { useLivePreviewServerUrl } from "../livePreview/useLivePreviewServerUrl";
import { DraftToolbar, VersionHistoryDropdown, type ViewedVersion } from "../versions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { applyVexFieldErrors, getVexErrorMessage } from "../utils/errors";
import { toast } from "sonner";

/**
 * Global document edit form.
 *
 * When the global declares `admin.livePreview`, a "Show preview" toggle splits
 * the view into a resizable form/preview pair (a full-screen overlay below the
 * mobile breakpoint), exactly as `CollectionEditView` does.
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
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false);
  // Loaded only while the unpublish dialog is open — see CollectionEditView.
  const { data: unpublishVersions } = useQuery({
    ...convexQuery(vexConvexApi.versions.listVersions, { global: global.slug }),
    enabled: confirmingUnpublish,
  });
  const publishedTimeline = (unpublishVersions ?? [])
    .filter((row) => row.status === "published" && row.publishedAt !== null)
    .sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
  const unpublishCurrent = publishedTimeline[0];
  const unpublishTarget = publishedTimeline[1];
  const formDocument = viewedVersion
    ? { _id: globalDoc?._id, ...viewedVersion.snapshot }
    : globalDoc;
  const restoredFrom = viewedVersion ? { restoredFrom: viewedVersion.version } : {};

  const { mutateAsync, isPending } = useVexMutation({
    collection: global.slug,
    getChanges: ({ args }) => [{ after: { ...(globalDoc ?? {}), ...args.data } }],
    mutationFn: vexConvexApi.globals.upsert,
    operation: "upsert",
  });

  const { mutateAsync: publishMutation, isPending: isPublishing } = useVexMutation({
    collection: global.slug,
    errorToast: { message: "Publish failed" },
    getChanges: () => [{ after: { ...(globalDoc ?? {}), ...form.state.values } }],
    mutationFn: vexConvexApi.versions.publish,
    operation: "publish",
  });

  const canPublish = usePermission({
    resource: global.slug,
    action: DRAFT_ACTIONS.publish,
    data: globalDoc as {},
  });
  const canUnpublish = usePermission({
    resource: global.slug,
    action: DRAFT_ACTIONS.unpublish,
    data: globalDoc as {},
  });
  const { mutateAsync: unpublishAsync, isPending: isUnpublishing } = useVexMutation({
    collection: global.slug,
    getChanges: () =>
      globalDoc
        ? unpublishTarget !== undefined
          ? [{ before: globalDoc, after: globalDoc }]
          : [{ before: globalDoc }]
        : [],
    mutationFn: vexConvexApi.versions.unpublish,
    operation: "unpublish",
  });

  /**
   * Promotes the active draft row (or, for a never-published global, the
   * published row) to published, merging any not-yet-saved form edits on
   * top in the same mutation call — `versions.publish`'s `data` arg.
   *
   * @returns Promise resolving once publish completes (or rejects).
   * @throws Never — every rejection is caught, handled, and never re-thrown.
   */
  async function handlePublish(): Promise<void> {
    const data = globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>);
    try {
      await publishMutation({ global: global!.slug, data, version: viewedVersion?.version });
      setViewedVersion(null);
      if (globalDoc) resetWhenSaved(data);
      else form.reset();
    } catch (error) {
      applyVexFieldErrors(form, error);
    }
  }

  /**
   * Flips the published row back to a draft. Disabled client-side while an
   * outstanding draft exists (mirrors the server-side rejection this action
   * hits otherwise), so the handler itself has no rejection path beyond
   * what `useVexMutation`'s own `onError` toast already surfaces.
   *
   * @returns Resolves once the mutation settles.
   * @throws Never.
   */
  async function handleUnpublish() {
    await unpublishAsync({ global: global!.slug });
    setConfirmingUnpublish(false);
    // On success, `globalDoc.vex_status` becomes `"draft"` once the `get`
    // query refetches — Publish enables, Unpublish disables.
  }

  const { mutateAsync: saveDraftMutation, isPending: isSavingDraft } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });

  /**
   * Persists the form's currently-dirty field values as a draft, without
   * publishing them. Before the global has ever been saved, `globalDoc` is
   * undefined and the dirty-diff (`changedValues`) would be empty even
   * though the field defaults need to persist — the full form value is sent
   * instead, exactly as the non-versioned first-save path does.
   *
   * @returns Promise resolving once the draft row is saved.
   * @throws Never — a rejected mutation is caught and toasted, never
   *   re-thrown, since this is a manually-triggered action, not a form
   *   submit the caller is awaiting a result from.
   */
  async function handleSaveDraft(): Promise<void> {
    try {
      const data = globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>);
      await saveDraftMutation({ global: global!.slug, data, ...restoredFrom });
      setViewedVersion(null);
      if (globalDoc) resetWhenSaved(data);
      else form.reset();
    } catch (error) {
      toast.error("Save draft failed", { description: getVexErrorMessage(error) });
    }
  }

  const isDraftDoc =
    (globalDoc as { vex_status?: "draft" | "published" } | undefined)?.vex_status === "draft";

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

  const viewedVersionNumber = viewedVersion?.version ?? null;
  const lastViewedVersionRef = useRef(viewedVersionNumber);
  useEffect(() => {
    if (lastViewedVersionRef.current === viewedVersionNumber) return;
    lastViewedVersionRef.current = viewedVersionNumber;
    form.reset();
  }, [viewedVersionNumber]);

  useAutosave({
    values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),
    onSave: async (changes) => {
      await saveDraftMutation({ global: global.slug, data: changes, ...restoredFrom });
      setViewedVersion(null);
      // Keystrokes typed during the save stay dirty for autosave's follow-up save.
      resetWhenSaved(changes);
    },
    enabled: isVersioned && global.versions.autosave.enabled && canEdit,
  });

  const formValues = useStore(form.store, (state) => state.values);
  const { data: publishedRowWhileDraft } = useQuery({
    ...convexQuery(vexConvexApi.globals.get, { slug: global.slug }),
    enabled: isVersioned && isDraftDoc,
  });
  const publishedGlobal = isDraftDoc ? publishedRowWhileDraft : globalDoc;
  const matchesPublished =
    !!publishedGlobal &&
    valuesEqual(
      formValues,
      pickReadableValues(
        getFieldsDefaultValues({ fields: global.fields, document: publishedGlobal }),
        readableFieldKeys,
      ),
    );
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

  const formContent = (
    <div className={showSidebar ? "flex flex-col gap-6 @3xl/form:flex-row" : undefined}>
      <div className="min-w-0 flex-1">
        <RenderFields
          fields={renderedFields}
          collection={global}
          readOnly={!canEdit}
          documentStatus={documentStatus}
          fieldKeys={readableFieldKeys}
          region={showSidebar ? "main" : "all"}
          isTopLevel
        />
      </div>
      {showSidebar && (
        <div className="vex-scroll-area w-full space-y-4 @3xl/form:sticky @3xl/form:top-0 @3xl/form:-m-1 @3xl/form:max-h-[100cqh] @3xl/form:w-72 @3xl/form:shrink-0 @3xl/form:self-start @3xl/form:overflow-y-auto @3xl/form:p-1">
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
        </div>
      )}
    </div>
  );

  return (
    <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
      <div
        // See CollectionEditView: outside the scroll container, no bottom
        // margin so the divider through the handle meets this border.
        className={
          "z-10 -mx-6 flex shrink-0 flex-wrap items-center justify-between gap-y-2 border-b bg-background px-6 pt-4 pb-3"
        }
      >
        <h1 className="text-2xl font-bold">
          Edit Global - <span className="text-primary">{global.label}</span>
        </h1>
        <form.Subscribe
          selector={(state) => state.isDefaultValue}
          children={(isDefaultValue) => (
            <div className="flex flex-wrap items-center gap-2">
              {isVersioned ? (
                <DraftToolbar
                  form={form}
                  canEdit={canEdit}
                  isDefaultValue={isDefaultValue}
                  status={globalDoc ? (isDraftDoc ? "draft" : "published") : undefined}
                  saveDraft={{
                    onClick: handleSaveDraft,
                    isPending: isSavingDraft,
                    // Viewing an old version: Save Draft restores it as the
                    // current draft even with no edits on top.
                    disabled: !canEdit || (viewedVersion === null && isDefaultValue),
                  }}
                  publish={{
                    onClick: handlePublish,
                    isPending: isPublishing,
                    // Viewing an old version: Publish re-promotes it even when
                    // its content matches the live published global.
                    disabled:
                      !canPublish ||
                      (viewedVersion === null &&
                        ((!globalDoc && isDefaultValue) || matchesPublished)),
                  }}
                  unpublish={
                    globalDoc
                      ? {
                          onClick: () => setConfirmingUnpublish(true),
                          isPending: isUnpublishing,
                          disabled: !canUnpublish || isDraftDoc || !isDefaultValue,
                        }
                      : undefined
                  }
                >
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
                  <VersionHistoryDropdown
                    target={{ global: global.slug }}
                    hasDraft={isDraftDoc}
                    viewingVersion={viewedVersion?.version ?? null}
                    onViewVersion={setViewedVersion}
                    hasUnsavedChanges={!isDefaultValue}
                    activeVersion={
                      (globalDoc as { vex_activeVersion?: number } | undefined)
                        ?.vex_activeVersion ?? null
                    }
                  />
                </DraftToolbar>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}
        />
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
      {previewIsActive && isMobile && (
        <LivePreviewPanel
          previewUrl={previewUrl as string}
          collectionSlug={global.slug}
          documentId={global.slug}
          debounceMs={livePreview?.debounceMs}
          breakpoints={breakpoints}
          form={form}
          isMobile
          onClose={previewPanel.toggle}
        />
      )}
      <AlertDialog
        open={confirmingUnpublish}
        onOpenChange={(open) => {
          if (!open) setConfirmingUnpublish(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unpublish{unpublishCurrent ? ` version ${unpublishCurrent.version}` : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {unpublishVersions === undefined
                ? "Checking which version will take its place…"
                : unpublishTarget
                  ? `The global will revert to version ${unpublishTarget.version}` +
                    (unpublishTarget.publishedAt !== null
                      ? ` (published ${new Date(unpublishTarget.publishedAt).toLocaleString()})`
                      : "") +
                    `.${unpublishCurrent ? ` Version ${unpublishCurrent.version} becomes a draft and loses its published timestamp.` : ""}`
                  : "No earlier published version exists — the global will go offline and become a draft."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={unpublishVersions === undefined || isUnpublishing}
              onClick={() => {
                void handleUnpublish();
              }}
            >
              Unpublish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppForm>
  );
}
