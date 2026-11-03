"use client";

import type { ReactNode } from "react";
import {
  SLOT_IDS,
  type ComponentContributionInput,
  type LocalSavedListViewsIndexEntry,
  type TDocument,
  type VexStoredView,
  type VexWhereNode,
} from "@vexcms/core";
import type { ReactHKT } from "../../../adapter";
import { SlotOutlet } from "../../../slots/SlotOutlet";
import { useListViewContext } from "../ListViewContext";
import { listBulkActionsBuiltins, listFiltersContributions, listToolbarContributions } from "../listViewBuiltinSlotContributions";
import type { ListViewRowSlotProps } from "../rowActions/ListViewRowOpenAction";
import type { ListViewFiltersSlotProps } from "../filters/ListViewFilterBuilder";
import type { ListViewUrlStateSlice } from "../useListViewUrlState";
import { ListViewCopyLinkButton } from "./ListViewCopyLinkButton";
import { ListViewColumnsAction } from "./ListViewColumnsAction";
import { ListViewModifiedControls } from "../savedListViews/ListViewModifiedControls";
import { DataTablePageSizeSelect } from "../../../ui/data-table/DataTablePageSizeSelect";
import { DataTableResponsiveMenu } from "../../../ui/data-table/DataTableResponsiveMenu";
import { Button } from "../../../ui/button";
import { SavedListViewHiddenFilterBadge } from "../savedListViews/SavedListViewHiddenFilterBadge";
import { ListViewFilterChips, ListViewFilterVisibilityToggle } from "../filters/ListViewFilterChips";

/**
 * Props every `list.toolbar` contribution receives — presently none
 * (mirrors `list.header.actions`' own `Record<string, never>`): the
 * richer list-wide state (`urlState`, `visibleColumns`, `hideableColumns`,
 * selection, density, …) comes from `useListViewContext()` (Step 9), which
 * a built-in or a project's own contribution calls itself, exactly as
 * `edit.*` contributions call `useVexDocument()` rather than receiving
 * document state as a prop (Decision 37).
 */
export type ListViewToolbarSlotProps = Record<string, never>;

/**
 * Props for {@link ListViewToolbar}.
 *
 * `buildCopyLinkHref` overrides `ListViewCopyLinkButton`'s default
 * `window.location.href` — Step 12 passes a full-state serializer when a
 * local view is active (Decision 11). The rest of `ListViewToolbar`'s inputs —
 * collection, urlState, visibleColumns, hideableColumns, selection,
 * hasActiveView, density — come from `useListViewContext()`.
 *
 * `rows` is the one piece of list state NOT in `useListViewContext()`
 * (Decision 37's own note: "the current page's rows … stay a
 * `ListViewLayout`/`DataTable` prop, never context") — the bulk group's "Select
 * all N loaded" label and its select-all handler both need the current
 * page, so `ListViewLayout` (which already holds it) passes it straight
 * through, the same way it already forwards `rows` to `DataTable`.
 */
export interface ListViewToolbarProps {
  buildCopyLinkHref?: () => string;
  /** The current page's loaded rows — "Select all N loaded" (Decision 28) counts and selects against this, never the full collection. */
  rows: TDocument[];
  /** Whether the chip row is currently showing — lifted to `ListViewLayout`, threaded through here to `ListViewFilterChips`/`ListViewFilterVisibilityToggle` (both always rendered directly by this component, Decision 10 revised 2026-10-27, further revised: chips always inline in this row, `[Filter][eye] [chips…]`, flex-wrapping onto additional lines as needed). */
  chipsVisible: boolean;
  /** Replaces `chipsVisible`. */
  onChipsVisibleChange: (visible: boolean) => void;
  /** Server-prefetched shared views (Decision 39) — forwarded to `ListViewModifiedControls`' own `useSavedListViews()` call (developer revision 2026-10-29). */
  initialViews?: VexStoredView[];
  /** Server-read local-view cookie index (Decision 41) — forwarded to `ListViewModifiedControls`. */
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
}

/** Which of the three foldable controls one overflow stage's menu lists, in Decision 22's fixed order. */
type FoldItem = "copyLink" | "columns" | "rowsPerLoad";

/**
 * One ⋯ overflow stage — a CSS container-width RANGE in which exactly this
 * stage's trigger is visible, and the exact set of controls folded at that
 * range. The three stages' ranges are mutually exclusive and together
 * cover every width below `@2xl/list` (above it, every control is inline
 * and no trigger renders at all), so exactly one trigger — and therefore
 * exactly one copy of any given control — is ever reachable at a time.
 *
 * `DropdownMenuContent` always renders through a React portal
 * (`MenuPrimitive.Portal` in `ui/dropdown-menu.tsx`; confirmed via the
 * live DOM — the popup mounts as a direct child of `<body>`), which
 * breaks the `@container/list` DOM ancestry a container-query class needs
 * to match anything — so a stage's MENU CONTENT can't filter itself by
 * width the way the inline copies do. Per-stage triggers sidestep this
 * entirely: each stage's `items` is fixed at render time (not filtered by
 * any CSS inside the portal), and only the TRIGGER's own visibility
 * (outside the portal, still inside `@container/list`) needs to react to
 * width.
 */
interface FoldStage {
  /**
   * The trigger's own visibility range, expressed as three stacked
   * `display` utilities (Tailwind emits container-query breakpoints in
   * ascending order, so a later, matching range wins over an earlier
   * one) — the idiomatic Tailwind pattern for "visible only in this
   * breakpoint range".
   */
  visibilityClassName: string;
  /** The controls folded at this stage, in Decision 22's fixed order (Copy link, then Columns, then Rows per load). */
  items: FoldItem[];
}

/**
 * The three fold stages, widest-range first, matching Decision 22/43's
 * collapse order (Copy link folds first, then Columns, then Rows per
 * load): `@xl/list`–`@2xl/list` only Copy link has folded;
 * `@lg/list`–`@xl/list` Copy link and Columns have folded; below
 * `@lg/list` all three have folded. Above `@2xl/list`, no stage's
 * trigger matches and nothing renders.
 */
const FOLD_STAGES: FoldStage[] = [
  {
    visibilityClassName: "hidden @xl/list:inline-flex @2xl/list:hidden",
    items: ["copyLink"],
  },
  {
    visibilityClassName: "hidden @lg/list:inline-flex @xl/list:hidden",
    items: ["copyLink", "columns"],
  },
  {
    visibilityClassName: "inline-flex @lg/list:hidden",
    items: ["copyLink", "columns", "rowsPerLoad"],
  },
];

/**
 * One fold stage's own ⋯ trigger and menu — visible only within
 * {@link FoldStage.visibilityClassName}'s container-width range, listing
 * exactly {@link FoldStage.items}. The trigger matches
 * `DocumentEditActionsMenu`'s own exactly: `Button variant="outline"
 * size="icon" icon="EllipsisVertical" iconPosition="center"`.
 *
 * The overlay itself is a {@link DataTableResponsiveMenu} (a `Popover` at
 * `useIsMobile() === false`, a bottom `Sheet` below 768px — Decision 22
 * point 3 / Decision 43), not a `DropdownMenu`: the folded controls'
 * `placement="menu"` forms (`ListViewCopyLinkButton`, `ListViewColumnsAction`,
 * `DataTablePageSizeSelect`) are plain rows/sections with no Base UI
 * `Menu.Root` dependency, so they render identically whether this stage's
 * container ends up a `Popover` or a `Sheet`.
 *
 * @param props - The stage config plus the shared data every item needs.
 * @returns The stage's {@link DataTableResponsiveMenu}.
 */
function ListToolbarOverflowStage(props: {
  stage: FoldStage;
  buildCopyLinkHref?: () => string;
  pageSize: number;
  pageSizeOptions: number[];
  onPageSizeChange: (pageSize: number) => void;
}): ReactNode {
  return (
    <DataTableResponsiveMenu
      trigger={
        <Button
          variant="outline"
          size="icon"
          icon="EllipsisVertical"
          iconPosition="center"
          className={props.stage.visibilityClassName}
          aria-label="More toolbar actions"
        />
      }
      title="List options"
    >
      <div className="flex flex-col gap-1">
        {props.stage.items.includes("copyLink") && (
          <ListViewCopyLinkButton buildHref={props.buildCopyLinkHref} placement="menu" />
        )}
        {props.stage.items.includes("columns") && <ListViewColumnsAction placement="menu" />}
        {props.stage.items.includes("rowsPerLoad") && (
          <DataTablePageSizeSelect
            pageSize={props.pageSize}
            pageSizeOptions={props.pageSizeOptions}
            onPageSizeChange={props.onPageSizeChange}
            placement="menu"
          />
        )}
      </div>
    </DataTableResponsiveMenu>
  );
}

/**
 * Renders the collection list's toolbar row: the inline bulk group (when a
 * selection exists, left of everything else — Decision 22), the
 * always-visible group (`list.toolbar`'s `vex.list.search` plus any
 * non-collapsible project contribution), and the collapsible group (Copy
 * link, `vex.list.columns`, Rows-per-load).
 *
 * The collapse itself is pure CSS (Decision 43), not `ResizeObserver`
 * measurement — the server render is the final render — and the folded
 * controls reuse the exact same pieces the edit view's own responsive
 * header collapse uses (`useHeaderActionsCollapse`'s
 * `DocumentEditActionsMenu`/`EditActionsMenuItem`/`ActionPlacement`
 * convention), rather than a third, list-only pattern:
 *
 * - `ListViewCopyLinkButton`, `ListViewColumnsAction` (wrapping
 *   `DataTableColumnsMenu`), and `DataTablePageSizeSelect` each take an
 *   `ActionPlacement` (`"inline"`/omitted renders the toolbar control,
 *   `"menu"` renders a `documents/EditActionsMenuItem` row or a
 *   `DropdownMenuSub`), the same `placement?: ActionPlacement` contract
 *   `DocumentCancelAction`/`CollectionDeleteAction`/`LivePreviewToggleAction`
 *   already use for the edit view's header fold.
 * - The INLINE copy of each control is wrapped in a `hidden @<bp>/list:inline-flex`
 *   span — correctly reactive to the list's own
 *   container width, since it renders directly inside `ListViewLayout`'s
 *   `@container/list` subtree.
 * - Three {@link ListToolbarOverflowStage}s, one per {@link FOLD_STAGES}
 *   entry, are ALWAYS mounted; CSS alone (`visibilityClassName`) ensures
 *   exactly one is ever visible at a given container width (or none,
 *   above `@2xl/list`) — never two, and never a stage whose own menu
 *   content doesn't exactly match what's actually folded at that width.
 *   See {@link FoldStage}'s own doc comment for why a single shared ⋯
 *   menu, filtering its OWN content by width, isn't possible (the
 *   portal/container-query conflict).
 * - `vex.list.columns` is NOT resolved through the `list.toolbar`
 *   `SlotOutlet` (unlike `vex.list.search`, which never collapses) — a
 *   single `SlotOutlet` call mounts its whole resolved list exactly once,
 *   so a per-item CSS fold needs `ListViewColumnsAction` mounted directly by
 *   this component instead, the same way Copy link/Rows-per-load already
 *   are (neither has a `vex.list.*` id either).
 *
 * This step reads `useListViewContext()`'s shape as extended by this step's
 * own anchored edit to `ListViewContext.tsx`: `collection`,
 * `urlState`, `visibleColumns`, `onVisibleColumnsChange`, `hideableColumns`,
 * `selection` (`{ selectedIds, selectedDocs, setSelectedIds, canDelete }`),
 * `hasActiveView`, and `density`/`onDensityChange`.
 *
 * @param props - {@link ListViewToolbarProps}.
 * @returns The toolbar row.
 */
export function ListViewToolbar(props: ListViewToolbarProps): ReactNode {
  const list = useListViewContext();

  const pageSizeOptions = list.collection.admin.view.state.pageSizeOptions;
  const pageSize = list.urlState.size ?? list.collection.admin.view.state.pageSize;

  const hasSelection = list.selection.selectedIds.length > 0;
  const allLoadedSelected =
    props.rows.length > 0 &&
    props.rows.every((row) => list.selection.selectedIds.includes(row._id as string));

  const bulkGroup: ReactNode | undefined = !hasSelection ? undefined : (
    <div className="flex shrink-0 items-center gap-2">
      <span aria-live="polite" className="text-sm text-muted-foreground">
        {list.selection.selectedIds.length} selected
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={allLoadedSelected}
        onClick={() =>
          list.selection.setSelectedIds(props.rows.map((row) => row._id as string))
        }
      >
        Select all {props.rows.length} loaded
      </Button>
      <SlotOutlet<ListViewRowSlotProps>
        slotId={SLOT_IDS.list.bulkActions}
        builtins={listBulkActionsBuiltins()}
        contributions={
          list.collection.admin.components
            .bulkActions as unknown as ComponentContributionInput<ReactHKT, ListViewRowSlotProps>[]
        }
        contributedProps={{ docs: list.selection.selectedDocs }}
      />
      <Button variant="ghost" size="sm" onClick={() => list.selection.setSelectedIds([])}>
        Clear
      </Button>
    </div>
  );

  return (
    <div className="flex flex-wrap items-start justify-between gap-2">
      {/*
       * `items-center`, not `items-start` (developer-reported follow-up to
       * the chip-wrap fix) — every control THIS row's own spans wrap is
       * already a uniform `h-8` (Button/Input/Select's shared height), so
       * `items-start` vs `items-center` made no visible difference for
       * them. But the chip `Badge`s and `ListViewFilterChips`'s own `Clear
       * all` Button are now DIRECT items of THIS container (flattened via
       * `display: contents`, see below) — a `Badge` is shorter than
       * `h-8`, so top-aligning it against its `h-8` siblings on the same
       * wrapped line left it sitting visibly above their vertical center.
       * `items-center` aligns every item — spans and flattened chips
       * alike — to one shared center line, on every wrapped line.
       */}
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {bulkGroup}
        <span className="flex shrink-0 items-center gap-2">
          <SlotOutlet<ListViewToolbarSlotProps>
            slotId={SLOT_IDS.list.toolbar}
            builtins={listToolbarContributions()}
            contributions={
              list.collection.admin.components
                .toolbar as unknown as ComponentContributionInput<ReactHKT, ListViewToolbarSlotProps>[]
            }
            contributedProps={{}}
          />
        </span>
        {/*
         * `empty:hidden`: `ListViewColumnsAction` renders `null` for a
         * collection with no hideable columns (`DataTableColumnsMenu`'s own
         * `columns.length === 0` check) — without this, the span itself
         * still counts as a flex child and still claims a `gap-2`, shifting
         * every control after it (most visibly "Filter") off the row's
         * left edge whenever this happens to be the FIRST rendered child
         * (e.g. a collection with neither a search field nor a hideable
         * column — developer-reported misalignment).
         */}
        <span className="hidden shrink-0 @xl/list:inline-flex empty:hidden">
          <ListViewColumnsAction />
        </span>
        {/*
         * Developer-binding (corrected again): Filter must NEVER leave
         * the search row — it gets its OWN real (non-`contents`)
         * `shrink-0` span, same `hasSelection`-hiding rule as the
         * eye+chips group below (it WAS part of that group's own
         * conditional before this split), but otherwise never
         * participates in ANY wrap decision.
         */}
        <span
          className={
            hasSelection
              ? "hidden shrink-0 items-center gap-2 @lg/list:inline-flex"
              : "flex shrink-0 items-center gap-2"
          }
        >
          <SlotOutlet<ListViewFiltersSlotProps>
            slotId={SLOT_IDS.list.filters}
            builtins={listFiltersContributions()}
            contributions={
              list.collection.admin.components
                .filters as unknown as ComponentContributionInput<
                ReactHKT,
                ListViewFiltersSlotProps
              >[]
            }
            contributedProps={{}}
          />
        </span>
        {/*
         * Developer-binding (corrected again): a plain `contents`
         * flattening of `[eye, chips…]` into the outer row (the first
         * attempt at this fix) does NOT make them wrap as a unit — `eye`
         * is narrow (32px) and often independently fits in whatever room
         * remains after Filter even when the FIRST chip doesn't, leaving
         * `eye` stranded alone on the search row while every chip wraps
         * away without it (observed live at 600/768/1100/1440px with an
         * active filter). This span is now a REAL nested `flex flex-wrap`
         * box instead — a single atomic flex item of the outer row: if
         * its own natural (all-children-on-one-line) width doesn't fit
         * in whatever room remains after Filter, it moves AS A WHOLE
         * (`min-w-0` lets it shrink below that natural width rather than
         * overflow) to a new line, where its OWN `flex-wrap` lets `eye`
         * and every chip flow/wrap among THEMSELVES across as many
         * internal rows as needed, flush with the toolbar's own left
         * edge (this span itself starts there, immediately under
         * Filter's — not Filter's own x, since Filter is a separate,
         * always-inline item now sitting earlier on line 1).
         *
         * `hidden @lg/list:flex` (not `cn("flex", …)`, which would apply
         * two base-level `display` utilities at once) mirrors the OLD
         * `hidden @lg/list:contents` conditional exactly — the same
         * `hasSelection` narrow-viewport hiding, just swapping which
         * display value it toggles to/from.
         */}
        <span
          className={
            hasSelection
              ? "hidden min-w-0 flex-wrap items-center gap-2 @lg/list:flex"
              : "flex min-w-0 flex-wrap items-center gap-2"
          }
        >
          <ListViewFilterVisibilityToggle
            collection={list.collection}
            // `VexWhereNodeOf<unknown>` → `VexWhereNode<string>`, the
            // same cast `ListViewFiltersAction.tsx`'s own identical prop
            // applies — see its doc comment.
            where={list.effectiveFilterWhere as VexWhereNode<string> | undefined}
            chipsVisible={props.chipsVisible}
            onChipsVisibleChange={props.onChipsVisibleChange}
          />
          <ListViewFilterChips
            collection={list.collection}
            where={list.effectiveFilterWhere as VexWhereNode<string> | undefined}
            onWhereChange={list.urlState.setFilter}
            visible={props.chipsVisible}
            filterValueTitles={list.filterValueTitles}
          />
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <ListViewModifiedControls
            collection={list.collection.slug}
            urlState={list.urlState as unknown as ListViewUrlStateSlice}
            defaultPageSize={list.collection.admin.view.state.pageSize}
            columns={list.columns}
            onColumnsChange={list.onColumnsChange}
            onColumnsStateChange={list.onColumnsStateChange}
            peekWidth={list.peekWidth}
            peekWidthTouched={list.peekWidthTouched}
            onPeekWidthChange={list.onPeekWidthChange}
            initialViews={props.initialViews}
            initialLocalIndex={props.initialLocalIndex}
          />
          {list.activeViewHiddenFilter && (
            <SavedListViewHiddenFilterBadge
              count={list.activeViewHiddenFilter.count}
              description={list.activeViewHiddenFilter.description}
            />
          )}
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden @2xl/list:inline-flex">
          <ListViewCopyLinkButton buildHref={props.buildCopyLinkHref} />
        </span>
        <span className="hidden @lg/list:inline-flex">
          <DataTablePageSizeSelect
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={list.urlState.setSize}
          />
        </span>
        {FOLD_STAGES.map((stage) => (
          <ListToolbarOverflowStage
            key={stage.items.join(",")}
            stage={stage}
            buildCopyLinkHref={props.buildCopyLinkHref}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            onPageSizeChange={list.urlState.setSize}
          />
        ))}
      </div>
    </div>
  );
}

/** Built-in `list.toolbar` contribution id this file's `SlotOutlet` call targets — exported so `ListViewToolbar.test.tsx` can assert it without constructing a full `CollectionConfig`. The id itself, and the `ListViewSearchAction` component behind it, are this step's `listViewBuiltinSlotContributions.ts` edit. */
export const LIST_VIEW_TOOLBAR_SLOT_ID = SLOT_IDS.list.toolbar;
