import type {
  AdminDataField,
  BaseFieldMeta,
  CellComponentProps,
  DataFieldType,
  DisplayComponentProps,
  FieldComponentProps,
  FilterInputProps,
} from "./fields";
import type { ApplyComponent, ComponentHKT } from "./components/types";
import type { VexDocument } from "./documents/types";
import { CollectionSlug, GlobalSlug, VexDocumentGlobal } from "./types/generated";
import type { ListViewConfigCookieValues } from "./collections/listView/listViewConfigCookies";
import type { LocalSavedListViewsIndexEntry } from "./collections/savedListViews/localSavedListViewsCookie";

/**
 * Maps every field type in the `AdminField` union to the framework's input component type
 * for that field.
 *
 * Keyed by `AdminField['type']` — as new field types are added to the union, TypeScript
 * automatically requires a matching component slot in this map.
 *
 * Each slot resolves to `ApplyComponent<F, FieldComponentProps<MatchingFieldDef>>`, which
 * means the component must accept the input props for that specific field type. This gives
 * the component full autocomplete for field-specific properties (e.g. `fieldDef.max`
 * on the text slot).
 *
 * @see {@link CellComponentProps} for the data table cell props
 * @see {@link ComponentHKT} for how framework packages define their HKT
 * @see {@link ApplyComponent} for how the HKT resolves to a concrete component type
 */
export type FieldComponentMap<
  F extends ComponentHKT,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> = {
  [K in DataFieldType]: {
    field: ApplyComponent<
      F,
      Omit<
        FieldComponentProps<TFieldMeta, Extract<AdminDataField<TFieldMeta>, { type: K }>>,
        "renderDefault"
      >
    >;
    cell: ApplyComponent<F, CellComponentProps<Extract<AdminDataField<TFieldMeta>, { type: K }>>>;
    /**
     * The read-only display component for this field type (polish round),
     * beside `field`/`cell`/`filterInput` — OPTIONAL: `fieldToDisplayComponent`
     * falls back to this type's `cell` when no `display` is registered, so a
     * type with no richer read-only presentation (most scalar types) needs
     * no entry here at all.
     */
    display?: ApplyComponent<F, DisplayComponentProps<Extract<AdminDataField<TFieldMeta>, { type: K }>>>;
    /**
     * The filter row value control for this field type,
     * beside `field`/`cell` — OPTIONAL, unlike those two: UI-only
     * container types (`tabs`/`collapsible`/`row`/`ui`) and structured
     * data types with no meaningful single-value comparison (`json`/
     * `richtext`/`array`/`blocks`/`group`) register none, same absence
     * `field`/`cell` already show for the UI-only set.
     */
    filterInput?: ApplyComponent<F, FilterInputProps<Extract<AdminDataField<TFieldMeta>, { type: K }>>>;
  };
};

/**
 * Props passed to the admin `Dashboard` view component.
 *
 * Empty: `DashboardView` reads the full config from `useVexConfig()` — there
 * is no longer a server → client boundary for it to cross as a prop.
 *
 * @see {@link ViewComponentMap}
 */
export interface DashboardProps {}

/**
 * Props passed to the `CollectionListView` component.
 *
 * `TCollectionSlug` narrows to a literal collection slug when the caller
 * supplies one; every real caller in this codebase passes a runtime string
 * (from a URL segment or a config lookup), so it resolves to the full
 * `CollectionSlug` union in practice.
 *
 * @see {@link ViewComponentMap}
 */
export interface CollectionListViewProps<TCollectionSlug extends CollectionSlug = CollectionSlug> {
  /** The slug of the collection being listed, resolved from `useVexConfig()`. */
  collection: TCollectionSlug;
  /**
   * Layout-affecting list preferences resolved server-side from cookies
   * (`parseListViewConfigCookies`) — density today, extended as
   * more arrive. Seeds `CollectionListView`'s own state so the row height
   * the server rendered and the client's first paint agree. Omit when
   * rendering client-side only (falls back to `"comfortable"`).
   */
  initialPreferences?: ListViewConfigCookieValues;
  /**
   * The consolidated `vex-admin:<collection>` cookie's `localViews` field,
   * read server-side by `NextAdminPage` —
   * renders a local view's tab on first paint before `localStorage`
   * hydrates it. Omit when rendering client-side only.
   */
  initialLocalIndex?: LocalSavedListViewsIndexEntry[];
  /**
   * The consolidated `vex-admin:<collection>` cookie's `rowCounts` field for the active view,
   * read server-side by `NextAdminPage` — the
   * `<Suspense>` loading-skeleton fallback (`CollectionListView.tsx`) renders exactly this many
   * skeleton rows instead of a fixed `pageSize` guess, matching the row count this view's
   * result last actually settled with. `undefined` (no cookie entry for this view yet) falls
   * back to `pageSize`; `0` renders no skeleton rows and no footer, matching the settled empty
   * state's own shape as closely as a data-free skeleton can.
   */
  initialSkeletonRowCount?: number;
  /**
   * The SAME cookie entry's `done` flag — whether
   * the active view's last settled result showed "That's everything" (`true`) or a Load More
   * `Button` (`false`). `DataTable`'s own `isPending` skeleton footer renders the MATCHING
   * variant instead of always reserving the taller `Button`'s height. `undefined` (no cookie
   * entry yet) falls back to the `Button` variant (the prior, safer-default behavior).
   */
  initialSkeletonDone?: boolean;
  /**
   * Server-resolved titles for every `relationship`/`upload` id the ACTIVE
   * filter names — `NextAdminPage` walks `resolved.where`
   * via `collectListViewFilterRelationshipValues`, fetches each distinct target
   * document, and reduces to `{ [id]: doc[useAsTitle] ?? doc._id }`
   * (`null` for not-found/denied, degrading rather than crashing).
   * Seeds `ListViewContext`'s own `filterValueTitles` so a
   * relationship/upload filter chip/row shows the target's TITLE, not its
   * raw id, on the very first paint — no flash from id to title once the
   * client's own picker-driven lookups would otherwise resolve it later.
   * `undefined`/missing entries fall back to the raw id (never a blocking
   * state).
   */
  initialFilterValueTitles?: Record<string, string | null>;
}

/**
 * Props passed to the `CollectionEditView` component.
 *
 * `TCollectionSlug` narrows to a literal when the caller supplies one — see
 * the note on {@link CollectionListViewProps}.
 *
 * @see {@link ViewComponentMap}
 */
export interface CollectionEditViewProps<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDocument extends VexDocument = VexDocument,
> {
  /** The slug of the collection whose fields will be rendered, resolved from `useVexConfig()`. */
  collection: TCollectionSlug;
  /**
   * The Convex document ID of the document being edited.
   * Omit for new document creation — the form will be empty.
   */
  documentId: VexDocument["_id"];
  /**
   * Pre-fetched document from the server for SSR hydration.
   * `null` explicitly means "no document found". `undefined` means "not loaded yet".
   */
  initialData?: TDocument | null;
  /**
   * The live-preview panel's initial open state, read server-side from the
   * `vex-admin:<collection>` cookie's `livePreview.panelOpen` field (or the collection's
   * `admin.livePreview.defaultOpen` when no cookie exists) by `NextAdminPage`.
   */
  initialPreviewPanelOpen?: boolean;
  /**
   * The live-preview split's handle position — the form column's percentage of
   * the pane — read server-side from the `vex-admin:<collection>`
   * cookie's `livePreview.panelSize` field by `NextAdminPage`, so a remembered width
   * renders on the first paint instead of snapping into place after hydration.
   */
  initialPreviewPanelSize?: number;
  /**
   * The preview URL resolved server-side for a `{ server }` resolver, so the
   * iframe's first paint needs no Convex round trip.
   */
  initialPreviewUrl?: string;
}

/**
 * Props passed to the `GlobalEditView` component.
 *
 * `TGlobalSlug` narrows to a literal when the caller supplies one — see the
 * note on {@link CollectionListViewProps}.
 *
 * @see {@link ViewComponentMap}
 */
export interface GlobalEditViewProps<
  TGlobalSlug extends GlobalSlug = GlobalSlug,
  TDocument extends VexDocumentGlobal = VexDocumentGlobal,
> {
  /** The slug of the global whose fields will be rendered, resolved from `useVexConfig()`. */
  global: TGlobalSlug;
  /**
   * Pre-fetched document from the server for SSR hydration.
   * `null` explicitly means "no document found". `undefined` means "not loaded yet".
   */
  initialData?: TDocument | null;
  /**
   * The live-preview panel's initial open state, read server-side from the
   * shared `vex-admin` cookie's `livePreview.panelOpen` field (or the global's
   * `admin.livePreview.defaultOpen` when no cookie exists) by `NextAdminPage`.
   */
  initialPreviewPanelOpen?: boolean;
  /**
   * The live-preview split's handle position — the form column's percentage of
   * the pane — read server-side from the shared `vex-admin`
   * cookie's `livePreview.panelSize` field by `NextAdminPage`, so a remembered width
   * renders on the first paint instead of snapping into place after hydration.
   */
  initialPreviewPanelSize?: number;
  /**
   * The preview URL resolved server-side for a `{ server }` resolver, so the
   * iframe's first paint needs no Convex round trip.
   */
  initialPreviewUrl?: string;
}

/**
 * Maps the three required admin views to their framework component types.
 *
 * All three are required — omitting any one causes a TypeScript error at the
 * `defineFrameworkAdapter` call site.
 *
 * @see {@link FrameworkAdapterInput}
 */
export type ViewComponentMap<F extends ComponentHKT> = {
  /** Dashboard view — reads the full VexCMS config from `useVexConfig()`. */
  dashboard: ApplyComponent<F, DashboardProps>;
  /** Collection list view — renders a list of documents for a collection. */
  collectionListView: ApplyComponent<F, CollectionListViewProps>;
  /** Collection edit form — renders all field inputs for a collection. */
  collectionEditView: ApplyComponent<F, CollectionEditViewProps>;
};

/**
 * Input type for `defineFrameworkAdapter()`.
 *
 * Framework packages pass this to register their component implementations.
 * TypeScript enforces that every field type in the `AdminField` union has both
 * an input component (`fields`) and a cell component (`cells`), and that each
 * component accepts the correct props for its field type.
 *
 * **What the HKT does:**
 * The `F` parameter is the framework's HKT — a type-level function that maps
 * a props type to the framework's component type. For React:
 * ```ts
 * interface ReactHKT extends ComponentHKT {
 *   component: ComponentType<this['_props']>;
 * }
 * ```
 * Passing `ReactHKT` as `F` means every slot in `fields` and `cells` resolves to
 * `ComponentType<CorrectProps>`, giving the component full prop autocomplete.
 *
 * @example
 * ```ts
 * // In @vexcms/react
 * import { defineFrameworkAdapter, ComponentHKT } from '@vexcms/core';
 * import { ComponentType } from 'react';
 *
 * interface ReactHKT extends ComponentHKT {
 *   component: ComponentType<this['_props']>;
 * }
 *
 * export const reactAdapter = defineFrameworkAdapter<ReactHKT>({
 *   name: 'react',
 *   version: '0.1.0',
 *   fields: {
 *     text: TextFieldComponent,  // must accept FieldComponentProps<TextField>
 *   },
 *   cells: {
 *     text: TextCellComponent,   // must accept CellComponentProps<TextField>
 *   },
 * });
 * ```
 *
 * @see {@link FrameworkAdapter} for the resolved type returned by `defineFrameworkAdapter`
 * @see {@link FieldComponentMap} for the field component slot types
 * @see {@link CellComponentProps} for the cell component props
 */
export interface FrameworkAdapterInput<
  F extends ComponentHKT,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> {
  /** Framework name used for identification (e.g. `"react"`, `"solid"`). */
  name: string;
  /** Adapter version — should match the framework package version. */
  version: string;
  /**
   * Input components for each field type, rendered in the document edit form.
   * Every type in the `AdminField` union must have a corresponding component.
   */
  fields: FieldComponentMap<F, TFieldMeta>;
  /**
   * Admin view components — required for rendering the admin panel.
   * All three must be provided; TypeScript enforces completeness.
   */
  views: ViewComponentMap<F>;
}

/**
 * Resolved framework adapter returned by `defineFrameworkAdapter()`.
 *
 * @see {@link FrameworkAdapterInput} for the user-facing input type
 * @see {@link defineFrameworkAdapter} for the function that produces this type
 */
export type FrameworkAdapter<
  F extends ComponentHKT,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
> = FrameworkAdapterInput<F, TFieldMeta>;

/**
 * Registers a framework adapter, enforcing that all field and cell components are
 * implemented and typed correctly.
 *
 * This is a zero-runtime identity function — it returns the adapter unchanged.
 * All enforcement happens at the TypeScript level via the `F` HKT parameter:
 * missing components cause a type error, and each component gets autocomplete
 * for its field-specific props.
 *
 * @param adapter - The framework adapter implementation.
 * @returns The same adapter, verified by TypeScript.
 *
 * @example
 * ```ts
 * import { defineFrameworkAdapter, ComponentHKT } from '@vexcms/core';
 * import { ComponentType } from 'react';
 *
 * interface ReactHKT extends ComponentHKT {
 *   component: ComponentType<this['_props']>;
 * }
 *
 * export const reactAdapter = defineFrameworkAdapter<ReactHKT>({
 *   name: 'react',
 *   version: '0.1.0',
 *   fields: {
 *     text: MyTextInput,  // TS error if missing or wrong props
 *   },
 *   cells: {
 *     text: MyTextCell,
 *   },
 * });
 * ```
 *
 * @see {@link FrameworkAdapterInput} for the full input type
 * @see {@link FrameworkAdapter} for the resolved return type
 */
export function defineFrameworkAdapter<
  F extends ComponentHKT,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(adapter: FrameworkAdapterInput<F, TFieldMeta>): FrameworkAdapter<F, TFieldMeta> {
  return adapter;
}
