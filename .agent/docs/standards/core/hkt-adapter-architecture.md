---
applies_to: ["packages/core/src/fields/baseTypes.ts", "packages/react/src/adapter.ts", "packages/react/src/index.ts", "packages/next/src/index.ts"]
---
# HKT Adapter Architecture

Core stays framework-agnostic (no react imports, no JSX) via Higher-Kinded Type slots.

- `interface ComponentHKT { readonly _props: unknown; readonly component: unknown }`
  (`packages/core/src/fields/baseTypes.ts:30-35`).
- `ApplyComponent<F, P> = (F & { readonly _props: P })["component"]` resolves the HKT for
  concrete props. Any user-supplied component slot in core config is typed
  `slot?: ApplyComponent<F, SlotProps>` with `F extends ComponentHKT = ComponentHKT` as a
  generic on the interface — in pure-core context the slot resolves to `unknown`
  (`packages/core/src/fields/relationship/types.ts:52-59`).
- `ReactHKT extends ComponentHKT { component: ComponentType<this["_props"]> }`
  (`packages/react/src/adapter.ts:32-36`) — binding it makes slots `ComponentType<P>`.
- **Re-export rule:** EVERY core config function is re-exported from
  `packages/react/src/index.ts` with `F = ReactHKT` bound (wrapped when it has component
  slots, pass-through otherwise: `packages/react/src/index.ts:56-77`), and transitively
  from `packages/next/src/index.ts`. Users import config functions from `@vexcms/next`
  (Next apps) or `@vexcms/react` — NEVER from `@vexcms/core` directly.
- `packages/react/src/adapter.ts:51-60` maps every ADMIN_FIELDS type to `{ input, cell }`;
  TypeScript enforces that a new field type registers both components.
- Adapter component naming: framework prefix (`NextAdminPage`), never `Vex*` — the `Vex`
  prefix is reserved for framework-agnostic APIs.
