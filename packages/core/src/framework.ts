import { CollectionConfig } from "./collections";
import { ClientVexConfig } from "./config";
import type {
  AdminField,
  ApplyComponent,
  CellComponentProps,
  ComponentHKT,
  InputComponentProps,
} from "./fields";
import type { TDocument, VexDocument } from "./convex";
import { CollectionSlug } from "./types/generated";
import { PaginationResult } from "./api/types";

/**
 * Maps every field type in the `AdminField` union to the framework's input component type
 * for that field.
 *
 * Keyed by `AdminField['type']` — as new field types are added to the union, TypeScript
 * automatically requires a matching component slot in this map.
 *
 * Each slot resolves to `ApplyComponent<F, InputComponentProps<MatchingFieldDef>>`, which
 * means the component must accept the input props for that specific field type. This gives
 * the component full autocomplete for field-specific properties (e.g. `fieldDef.maxLength`
 * on the text slot).
 *
 * @see {@link CellComponentMap} for the data table cell equivalent
 * @see {@link ComponentHKT} for how framework packages define their HKT
 * @see {@link ApplyComponent} for how the HKT resolves to a concrete component type
 */
export type FieldComponentMap<F extends ComponentHKT> = {
  [K in AdminField["type"]]: {
    input: ApplyComponent<F, InputComponentProps<Extract<AdminField, { type: K }>>>;
    cell: ApplyComponent<F, CellComponentProps<Extract<AdminField, { type: K }>>>;
  };
};

/**
 * Props passed to the admin `Dashboard` view component.
 *
 * The Dashboard receives the full resolved VexCMS config and is responsible
 * for rendering the admin shell — navigation sidebar, header, and a slot for
 * the active view (collection list or edit form).
 *
 * @see {@link ViewComponentMap}
 */
export interface DashboardProps {
  /** The full resolved VexCMS configuration. */
  config: ClientVexConfig;
}

/**
 * Props passed to the `CollectionListView` component.
 *
 * `TCollectionSlug` is inferred from the `collection` prop and narrows the collection type
 * to a specific slug after `vex generate` runs. `TDoc` defaults to `VexDocument`
 * and can be narrowed to a generated document interface when the caller has a
 * typed initial data array.
 *
 * @see {@link ViewComponentMap}
 */
export interface CollectionListViewProps<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TDoc extends VexDocument = VexDocument,
> {
  /** The resolved collection configuration for the collection being listed. */
  collection: CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug>;
  /**
   * Pre-fetched documents from the server. Passed as `initialData` to
   * the TanStack Query so the list renders immediately on first load.
   * Omit when rendering client-side only.
   */
  initialData?: PaginationResult<TDoc>;
}

/**
 * Props passed to the `CollectionEditView` component.
 *
 * `TCollectionSlug` is inferred from the `collection` prop. After `vex generate` runs,
 * passing a collection of the wrong slug is a compile-time error.
 *
 * @see {@link ViewComponentMap}
 */
export interface CollectionEditViewProps<
  TFieldMeta extends {} = {},
  TCollectionMeta extends {} = {},
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
  /** The resolved collection configuration whose fields will be rendered. */
  collection: CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug>;
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
  /** Admin shell component receiving the full VexCMS config. */
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
 *     text: TextInputComponent,  // must accept InputComponentProps<TextField>
 *   },
 *   cells: {
 *     text: TextCellComponent,   // must accept CellComponentProps<TextField>
 *   },
 * });
 * ```
 *
 * @see {@link FrameworkAdapter} for the resolved type returned by `defineFrameworkAdapter`
 * @see {@link FieldComponentMap} for the field component slot types
 * @see {@link CellComponentMap} for the cell component slot types
 */
export interface FrameworkAdapterInput<F extends ComponentHKT> {
  /** Framework name used for identification (e.g. `"react"`, `"solid"`). */
  name: string;
  /** Adapter version — should match the framework package version. */
  version: string;
  /**
   * Input components for each field type, rendered in the document edit form.
   * Every type in the `AdminField` union must have a corresponding component.
   */
  fields: FieldComponentMap<F>;
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
export type FrameworkAdapter<F extends ComponentHKT> = FrameworkAdapterInput<F>;

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
export function defineFrameworkAdapter<F extends ComponentHKT>(
  adapter: FrameworkAdapterInput<F>,
): FrameworkAdapter<F> {
  return adapter;
}
