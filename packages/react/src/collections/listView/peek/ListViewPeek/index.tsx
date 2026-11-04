"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react";
import {
  buildGetArgs,
  getDataFields,
  getUIFieldKeys,
  isFieldConditionMet,
  PEEK_PANEL_MAX_WIDTH_VIEWPORT_FRACTION,
  PEEK_PANEL_MIN_WIDTH_PX,
  type AdminDataField,
  type CollectionConfig,
  type MediaCollectionConfig,
  type VexDocument,
} from "@vexcms/core";
import { useCanReadField } from "../../../../access";
import { useVisibleFields } from "../../../../fields/useVisibleFields";
import { useSuspenseVexDocQuery, useVexDocQuery } from "../../../../hooks";
import { useVexConfig } from "../../../../config/VexConfigContext";
import { adminHref } from "../../../../admin/adminHref";
import { VexLink } from "../../../../ui/VexLink";
import { Button } from "../../../../ui/button";
import { QueryErrorBoundary } from "../../../../ui/QueryErrorBoundary";
import { Icon, type IconName } from "../../../../ui/Icon";
import { Skeleton } from "../../../../ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../ui/tabs";
import { DIVIDER_HIGHLIGHT_CLASS, resolveResizeGripClass } from "../../../../ui/resizeHandleStyles";
import { SIDEBAR_WIDTH_ICON_PX, SIDEBAR_WIDTH_PX, useSidebarOptional } from "../../../../ui/sidebar";
import { cn } from "../../../../utils/cn";
import { ListViewPeekFieldsTab } from "./ListViewPeekFieldsTab";
import { ListViewPeekJsonTab } from "./ListViewPeekJsonTab";

/**
 * Shown for both a `peek` id that matches no document and one the caller
 * cannot read — the panel never reveals which.
 *
 * Exact names/copy are pinned here, not left to a later
 * design pass.
 */
export const LIST_VIEW_PEEK_UNAVAILABLE_TITLE = "Can't show this document";
/** The matching body copy, shown under {@link LIST_VIEW_PEEK_UNAVAILABLE_TITLE}. @see {@link LIST_VIEW_PEEK_UNAVAILABLE_TITLE} */
export const LIST_VIEW_PEEK_UNAVAILABLE_DESCRIPTION =
  "It may have been deleted, or you may not have access to it.";

/**
 * Classes for the ONE `div` {@link ListPeekPanel} renders — ONE element at
 * every width (one peek panel, never two
 * layouts at once, superseding an earlier always-mounted-Sheet-plus-
 * fixed-panel split): a full-width bottom sheet below `md` (768px), a
 * viewport-docked `fixed` right panel at `md` and wider. Pure CSS decides
 * which shape applies — no React state, no `@container/list` query (the
 * 768px split is a device property) — so a
 * `peek=<id>` deep link renders the right shape on the very first paint
 * at any width, no shift, no hydration flash.
 *
 * **Collapse rationale (a tab-switch hard freeze, root-caused
 * live, THEN root-caused further):** the previous design mounted BOTH
 * shapes unconditionally (a Base UI `Sheet` plus a separate plain `div`),
 * each with its OWN `<Tabs defaultValue="fields">` — so a `json`/
 * `richtext` field's Display constructed its REAL editor (CodeMirror /
 * Plate) TWICE simultaneously on every mount, one copy inside a
 * zero-size `display:none` container, looping that layout engine's own
 * measurement forever (`useVisibleOnce`'s own prior fix deferred THAT
 * construction until actual visibility). Collapsing to ONE element with
 * ONE `<Tabs>` removes the root cause structurally: `TabsPanel` itself
 * only ever mounts the ACTIVE panel (`keepMounted` defaults `false`,
 * confirmed in Base UI's own types), so there is now exactly one Fields-
 * tab Display construction at a time, period — `useVisibleOnce` is no
 * longer needed for this and has been removed (its sole justification;
 * no other caller existed).
 *
 * **What used to come from Base UI's `Sheet`/`Dialog`, rebuilt here
 * instead:**
 * - `modal={false}` (no focus trap, no scroll lock) — N/A now; a plain
 *   `div` never had either to begin with.
 * - `disablePointerDismissal` (worked around Base UI's own "outside
 *   press closes the dialog" default) — N/A now too; a plain `div` has
 *   no such built-in dismissal behavior, so nothing needs disabling.
 * - Escape-closes-the-panel — rebuilt as a small `document`-level
 *   `keydown` effect in {@link ListPeekPanel}, skipping only while focus
 *   is on an editable control INSIDE this panel.
 * - The mobile dim backdrop — rebuilt as a sibling `div`
 *   (`md:hidden`, `pointer-events-none` so the list stays interactive,
 *   exactly as before).
 * - The bottom sheet's slide-up-and-fade mount transition — rebuilt with
 *   native CSS `@starting-style` (Tailwind's `starting:` variant, no JS
 *   transition-status tracking needed) below `md`, explicitly canceled
 *   at `md` and wider (`md:starting:…`) since the desktop panel never
 *   had an entrance transition before either.
 * - An accessible name AND description read the same way at both sizes —
 *   `role="complementary"` with a (now unconditional) `aria-label` plus
 *   an `aria-describedby`-linked visually-hidden `<span>` (the old
 *   `SheetDescription`'s own text, "Inspect this document's field
 *   values."), rather than Base UI's `Title`/`Description` pair (which
 *   existed only to satisfy Base UI's OWN Dialog-specific a11y
 *   requirement — a `role="complementary"` landmark needs neither, but
 *   screen readers still read the hidden description text on entering
 *   the landmark either way).
 *
 * `top-12`/`z-40` (desktop) and `top-10`/`rounded-t-xl` (mobile) match
 * the SAME values the two previous separate elements used — `top-12`
 * is `AdminTopNav.tsx`'s own `h-12` header height (confirmed live: the
 * header doesn't span the full viewport width in every layout state, so
 * an explicit offset is needed rather than relying on z-index alone);
 * `top-10` leaves the mobile top-bar's own shorter strip visible, same
 * as `LivePreviewMobileOverlay`'s own bottom sheet. The desktop width is
 * a CSS custom property (`--peek-width`, set inline from `props.width`)
 * consumed ONLY by the `md:w-[var(--peek-width)]` utility — an inline
 * `style` always wins over a class, so gating the WIDTH RULE itself
 * behind `md:` (rather than gating the style object in JS, which can't
 * know the viewport server-side) is what keeps the mobile shape full-width
 * regardless of the resolved desktop width.
 */
const LIST_PEEK_PANEL_CLASSNAME = cn(
  "fixed inset-x-0 bottom-0 top-10 z-40 flex flex-col gap-0 overflow-hidden rounded-t-xl border-t border-border bg-popover shadow-lg",
  "transition-[transform,opacity] duration-200 ease-in-out starting:translate-y-10 starting:opacity-0",
  "md:inset-x-auto md:top-12 md:right-[var(--peek-sidebar-offset)] md:bottom-0 md:left-auto md:w-[var(--peek-width)] md:rounded-none md:border-t-0 md:border-l",
  "md:starting:translate-y-0 md:starting:opacity-100",
);

/** The mobile-only dim backdrop behind the bottom-sheet shape (`md:hidden`) — `pointer-events-none` so the list underneath stays interactive, exactly as the previous Base UI `Sheet`'s own backdrop behaved despite being a separate dialog primitive. */
const LIST_PEEK_BACKDROP_CLASSNAME =
  "fixed inset-0 z-30 bg-black/10 pointer-events-none transition-opacity duration-150 supports-backdrop-filter:backdrop-blur-xs md:hidden";

/** Pixels a single `ArrowLeft`/`ArrowRight` keypress on the peek's resize handle adjusts width by — matches `DataTable.tsx`'s own `RESIZE_STEP_PX` column-resize granularity (same look and behavior as the DataTable column-resize handles). */
const RESIZE_PEEK_STEP_PX = 12;

/**
 * The peek header's avatar — the collection's configured `admin.icon`
 * (SAME rendering as `AdminSidebar.tsx`/`AdminTopNav.tsx`/`DashboardView.tsx`'s
 * own `{collection.admin.icon && <Icon name={collection.admin.icon} .../>}`
 * pattern, just inside a circular badge matching this header's existing
 * size) when configured, falling back to a circular initials badge (the
 * panel's own stand-in for an avatar, since a document has no image) when
 * it isn't. Same `size-8` footprint either way — switching between the
 * two never shifts the header's layout.
 *
 * @returns A circular badge showing `props.icon` (when configured) or the first two characters of `props.title` (uppercased, or `"?"` when blank).
 */
function PeekInitialsAvatar(props: { title: string; icon: IconName | undefined }): ReactNode {
  const initials = props.title.trim().slice(0, 2).toUpperCase() || "?";
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
      {props.icon ? <Icon name={props.icon} size={16} /> : initials}
    </div>
  );
}

/**
 * Props for {@link ListViewPeek}.
 *
 * @typeParam TDocument - The document shape `rows` holds.
 */
export interface ListViewPeekProps<TDocument extends VexDocument = VexDocument> {
  /** The resolved collection (or media collection) config the peeked row belongs to. */
  collection: CollectionConfig | MediaCollectionConfig;
  /**
   * The `peek` URL param (`useListViewUrlState().peek`). `undefined` closes the
   * panel — the component then renders nothing, not a zero-width/hidden
   * panel or an empty `Sheet`.
   */
  peekId: string | undefined;
  /**
   * The list's currently loaded, already version-collapsed rows — the same
   * array passed to `DataTable`/`ListViewLayout`. Seeds the panel instantly via
   * `useVexDocQuery`'s `initialData` and drives the "N of M loaded" label
   * and the header's Previous/Next buttons.
   */
  rows: TDocument[];
  /**
   * Called with the next `peek` id: `undefined` to close (including Esc —
   * handled by `useListShortcuts`, not this component — a
   * backdrop click on the mobile `Sheet`, or its own close affordance), or
   * a neighbouring row's id from the header's Previous/Next buttons. Pass
   * `useListViewUrlState().setPeek` directly — the signatures match.
   */
  onPeekChange: (id: string | undefined) => void;
  /**
   * The desktop panel's current width in px —
   * `ListViewConfigCookieValues.peekWidth`/the active view's own
   * saved `peekWidth`, SSR-resolved so a deep link renders at the right
   * width on first paint with no shift. Ignored by the mobile `Sheet`
   * layout (mobile unchanged).
   */
  width: number;
  /**
   * Called with the committed width (px, already clamped) after a drag or
   * keyboard resize settles, or `undefined` for the reset button —
   * `undefined` means "clear the saved width", not "set it to zero".
   */
  onWidthChange: (width: number | undefined) => void;
  /**
   * The remembered Fields/JSON tab — admin-wide
   * (`ListViewConfigCookieValues.peekTab`), SSR-
   * resolved so a `?peek=` deep link opens on the remembered tab at
   * first paint, no flash.
   */
  activeTab: "fields" | "json";
  /** Called when the user switches tabs — persists the new tab via `writeListViewPeekTabCookie`. */
  onActiveTabChange: (tab: "fields" | "json") => void;
}

/**
 * Non-modal panel for inspecting one row's raw field values,
 * responsive across two breakpoints:
 * - A plain `div` beside the table at `@5xl/list` and wider, or
 *   viewport-docked to the right below it — chosen entirely by CSS
 *   (`@5xl/list:` variants on {@link LIST_PEEK_PANEL_CLASSNAME}), with
 *   no measurement and no React state for the switch.
 * - A bottom `Sheet`, mirroring `livePreview/LivePreviewMobileOverlay.tsx`,
 *   below the 768px viewport breakpoint — a CSS `md:hidden` class on the
 *   `Sheet`'s content, not `useIsMobile()`: a `peek=<id>` deep link can be
 *   open on first paint, so the choice between this and the container-query
 *   panel below can never be a JS branch. Both layouts are
 *   always mounted; the browser's cascade picks exactly one.
 *
 * The list behind the panel is ALWAYS interactive — there's no overlay or
 * focus trap at either non-mobile breakpoint, since neither renders a
 * dialog. "Non-modal" here isn't a prop to set; it falls out of the panel
 * being a plain `div`.
 *
 * Opens instantly by seeding `useVexDocQuery` from the already-loaded row
 * (`props.rows`) or, failing that, a live fetch via `ListPeekSuspended` below (a deep-linked
 * `peek=` id outside the loaded page, streamed in by `NextAdminPage`'s own un-awaited
 * `prefetchQuery`+`dehydrate` for the identical query key), then stays live
 * via that hook's Convex subscription for as long as the panel is open. An unreadable or
 * genuinely not-found document (live OR the server's own dehydrated prefetch) renders the
 * pinned "Can't show this document" state via
 * `QueryErrorBoundary` below — not-found and no-access read identically, by design:
 * distinguishing them would leak which ids exist.
 *
 * Field-level read access gates both tabs: a field the caller can't read is
 * omitted from the Fields tab and the JSON tab alike,
 * never shown muted — a muted-but-visible field name would itself leak that
 * the field exists.
 *
 * Deviation from the guided stub's literal step order: every hook below
 * runs unconditionally, on every render, including while `props.peekId` is
 * `undefined` — the `undefined` early return happens LAST, after every
 * hook call, not first. `ListViewPeek` is permanently mounted by
 * `CollectionListView` with `peekId={urlState.peek}`, a value that flips
 * between a string and `undefined` on the SAME mounted instance as the
 * user opens/closes the panel; an early return before any hook call would
 * change the number of hooks called across renders of that one instance,
 * which breaks React's Rules of Hooks (and, in practice, throws "change in
 * the order of Hooks"). `useVexDocQuery`'s own `id: undefined` already
 * behaves like `skip: true` (its own documented contract), so this costs
 * nothing extra while closed.
 *
 * @typeParam TDocument - The document shape `props.rows` holds.
 * @param props - {@link ListViewPeekProps}.
 * @returns The peek panel in whichever layout currently applies, or `null`
 *   while `props.peekId` is `undefined`.
 *
 * @example
 * ```tsx
 * const urlState = useListViewUrlState({ collection });
 * // `@container/list` is established by CollectionListView's own root —
 * // ListViewPeek needs no container ref of its own.
 * <div className="flex min-h-0 flex-1 gap-0">
 *   <ListViewLayout {...} />
 *   <ListViewPeek
 *     collection={collection}
 *     peekId={urlState.peek}
 *     rows={rows}
 *     onPeekChange={urlState.setPeek}
 *   />
 * </div>
 * ```
 */
export function ListViewPeek<TDocument extends VexDocument = VexDocument>(
  props: ListViewPeekProps<TDocument>,
): ReactNode {
  const rowIndex = props.rows.findIndex((row) => row._id === props.peekId);
  const seedRow = rowIndex === -1 ? undefined : props.rows[rowIndex];

  if (props.peekId === undefined) return null;

  const panelProps = {
    collection: props.collection,
    peekId: props.peekId,
    rows: props.rows,
    rowIndex,
    onPeekChange: props.onPeekChange,
    width: props.width,
    onWidthChange: props.onWidthChange,
    activeTab: props.activeTab,
    onActiveTabChange: props.onActiveTabChange,
  };

  // `seedRow` (already-loaded, from `props.rows`) resolves synchronously — no suspension
  // needed, same as before this split. Only a peek id OUTSIDE the loaded page (a deep link)
  // genuinely needs to fetch the document, via `ListPeekSuspended` below.
  if (seedRow !== undefined) {
    return <ListPeekPanel {...panelProps} document={seedRow} />;
  }

  return (
    <QueryErrorBoundary
      fallbackRender={() => (
        // Reuses `ListPeekPanel`'s OWN `document === null` branch (the pinned
        // "Can't show this document" copy) rather than new UI — not-found and unreadable
        // already read identically there, which is exactly what an error boundary catching
        // a failed/unreadable fetch needs too.
        <ListPeekPanel {...panelProps} document={null} />
      )}
    >
      <Suspense fallback={<ListPeekPanel {...panelProps} document={undefined} />}>
        <ListPeekSuspended {...panelProps} />
      </Suspense>
    </QueryErrorBoundary>
  );
}

/**
 * The `<Suspense>`-wrapped half of `ListViewPeek`
 * — only mounted when `peekId` isn't among the already-loaded `rows` (a deep-linked peek).
 * `useSuspenseVexDocQuery` integrates with React's SSR streaming/Suspense
 * resumption — unlike the plain `useQuery` this replaced, which commits "pending" to the SSR'd
 * HTML permanently if the server's own `get(peek)` prefetch hasn't settled by render time
 * (confirmed live via a hydration-mismatch investigation on `SavedListViewTabs`'s equivalent gap).
 * `NextAdminPage`'s un-awaited `prefetchQuery`+`dehydrate` for this exact `id`/`collection`/
 * `drafts` combination (built via the shared `buildGetArgs` helper,
 * the SAME helper `NextAdminPage.tsx`'s own peek prefetch uses, so the two keys always match)
 * streams in as a later chunk of the SAME response, picked up automatically by the matching
 * `convexQuery` key.
 *
 * @param props - The shared panel props (`collection`/`peekId`/`rows`/`rowIndex`/`onPeekChange`), forwarded to `ListPeekPanel` once the document resolves.
 * @returns `ListPeekPanel`, rendered once `useSuspenseVexDocQuery` resolves `props.peekId`'s document (suspending until then).
 */
function ListPeekSuspended<TDocument extends VexDocument = VexDocument>(
  props: ListPeekPanelSharedProps<TDocument>,
): ReactNode {
  const getArgs = buildGetArgs({ id: props.peekId, collection: props.collection });
  const document = useSuspenseVexDocQuery<TDocument>({
    collection: props.collection.slug,
    id: getArgs.id as TDocument["_id"],
    drafts: getArgs.drafts,
  });
  return <ListPeekPanel {...props} document={document} />;
}

/** Props {@link ListPeekPanel} and {@link ListPeekSuspended} share — everything `ListViewPeek` resolves synchronously before deciding whether to suspend. */
interface ListPeekPanelSharedProps<TDocument extends VexDocument = VexDocument> {
  collection: CollectionConfig | MediaCollectionConfig;
  peekId: string;
  rows: TDocument[];
  rowIndex: number;
  onPeekChange: (id: string | undefined) => void;
  width: number;
  onWidthChange: (width: number | undefined) => void;
  activeTab: "fields" | "json";
  onActiveTabChange: (tab: "fields" | "json") => void;
}

/**
 * The panel's actual chrome (header, Fields/JSON tabs, both responsive layouts) — moved
 * verbatim out of `ListViewPeek`'s own body (shell-streaming follow-up split) so it can mount from
 * THREE places with the exact same rendering logic: `ListViewPeek` directly (`seedRow` already
 * loaded, synchronous), a `<Suspense>` fallback (`document: undefined`, the loading skeleton),
 * or `ListPeekSuspended` once its `useSuspenseVexDocQuery` resolves. `document` drives the
 * SAME three-way branch (not-found / loading / loaded) this file always had; every hook below
 * runs unconditionally on every render of THIS component — safe now that it's its own
 * component instance per mount point, unlike the single always-mounted `ListViewPeek` the original
 * "every hook runs unconditionally" constraint (still true for `ListViewPeek` itself) was about.
 *
 * @param props - The shared panel props plus the resolved `document` — `null` for not-found/unreadable, `undefined` while still loading, a `TDocument` once loaded.
 * @returns The panel's full chrome: header, avatar, Fields/JSON tabs, both the viewport-docked and static-sidebar responsive layouts.
 */
function ListPeekPanel<TDocument extends VexDocument = VexDocument>(
  props: ListPeekPanelSharedProps<TDocument> & { document: TDocument | null | undefined },
): ReactNode {
  const document = props.document;

  // --- Raw (depth-0) document, for the JSON tab ONLY:
  // `props.document` — seeded from the already-loaded list row on the
  // common fast path — comes from `find`'s own `depth: 1` population
  // (`usePaginatedQuery`'s fixed depth), so a relationship/upload field
  // on it holds POPULATED DOCUMENTS, not the raw stored id(s) the JSON
  // tab is supposed to show "exactly as stored". Structural fix, not a
  // subtraction from the populated shape: an UNCONDITIONAL, SEPARATE
  // `get` fetch with no `depth`/`populate` (defaults to depth-0, the raw
  // shape) for the SAME `props.peekId` — same query KEY `buildGetArgs`
  // produces for `ListPeekSuspended`'s own `useSuspenseVexDocQuery` and
  // `NextAdminPage`'s own server prefetch, so a deep-linked peek's JSON
  // tab resolves from the SAME already-dehydrated cache entry, no extra
  // round trip; only the common seeded-from-`props.rows` fast path pays
  // for a genuinely new subscription (a brief JSON-tab-only loading
  // state, below — the rest of the panel, including the Fields tab,
  // keeps opening instantly from `props.document` exactly as before.
  // This ALSO means `hasUnpublishedChanges` (`mergeDraftCounterparts`'s
  // own computed flag, checked for being the only one of its kind — it
  // is) can never reach the JSON tab at all: `get`'s server function
  // never attaches it, so there's nothing left to subtract.
  const rawGetArgs = buildGetArgs({ id: props.peekId, collection: props.collection });
  const { document: rawDocument } = useVexDocQuery<TDocument>({
    collection: props.collection.slug,
    id: rawGetArgs.id as TDocument["_id"],
    drafts: rawGetArgs.drafts,
  });

  const config = useVexConfig();

  // --- Sidebar-aware positioning (the peek must
  // never overlap the admin sidebar, at any side/open/collapsed/offcanvas
  // state) -----------------------------------------------------------
  // `useSidebarOptional` (not `useSidebar`, which throws outside a
  // provider) — every REAL admin page renders inside `AdminLayout`'s
  // `SidebarProvider`, but the test harness doesn't wrap one, and "no
  // sidebar, no offset" (today's exact behavior) is the correct fallback
  // there. Only a RIGHT-side, non-mobile sidebar ever competes with this
  // RIGHT-docked panel for the same edge — a LEFT sidebar never needs an
  // offset (this panel is `fixed`, positioned against the true viewport,
  // unaffected by a LEFT sibling's own layout width), and the sidebar is
  // an off-canvas overlay (no layout space) below its own 768px
  // breakpoint, the SAME breakpoint this panel's own mobile shape takes
  // over at.
  const sidebar = useSidebarOptional();
  const sidebarCollidesWithPeek = config.admin.sidebar.side === "right" && sidebar !== null && !sidebar.isMobile;
  const sidebarCollapsedOffsetPx = config.admin.sidebar.collapsible === "icon" ? SIDEBAR_WIDTH_ICON_PX : 0;
  const sidebarCollapsedOffsetCss =
    config.admin.sidebar.collapsible === "icon" ? "var(--sidebar-width-icon)" : "0px";
  const sidebarOffsetPx = !sidebarCollidesWithPeek
    ? 0
    : sidebar!.state === "expanded"
      ? SIDEBAR_WIDTH_PX
      : sidebarCollapsedOffsetPx;
  const sidebarOffsetCssValue = !sidebarCollidesWithPeek
    ? "0px"
    : sidebar!.state === "expanded"
      ? "var(--sidebar-width)"
      : sidebarCollapsedOffsetCss;

  // Animates `--peek-sidebar-offset`'s own CSS-var-driven `right` shift
  // (the sidebar itself animates open/closed, but the
  // panel's offset jumped instantly, so the two visibly fell out of sync
  // mid-toggle) in lockstep with the sidebar's OWN transition — reuses
  // {@link SIDEBAR_TRANSITION_CLASS} (`ui/sidebar.tsx`'s own token, not
  // independently copied numbers) so the two can never drift if the
  // sidebar's own duration/easing ever changes. Scoped to ONLY `right`
  // here (not `left`/`width`, unlike the sidebar's own 3-property list) —
  // this panel never animates `left` at all, and `width` must stay
  // INSTANT during an active resize drag (`liveDragWidth !== null`),
  // which this same flag also gates off entirely (not just narrowed to
  // `right`, since a transitioning `right` while ALSO mid-drag would
  // still read as "glitchy" once the drag ends and the browser catches
  // up). `hasMounted` suppresses it on the very first paint (SSR/a cold
  // deep link) — the panel's INITIAL position should never visibly
  // "animate in" from a wrong offset, only react to a LATER toggle.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  const dataFields = useMemo(
    () => getDataFields({ fields: props.collection.fields }),
    [props.collection.fields],
  );

  // --- Resize ---------------
  // Mirrors `DataTable.tsx`'s own `startResize`/`handleResizeKeyDown`
  // column-resize mechanics exactly (raw pointer events on `document`,
  // `RESIZE_STEP_PX` keyboard granularity, a `liveDrag`-during-drag /
  // committed-width-otherwise split) — NOT literally shared code, since
  // the commit target differs fundamentally (one scalar prop here vs
  // `columnEntries` state there), but reusing the IDENTICAL approach so
  // the gesture feels indistinguishable. `invert` is always `true` here
  // (unlike `DataTable`'s per-column `invert` flag): this handle sits on
  // the panel's LEFT edge while the panel itself is anchored to the
  // viewport's RIGHT edge, so dragging LEFT (negative `clientX` delta)
  // must GROW the panel — the same relationship `DataTable` already
  // handles for a PINNED-RIGHT column's own left-edge handle.
  const liveDragWidthRef = useRef<number | null>(null);
  const [liveDragWidth, setLiveDragWidth] = useState<number | null>(null);
  const [resizeHovered, setResizeHovered] = useState(false);
  const resizeActive = resizeHovered || liveDragWidth !== null;

  function clampPeekWidth(width: number): number {
    // Subtracts the sidebar's own current pixel width first (when it
    // collides with this panel, i.e. a RIGHT-side, non-mobile sidebar) —
    // the 60% cap is of the AVAILABLE width, not the full viewport, so
    // growing the panel can never visually reach into the sidebar's own
    // area even at its most generous clamp.
    const availableWidth = typeof window === "undefined" ? width : window.innerWidth - sidebarOffsetPx;
    const maxWidth = typeof window === "undefined" ? width : availableWidth * PEEK_PANEL_MAX_WIDTH_VIEWPORT_FRACTION;
    return Math.round(Math.min(maxWidth, Math.max(PEEK_PANEL_MIN_WIDTH_PX, width)));
  }

  function startResize(event: ReactMouseEvent<HTMLDivElement> | ReactTouchEvent<HTMLDivElement>): void {
    if ("button" in event && event.button !== 0) return;
    event.preventDefault();
    const startX = "touches" in event ? event.touches[0]!.clientX : event.clientX;
    const startWidth = props.width;
    function handleMove(moveEvent: MouseEvent | TouchEvent): void {
      const clientX = "touches" in moveEvent ? moveEvent.touches[0]!.clientX : (moveEvent as MouseEvent).clientX;
      const nextWidth = clampPeekWidth(startWidth - (clientX - startX));
      liveDragWidthRef.current = nextWidth;
      setLiveDragWidth(nextWidth);
    }
    function handleUp(): void {
      globalThis.document.removeEventListener("mousemove", handleMove);
      globalThis.document.removeEventListener("mouseup", handleUp);
      globalThis.document.removeEventListener("touchmove", handleMove);
      globalThis.document.removeEventListener("touchend", handleUp);
      const final = liveDragWidthRef.current;
      liveDragWidthRef.current = null;
      setLiveDragWidth(null);
      if (final !== null) props.onWidthChange(final);
    }
    globalThis.document.addEventListener("mousemove", handleMove);
    globalThis.document.addEventListener("mouseup", handleUp);
    globalThis.document.addEventListener("touchmove", handleMove);
    globalThis.document.addEventListener("touchend", handleUp);
  }

  /**
   * `ArrowLeft`/`ArrowRight` on the focused handle — `ArrowLeft` grows the panel (mirrors dragging left), `ArrowRight` shrinks it, a discrete `RESIZE_PEEK_STEP_PX` commit per keypress.
   *
   * @param event - The keydown on the resize handle; any key other than `ArrowLeft`/`ArrowRight` is ignored.
   */
  function handleResizeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowLeft" ? RESIZE_PEEK_STEP_PX : -RESIZE_PEEK_STEP_PX;
    props.onWidthChange(clampPeekWidth(props.width + delta));
  }

  // Clamped for DISPLAY only — `props.width` (the stored/cookie value)
  // is never written back here. A width saved while the panel had more
  // room (sidebar collapsed, or a wider viewport) must still render at
  // today's max rather than overflow, but the saved value itself stays
  // untouched so it's available again the moment room reopens (sidebar
  // collapses again, window widens) — the same "derived, not persisted"
  // split `renderedWidth` already drew between `liveDragWidth` and
  // `props.width` before this.
  const renderedWidth = liveDragWidth ?? clampPeekWidth(props.width);

  // Only active once mounted (never on the very first paint — a cold
  // deep link's initial position must never visibly "animate in") AND
  // never while a resize drag is live (`liveDragWidth !== null` — an
  // active drag commits a new `renderedWidth` on every pointermove, and
  // transitioning `right`/`width` together during a drag would lag the
  // cursor instead of tracking it instantly, the opposite of what a
  // resize handle needs). `md:`-scoped like every other desktop-only
  // rule on this panel — the mobile bottom-sheet's own `starting:`
  // transition (`LIST_PEEK_PANEL_CLASSNAME`) is separate and untouched
  // by this. The literal class below (not built from
  // {@link SIDEBAR_TRANSITION_CLASS} at runtime — Tailwind's scanner
  // needs a literal string in source to generate the utility, a
  // dynamically-concatenated one wouldn't reliably end up in the
  // compiled CSS) still SHARES its duration/easing with the sidebar's
  // own transition — `ListViewPeek.test.tsx`'s own sync test asserts the
  // two never drift, so a change to one is forced to update the other
  // deliberately rather than silently.
  const sidebarSyncTransitionClass =
    hasMounted && liveDragWidth === null ? "md:transition-[right] md:duration-200 md:ease-linear" : "";

  // --- Escape closes the panel (no Base UI Dialog to lean on)
  // -------------------------------------------------------------------
  // Replaces Base UI's `Dialog` own built-in Escape handling, dropped
  // along with the rest of `Sheet`/`Dialog` below — a GLOBAL `document`
  // listener (not a scoped `onKeyDown` prop) so Escape still closes the
  // peek regardless of which element currently has focus, exactly like
  // Base UI's own dialog-level handling did, EXCEPT while focus is on an
  // input/textarea/select/contenteditable INSIDE this panel (there are
  // none in the read-only Fields/JSON tabs today, but this guard matches
  // the general contract Base UI's own `Escape` handling never violated
  // either — an editable control inside a dialog gets first say).
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      const active = globalThis.document.activeElement as HTMLElement | null;
      if (
        active &&
        panelRef.current?.contains(active) &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.tagName === "SELECT" ||
          active.isContentEditable)
      ) {
        return;
      }
      props.onPeekChange(undefined);
    }
    globalThis.document.addEventListener("keydown", handleKeyDown);
    return () => globalThis.document.removeEventListener("keydown", handleKeyDown);
  }, [props.onPeekChange]);

  // `admin.hidden`/`admin.condition` filtering against THIS document — the
  // same structural rule `RenderFields`'s `isFieldEntryVisible` and
  // `useFieldCondition`'s pure `isFieldConditionMet` apply in the edit
  // view, just evaluated once against this fixed document instead of live
  // form state (there is no form here to watch).
  const conditionFields = useMemo(() => {
    if (document == null) return {};
    const result: Record<string, AdminDataField> = {};
    for (const [key, field] of Object.entries(dataFields)) {
      if (field.admin.hidden) continue;
      if (
        !isFieldConditionMet({
          field,
          data: document as Record<string, unknown>,
          siblingData: document as Record<string, unknown>,
        })
      ) {
        continue;
      }
      result[key] = field;
    }
    return result;
  }, [dataFields, document]);

  // The SAME hook `CollectionEditView` uses to decide which fields an edit
  // form renders ("field read access gates every list
  // control," reused rather than reimplemented) — so the peek never
  // disagrees with the edit view about what the caller may read.
  const visibleFieldEntries = useVisibleFields({
    resource: props.collection.slug,
    fields: conditionFields,
    data: document ?? undefined,
  });

  // `canReadField` answers the SAME "may the caller read this field" question
  // `useVisibleFields` already resolves for data fields, but for the
  // TWO gateable system keys (`_creationTime`/`vex_status`) and UI
  // fields (`getUIFieldKeys`) — neither kind is a `dataFields`
  // entry, so neither goes through `conditionFields`/`useVisibleFields`
  // at all. Used below to gate the Created row, the JSON tab's system
  // keys, and this notice's own count.
  const canReadField = useCanReadField({ resource: props.collection.slug });
  const uiFieldKeys = useMemo(
    () => getUIFieldKeys({ fields: props.collection.fields }),
    [props.collection.fields],
  );
  const hiddenSystemFieldCount =
    (canReadField("_creationTime") ? 0 : 1) +
    (props.collection.versions.drafts && !canReadField("vex_status") ? 1 : 0);
  const hiddenUIFieldCount = uiFieldKeys.filter((key) => !canReadField(key)).length;
  const hiddenByPermissionCount =
    Object.keys(conditionFields).length -
    visibleFieldEntries.length +
    hiddenSystemFieldCount +
    hiddenUIFieldCount;

  // Wraps within the loaded rows: Previous on the FIRST row goes to the LAST, Next on the
  // LAST goes to the FIRST — never a dead end. Disabled only when there's
  // genuinely nowhere to go: a single loaded row, or `rowIndex === -1`
  // (a deep-linked peek outside the loaded page — no row LIST to wrap
  // within at all, same "no navigation" case the un-wrapped version
  // already had for this one).
  const canNavigateRows = props.rowIndex !== -1 && props.rows.length > 1;
  const previousRowIndex = props.rowIndex === 0 ? props.rows.length - 1 : props.rowIndex - 1;
  const nextRowIndex = props.rowIndex === props.rows.length - 1 ? 0 : props.rowIndex + 1;
  const titleValue =
    document != null
      ? String((document as Record<string, unknown>)[props.collection.admin.useAsTitle] ?? document._id)
      : undefined;

  // Shared across all three states (not-found, loading, loaded) — "shown
  // in every layout" only means ANYTHING otherwise; a panel
  // stuck on a not-found/loading document with no close affordance would
  // be undismissable at the wide/right-sheet breakpoints, which have none
  // of their own (unlike the mobile `Sheet`'s Esc/backdrop).
  const header = (
    <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
      {titleValue !== undefined ? (
        <>
          <PeekInitialsAvatar title={titleValue} icon={props.collection.admin.icon} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{titleValue}</p>
            {props.rowIndex !== -1 ? (
              <p className="text-xs text-muted-foreground">
                {props.collection.labels.singular} · {props.rowIndex + 1} of {props.rows.length}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            icon="ChevronLeft"
            aria-label="Previous row"
            disabled={!canNavigateRows}
            onClick={() => props.onPeekChange(props.rows[previousRowIndex]?._id)}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            icon="ChevronRight"
            aria-label="Next row"
            disabled={!canNavigateRows}
            onClick={() => props.onPeekChange(props.rows[nextRowIndex]?._id)}
          />
          <VexLink
            href={adminHref({ type: "document", slug: props.collection.slug, id: props.peekId }, config.basePath)}
            className="flex items-center gap-1 px-1 text-sm text-muted-foreground hover:text-primary"
          >
            Edit
            <Icon name="ExternalLink" size={14} />
          </VexLink>
        </>
      ) : (
        <div className="min-w-0 flex-1" />
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        icon="X"
        aria-label="Close"
        onClick={() => props.onPeekChange(undefined)}
      />
    </div>
  );

  let content: ReactNode;
  if (document === null) {
    content = (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
        <p className="text-sm font-medium">{LIST_VIEW_PEEK_UNAVAILABLE_TITLE}</p>
        <p className="text-sm text-muted-foreground">{LIST_VIEW_PEEK_UNAVAILABLE_DESCRIPTION}</p>
      </div>
    );
  } else if (document === undefined) {
    content = (
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
      </div>
    );
  } else {
    // "Some fields are hidden by your permissions" fires only when
    // permission narrows the set below what `admin.hidden`/`admin.condition`
    // alone would already show — a blanket no-field-readable role is the
    // document-level gate's business (already decided before this renders),
    // not this notice's (mirrors `useVisibleFields`'s own "discriminates"
    // reasoning). Rendered synchronously in the same pass as the rest of
    // this loaded-state content (never a later effect), so it never shifts
    // anything that was already on screen.
    const hiddenNotice =
      hiddenByPermissionCount > 0 ? (
        <div
          role="status"
          className="mx-3 mt-2 rounded-md border border-dashed px-3 py-1.5 text-sm text-muted-foreground"
        >
          Some fields are hidden by your permissions.
        </div>
      ) : null;

    content = (
      <div className="flex min-h-0 flex-1 flex-col">
        {hiddenNotice}
        <Tabs
          value={props.activeTab}
          onValueChange={(value) => props.onActiveTabChange(value as "fields" | "json")}
          className="flex min-h-0 flex-1 flex-col gap-2"
        >
          <TabsList className="mx-3 mt-2 w-fit">
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
          <TabsContent value="fields" className="flex min-h-0 flex-1 flex-col">
            <ListViewPeekFieldsTab
              document={document}
              visibleFieldEntries={visibleFieldEntries}
              canReadField={canReadField}
              collection={props.collection}
            />
          </TabsContent>
          <TabsContent value="json" className="flex min-h-0 flex-1 flex-col">
            <ListViewPeekJsonTab
              rawDocument={rawDocument as Record<string, unknown> | null | undefined}
              dataFields={dataFields}
              visibleFieldEntries={visibleFieldEntries}
              canReadField={canReadField}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <>
      {/* Mobile-only dim backdrop ({@link LIST_PEEK_BACKDROP_CLASSNAME}'s own doc comment). */}
      <div aria-hidden="true" className={LIST_PEEK_BACKDROP_CLASSNAME} />
      {/*
       * ONE panel at every width (one peek
       * panel, never two layouts at once — supersedes the previous
       * always-mounted Base UI `Sheet` plus separate plain `div`; see
       * {@link LIST_PEEK_PANEL_CLASSNAME}'s own doc comment for the full
       * collapse rationale and the Base UI feature-by-feature audit).
       * `aria-label` is unconditional now (same accessible name at every
       * width) — previously the Sheet's title
       * was static while the desktop div's label went `undefined` during
       * loading/not-found; picking ONE behavior for both.
       */}
      <div
        ref={panelRef}
        role="complementary"
        aria-label={`${props.collection.labels.singular} preview`}
        aria-describedby="list-peek-description"
        className={cn(LIST_PEEK_PANEL_CLASSNAME, sidebarSyncTransitionClass)}
        style={{ ["--peek-width" as string]: `${renderedWidth}px`, ["--peek-sidebar-offset" as string]: sidebarOffsetCssValue }}
      >
        <span id="list-peek-description" className="sr-only">
          Inspect this document's field values.
        </span>
        <div className="flex h-full min-h-0 flex-col">
          {header}
          {content}
        </div>
        {/*
         * Resize handle — desktop only (`hidden md:contents`: invisible AND
         * non-interactive below `md`, transparent to layout at `md`+ so its
         * 3 children participate exactly as if unwrapped). Rendered AFTER
         * `{header}{content}` — the handle only worked
         * near the panel's top — `header`/`content`'s own flow boxes,
         * painted LATER in DOM order with no z-index on either side,
         * covered the lower portion of the absolutely-positioned handle
         * even though its OWN rect already spanned the panel's full
         * height) — later DOM order wins the default stacking battle, so
         * moving this group last makes it paint (and capture pointer
         * events) on TOP of the body content along the entire left edge,
         * confirmed live via `elementFromPoint` at the panel's bottom.
         */}
        <div className="hidden md:contents">
          <div aria-hidden="true" data-active={resizeActive} className={cn(DIVIDER_HIGHLIGHT_CLASS, "left-0")} />
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize preview width"
            tabIndex={0}
            className="absolute top-0 left-0 h-full w-1.5 cursor-col-resize touch-none select-none focus-visible:outline-none"
            data-resizing={liveDragWidth !== null}
            onMouseDown={startResize}
            onTouchStart={startResize}
            onMouseEnter={() => setResizeHovered(true)}
            onMouseLeave={() => setResizeHovered(false)}
            onFocus={() => setResizeHovered(true)}
            onBlur={() => setResizeHovered(false)}
            onKeyDown={handleResizeKeyDown}
            onDoubleClick={() => props.onWidthChange(undefined)}
          >
            <div aria-hidden="true" className={resolveResizeGripClass("left")} />
          </div>
          {resizeActive && (
            <Button
              variant="outline"
              size="icon-sm"
              icon="RotateCcw"
              aria-label="Reset peek width"
              className="absolute top-1/2 left-0 z-10 -translate-x-[calc(100%+4px)] -translate-y-1/2 bg-popover shadow-sm"
              onClick={() => props.onWidthChange(undefined)}
            />
          )}
        </div>
      </div>
    </>
  );
}
