"use client";

import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useStore } from "@tanstack/react-form";
import {
  CRUD_ACTIONS,
  DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE,
  DRAFT_ACTIONS,
  GlobalEditViewProps,
  isFieldAllowed,
  resolveLivePreviewSettings,
  vexConvexApi,
} from "@vexcms/core";
import { AppForm } from "../form";
import {
  useFieldPermissions,
  useFieldsForm,
  useLiveFieldMerge,
  usePermission,
  useVexMutation,
  useVisibleFields,
} from "../../hooks";
import { changedValues } from "../form/changedValues";
import { Button } from "../ui";
import { fieldToInputComponent } from "../fields";
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
import { DraftToolbar } from "../drafts";
import { getVexErrorMessage } from "../../lib/errors";
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

  const hasDrafts = global.versions.drafts;

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

  // Bypasses `useVexMutation` deliberately: that hook's `operation` param is
  // typed `VexMutationOperation` (`"create" | "remove" | "update" | "upsert"`),
  // which has no draft-workflow member, and nothing wires draft saves into
  // the ISR-purge pipeline `useVexMutation` exists for. Mirrors
  // `CollectionEditView`'s own `saveDraftMutation`.
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
      const data = globalDoc
        ? changedValues(form)
        : (form.state.values as Record<string, unknown>);
      await saveDraftMutation({ global: global!.slug, data });
      form.reset();
    } catch (error) {
      toast.error("Save draft failed", { description: getVexErrorMessage(error) });
    }
  }

  const isDraftDoc =
    (globalDoc as { vex_status?: "draft" | "published" } | undefined)
      ?.vex_status === "draft";

  const visibleFields = useVisibleFields({
    resource: global.slug,
    fields: global.fields,
    data: globalDoc,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useFieldsForm<Record<string, unknown>>({
    document: globalDoc,
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
      form.reset();
    },
  });

  useLiveFieldMerge({
    form,
    document: globalDoc,
    fieldKeys: readableFieldKeys,
  });

  const canEdit = usePermission({
    resource: global.slug,
    action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: globalDoc as {},
  });
  const fieldPermissions = useFieldPermissions({
    resource: global.slug,
    action: hasDrafts ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update,
    data: globalDoc,
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
            collection={global}
          />
        );
      })}
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
              {hasDrafts ? (
                <DraftToolbar
                  status={globalDoc ? (isDraftDoc ? "draft" : "published") : undefined}
                  saveDraft={{
                    onClick: handleSaveDraft,
                    isPending: isSavingDraft,
                    disabled: isDefaultValue || !canEdit,
                  }}
                />
              ) : (
                <Button
                  type="submit"
                  className="transition-all duration-300"
                  isPending={isPending}
                  disabled={isDefaultValue || !canEdit}
                >
                  Save
                </Button>
              )}
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
                className="vex-scroll-area h-full overflow-y-auto pt-4 pr-4 pb-6"
              >
                {formContent}
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
          className="vex-scroll-area -mx-6 min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6"
        >
          {formContent}
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
    </AppForm>
  );
}
