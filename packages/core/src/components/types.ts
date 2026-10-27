import type { FieldCondition } from "../fields/conditions";

/**
 * Higher-kinded type interface for framework-specific component constructors.
 *
 * Frameworks implement this to map a props type to their component type.
 *
 * @example
 * ```ts
 * interface ReactHKT extends ComponentHKT {
 *   component: React.ComponentType<this['_props']>;
 * }
 * ```
 */
export interface ComponentHKT {
  readonly _props: unknown;
  readonly _extra: Record<string, unknown>;
  readonly component: unknown;
}

/**
 * Applies a ComponentHKT to specific props, resolving to the framework's component type.
 */
export type ApplyComponent<
  F extends ComponentHKT,
  P,
  E extends Record<string, unknown> = Record<string, never>,
> = (F & { readonly _props: P; readonly _extra: E })["component"];

/**
 * Flat, dot-joined identifiers for every admin extension point (slot) G declares. Nested
 * `admin.components` keys map 1:1 onto these — `admin.components.beforeInput` on a field is
 * `SLOT_IDS.field.beforeInput` (S2). H and I declare their own `edit.*`/`list.*`/shell entries
 * in their own specs; this map only carries G's.
 *
 * Experimental: Slot ids and the contribution model are documented experimental until Track PL
 * ships `definePlugin` (S13) — no `unstable_` prefix; breaking changes are still possible.
 */
export const SLOT_IDS = {
  field: {
    /** Override chain for a field's input component. One per field instance AND one project-wide per field type — see {@link ComponentOverrideInput} composition in `@vexcms/react`. */
    input: "field.input",
    /** Override chain for a field's WHOLE admin field (decision 5) — see
     * `FieldSlotComponentsInput.Field`'s doc comment for composition. */
    field: "field.field",
    /** Override chain for a field's data-table cell component. Same two-level composition as `input`. */
    cell: "field.cell",
    /** Override chain for a field's label. No built-in contribution yet (step 11's design note) — every Input still renders its own label inline. */
    label: "field.label",
    /** Override chain for a field's description. No built-in contribution yet, same reason as `label`. */
    description: "field.description",
    /** Additive contributions rendered before a field's resolved input. */
    beforeInput: "field.beforeInput",
    /** Additive contributions rendered after a field's resolved input. */
    afterInput: "field.afterInput",
  },
  blocks: {
    /** Additive contributions rendered in a block item's actions menu. Built-ins: step 15 (duplicate/insert/move/remove), step 16 (copy/paste). */
    itemActions: "blocks.item.actions",
    /** Additive contributions rendered in a `blocks()` field's header toolbar. Built-ins: step 16 (copy all/paste/replace all). */
    headerActions: "blocks.header.actions",
  },
  array: {
    /** Additive contributions rendered per array item's action row. Built-ins: step 15 (duplicate/move/remove). */
    itemActions: "array.item.actions",
  },
  edit: {
    /** Additive contributions in an edit view's header action bar. Built-ins: save, publish, unpublish, delete, version history, live preview, cancel (decisions 11/13; `duplicate` moved to `actionsMenu` per the Step 4 post-implementation note). */
    headerActions: "edit.header.actions",
    /** Additive contributions rendered before an edit view's header. No built-ins. */
    headerBefore: "edit.header.before",
    /** Additive contributions rendered after an edit view's header. No built-ins. */
    headerAfter: "edit.header.after",
    /** Additive contributions rendered before an edit view's field list. No built-ins. */
    beforeFields: "edit.beforeFields",
    /** Additive contributions rendered after an edit view's field list. No built-ins. */
    afterFields: "edit.afterFields",
    /** Additive contributions rendered before an edit view's sidebar content. No built-ins. */
    sidebarBefore: "edit.sidebar.before",
    /** Additive contributions rendered after an edit view's sidebar content. No built-ins. */
    sidebarAfter: "edit.sidebar.after",
    /** Additive contributions in an edit view's ⋯ actions menu, rendered in a dropdown left of the header action group. Built-ins: revalidate, duplicate. */
    actionsMenu: "edit.actionsMenu",
  },
} as const;

/** Union of every flat slot id {@link SLOT_IDS} declares. */
export type SlotId =
  | (typeof SLOT_IDS.field)[keyof typeof SLOT_IDS.field]
  | (typeof SLOT_IDS.blocks)[keyof typeof SLOT_IDS.blocks]
  | (typeof SLOT_IDS.array)[keyof typeof SLOT_IDS.array]
  | (typeof SLOT_IDS.edit)[keyof typeof SLOT_IDS.edit];

/**
 * Context passed to a contribution's `access` predicate — a thin RBAC checker bound to the
 * current user by the renderer (`@vexcms/react`'s `useVexPermissions`, S5), so core's own types
 * stay framework- and auth-adapter-agnostic. `resource`/`action` mirror `hasPermission`'s own
 * vocabulary (`access/hasPermission.ts`) without importing its generated-type machinery here.
 */
export interface SlotAccessContext {
  /** `true` when the current user may perform `action` on `resource` (collection/global slug, or a `customResources` key). */
  hasPermission: (resource: string, action: string) => boolean;
  /**
   * Which collection/global document this render is for — populated only for `edit.*` slots
   * (`edit.header.*`/`edit.actionsMenu`, whose contributions already receive this same shape as
   * {@link EditSlotProps}), `undefined` for field-level slots (`beforeInput`/`afterInput`,
   * `blocks.*.actions`, `array.item.actions`), which have no single resource kind to report.
   * Lets a contribution that only makes sense for one kind (e.g. a collection document's own id,
   * meaningless for a global singleton) declare that declaratively instead of rendering `null`
   * at mount time — the latter leaves its id in the resolved list, which defeats
   * `DocumentEditActionsMenu`'s "no contribution survived filtering → no empty ⋯ trigger" check.
   */
  resource?: EditSlotProps;
}

/** A pure predicate deciding whether a contribution mounts at all (S11). */
export type SlotAccessPredicate = (ctx: SlotAccessContext) => boolean;

/**
 * One additive entry in a slot list (`beforeInput`/`afterInput`, `blocks.item.actions`,
 * `blocks.header.actions`, `array.item.actions`) — either a real contribution, or a directive
 * hiding a built-in by id (S4/S9).
 *
 * @typeParam TComponent - The framework's `ComponentHKT`. Type-erased to the base `ComponentHKT`
 *   wherever a slot is declared outside a framework-typed context (root `admin.components`,
 *   exactly like `editor?: VexEditorAdapter<ComponentHKT>` on `VexClientConfigInput`).
 * @typeParam TProps - The props the slot's resolved component receives.
 */
export type ComponentContributionInput<
  TComponent extends ComponentHKT,
  TProps,
> =
  | {
      /** Stable identifier (S2/S9) — `vex.`-prefixed for built-ins, otherwise project/plugin-chosen. Duplicate ids within one resolved list are a {@link VexComponentConfigError}. */
      id: string;
      /** The contribution's component, referenced directly (S7) — `React.lazy(() => import(...))` is a valid value for a React `ComponentHKT`. */
      component: ApplyComponent<TComponent, TProps>;
      /** Sort key; ties broken by array position. Default `0`. */
      order?: number;
      /** Id(s) this contribution must render before. */
      before?: string | string[];
      /** Id(s) this contribution must render after. */
      after?: string | string[];
      /** Omit this contribution from the resolved list without removing the entry (keeps `order`/`before`/`after` documented in place). */
      hidden?: boolean;
      /** Gates mounting — reuses RBAC (S11). Checked before `condition`. */
      access?: SlotAccessPredicate;
      /** Gates mounting — same `(data, siblingData)` signature as `admin.condition` (Step 6, S11). Checked after `access`. */
      condition?: FieldCondition;
    }
  | {
      /** The id of an EXISTING contribution (usually a built-in) in this same resolved list to hide. */
      id: string;
      /** Always `true` — a hide directive carries no component. */
      hidden: true;
      component?: never;
    };

/** One contribution after {@link resolveComponentContributions} has ordered and filtered a slot's list. Hide directives never appear here — they are consumed during resolution. */
export type ResolvedComponentContribution<
  TComponent extends ComponentHKT,
  TProps,
> = Extract<
  ComponentContributionInput<TComponent, TProps>,
  { component: ApplyComponent<TComponent, TProps> }
>;

/**
 * One entry in an override chain (`field.input`, `field.cell`, `field.label`,
 * `field.description`, and the root per-type `fields.<type>.{Input,Cell}` lists) — the Sanity
 * `renderDefault` model (S3). Order in the array IS the composition order; there is no
 * `before`/`after` for overrides (S8).
 *
 * @typeParam TComponent - The framework's `ComponentHKT`.
 * @typeParam TProps - The props the slot's resolved component receives — the override's OWN
 *   component receives `TProps & { renderDefault: ApplyComponent<TComponent, TProps> }`, composed
 *   by the renderer (`@vexcms/react`'s `resolveFieldInputComponent`/`resolveFieldCellComponent`);
 *   core only declares the minimal `{ id, component }` shape (S8).
 */
export interface ComponentOverrideInput<
  TComponent extends ComponentHKT,
  TProps,
> {
  /** Stable identifier (S2/S9). Duplicate ids within one resolved chain are a {@link VexComponentConfigError}. */
  id: string;
  /** Receives `renderDefault` — the PREVIOUS stage of the chain (the true built-in for the first entry). Calling it renders the default; not calling it replaces it entirely. */
  component: ApplyComponent<
    TComponent,
    TProps & { renderDefault: ApplyComponent<TComponent, TProps> }
  >;
}

/** An override chain after {@link resolveComponentOverrides} has de-duplicated it — array order unchanged, `before`/`after` do not apply to overrides. */
export type ResolvedComponentOverride<
  TComponent extends ComponentHKT,
  TProps,
> = ComponentOverrideInput<TComponent, TProps>;

/**
 * Props every `edit.*` slot's resolved component receives (decisions 11/12) — which
 * collection or global the mounted edit view is showing.
 */
export interface EditSlotProps {
  /** Whether the edit view belongs to a collection document or a global's singleton document. */
  kind: "collection" | "global";
  /** Collection or global slug. */
  slug: string;
}

/**
 * One `edit.*` slot's raw, unresolved configuration at ONE level (root or collection/global) —
 * the additive contribution list plus the built-in-wrapping override map (decision 15). This is
 * {@link resolveEditSlot}'s `root`/`resource` param shape; `@vexcms/core`'s `defineConfig`,
 * `defineCollection` and `defineGlobal` pass their stored config through UNRESOLVED (decision
 * 14's root→resource merge happens per flat slot id, in `resolveEditSlot`, since built-in
 * contributions are framework- and `kind`-specific and core has neither).
 *
 * @typeParam TComponent - The framework's `ComponentHKT`.
 */
export interface EditSlotConfigInput<TComponent extends ComponentHKT = ComponentHKT> {
  /** This level's additive contributions for the slot. */
  contributions?: ComponentContributionInput<TComponent, EditSlotProps>[];
  /** This level's override chains, keyed by the built-in id each chain wraps (decision 15/16). */
  overrides?: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
}

/**
 * The `edit.*` slot config one collection, one global, or the project root declares — grouped
 * by UI region to match {@link SLOT_IDS.edit} (decision 11). `header.overrides` wraps a built-in
 * from `header.actions` by id (decision 15); `beforeFields`/`afterFields`/`sidebar.*` carry no
 * built-ins, so they have no override map. `actionsMenu.overrides` wraps a built-in from
 * `actionsMenu.items` (`vex.revalidate`/`vex.duplicate`) the same way. A renderer calls
 * {@link resolveEditSlot} once PER FLAT slot id, passing the matching array (plus
 * `header.overrides` only for `SLOT_IDS.edit.headerActions`, `actionsMenu.overrides` only for
 * `SLOT_IDS.edit.actionsMenu`) as `root`/`resource`.
 *
 * @typeParam TComponent - The framework's `ComponentHKT`.
 */
export interface EditComponentsConfigInput<TComponent extends ComponentHKT = ComponentHKT> {
  header?: {
    actions?: ComponentContributionInput<TComponent, EditSlotProps>[];
    before?: ComponentContributionInput<TComponent, EditSlotProps>[];
    after?: ComponentContributionInput<TComponent, EditSlotProps>[];
    overrides?: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
  };
  beforeFields?: ComponentContributionInput<TComponent, EditSlotProps>[];
  afterFields?: ComponentContributionInput<TComponent, EditSlotProps>[];
  sidebar?: {
    before?: ComponentContributionInput<TComponent, EditSlotProps>[];
    after?: ComponentContributionInput<TComponent, EditSlotProps>[];
  };
  /** The edit view's ⋯ actions menu (decision: Step 4 post-implementation note) — built-ins `vex.revalidate`/`vex.duplicate`. */
  actionsMenu?: {
    items?: ComponentContributionInput<TComponent, EditSlotProps>[];
    overrides?: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
  };
}

/**
 * Root-level `edit.*` slot config after `defineConfig()` applies defaults — every array and the
 * override map always present. Collection/global-level config ({@link EditComponentsConfigInput})
 * is NOT defaulted this way; `resolveEditSlot` owns those defaults at render time, mirroring how
 * `AdminCollectionConfig.livePreview` is passed through unresolved.
 *
 * @typeParam TComponent - The framework's `ComponentHKT`.
 */
export interface EditComponentsConfig<TComponent extends ComponentHKT = ComponentHKT> {
  header: {
    actions: ComponentContributionInput<TComponent, EditSlotProps>[];
    before: ComponentContributionInput<TComponent, EditSlotProps>[];
    after: ComponentContributionInput<TComponent, EditSlotProps>[];
    overrides: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
  };
  beforeFields: ComponentContributionInput<TComponent, EditSlotProps>[];
  afterFields: ComponentContributionInput<TComponent, EditSlotProps>[];
  sidebar: {
    before: ComponentContributionInput<TComponent, EditSlotProps>[];
    after: ComponentContributionInput<TComponent, EditSlotProps>[];
  };
  actionsMenu: {
    items: ComponentContributionInput<TComponent, EditSlotProps>[];
    overrides: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
  };
}

/**
 * Thrown when a slot's config cannot be resolved — a genuine duplicate id (two real
 * contributions, not a hide directive, sharing one id) in one list. Does not yet name a
 * contributing PLUGIN (no `definePlugin` before Track PL) — only the id and both entries'
 * positions in the merged list, which is everything available pre-plugin-system.
 */
export class VexComponentConfigError extends Error {
  /** @param message — Human-readable description of the configuration error. */
  constructor(message: string) {
    super(message);
    this.name = "VexComponentConfigError";
  }
}


