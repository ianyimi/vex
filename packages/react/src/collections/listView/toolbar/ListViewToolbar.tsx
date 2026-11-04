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
 * selection, density, …) comes from `useListViewContext()`, which
 * a built-in or a project's own contribution calls itself, exactly as
 * `edit.*` contributions call `useVexDocument()` rather than receiving
 * document state as a prop.
 */
export type ListViewToolbarSlotProps = Record<string, never>;

/**
 * Props for {@link ListViewToolbar}.
 *
 * `buildCopyLinkHref` overrides `ListViewCopyLinkButton`'s default
 * `window.location.href` — a full-state serializer is passed in when a
 * local view is active, so copying a link while a local view is active
 * shares the whole state. The rest of `ListViewToolbar`'s inputs —
 * collection, urlState, visibleColumns, hideableColumns, selection,
 * hasActiveView, density — come from `useListViewContext()`.
 *
 * `rows` is the one piece of list state NOT in `useListViewContext()` —
 * the current page's rows stay a `ListViewLayout`/`DataTable` prop, never
 * context, since it varies independently of the rest of the shared list
 * state. The bulk group's "Select
 * all N loaded" label and its select-all handler both need the current
 * page, so `ListViewLayout` (which already holds it) passes it straight
 * through, the same way it already forwards `rows` to `DataTable`.
 */
export interface ListViewToolbarProps {
  buildCopyLinkHref?: () => string;
  /** The current page's loaded rows — "Select all N loaded" counts and selects against this, never the full collection. */
  rows: TDocument[];
  /** Whether the chip row is currently showing — lifted to `ListViewLayout`, threaded through here to `ListViewFilterChips`/`ListViewFilterVisibilityToggle` (both always rendered directly by this component; chips are always inline in this row, `[Filter][eye] [chips…]`, flex-wrapping onto additional lines as needed). */
  chipsVisible: boolean;
  /** Replaces `chipsVisible`. */
  onChipsVisibleChange: (visible: boolean) => void;
  /** Server-prefetched shared views — forwarded to `ListViewModifiedControls`' own `useSavedListViews()` call. */
  initialViews?: VexStoredView[];
  /** Server-read local-view cookie index — forwarded to `ListViewModifiedControls`. */
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
}

/** Which of the three foldable controls one overflow stage's menu lists, in the toolbar's fixed fold order. */
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
  /** The controls folded at this stage, in the toolbar's fixed fold order (Copy link, then Columns, then Rows per load). */
  items: FoldItem[];
}

/**
 * The three fold stages, widest-range first, matching the toolbar's fixed
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
 * `useIsMobile() === false`, a bottom `Sheet` below 768px), not a `DropdownMenu`:
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
 * selection exists, left of everything else), the
 * always-visible group (`list.toolbar`'s `vex.list.search` plus any
 * non-collapsible project contribution), and the collapsible group (Copy
 * link, `vex.list.columns`, Rows-per-load).
 *
 * The collapse itself is pure CSS, not `ResizeObserver`
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
       * `items-center`, not `items-start` — every control THIS row's own spans wrap is
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
        {/*
         * `empty:hidden` on every wrapper in this row: an empty wrapper (no search
         * field, no toolbar contributions, no active filter/modified state) is still a
         * flex child and still claims a `gap-2`, pushing the first VISIBLE control 8px
         * off the row's left edge.
         */}
        <span className="flex shrink-0 items-center gap-2 empty:hidden">
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
         * `ListViewColumnsAction` renders `null` for a collection with no hideable
         * columns (`DataTableColumnsMenu`'s `columns.length === 0` check).
         */}
        <span className="hidden shrink-0 @xl/list:inline-flex empty:hidden">
          <ListViewColumnsAction />
        </span>
        {/*
         * Filter never leaves the search row: it has its own `shrink-0` span, hidden
         * at narrow widths while rows are selected (same rule as the eye + chips group
         * below), and never participates in a wrap decision.
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
         * The eye toggle and the chips wrap AS A UNIT: a plain `contents` flattening
         * would let the narrow eye (32px) stay on the search row while every chip
         * wraps away without it. This span is a real nested `flex flex-wrap` box —
         * one flex item of the outer row — so when its one-line width doesn't fit
         * after Filter it moves whole to a new line (`min-w-0` lets it shrink rather
         * than overflow), where the eye and chips wrap among themselves, flush with
         * the toolbar's left edge.
         *
         * `hidden @lg/list:flex` (not `cn("flex", …)`, which would apply two base
         * `display` utilities at once) hides it at narrow widths while rows are
         * selected.
         */}
        <span
          className={
            hasSelection
              ? "hidden min-w-0 flex-wrap items-center gap-2 @lg/list:flex empty:hidden"
              : "flex min-w-0 flex-wrap items-center gap-2 empty:hidden"
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
        <span className="flex shrink-0 items-center gap-2 empty:hidden">
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
