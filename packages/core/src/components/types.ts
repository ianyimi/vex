import type { ApplyComponent, ComponentHKT } from "../fields/baseTypes";
import type { FieldCondition } from "../fields/ui/types";

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
} as const;

/** Union of every flat slot id {@link SLOT_IDS} declares. */
export type SlotId =
  | (typeof SLOT_IDS.field)[keyof typeof SLOT_IDS.field]
  | (typeof SLOT_IDS.blocks)[keyof typeof SLOT_IDS.blocks]
  | (typeof SLOT_IDS.array)[keyof typeof SLOT_IDS.array];

/**
 * Context passed to a contribution's `access` predicate — a thin RBAC checker bound to the
 * current user by the renderer (`@vexcms/react`'s `useVexPermissions`, S5), so core's own types
 * stay framework- and auth-adapter-agnostic. `resource`/`action` mirror `hasPermission`'s own
 * vocabulary (`access/hasPermission.ts`) without importing its generated-type machinery here.
 */
export interface SlotAccessContext {
  /** `true` when the current user may perform `action` on `resource` (collection/global slug, or a `customResources` key). */
  hasPermission: (resource: string, action: string) => boolean;
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

export type { ComponentHKT };
