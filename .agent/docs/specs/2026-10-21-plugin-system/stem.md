# 2026-10-21-plugin-system — Spec stem

> **Not a spec yet.** Input for a future `dev-spec` interview: the goal, what is already
> decided, what pre-0.1.0 specs build toward it, and every question the spec must answer.
> Evidence and industry survey: `.agent/docs/research/plugin-system-design.md`.
> Plan entry: `.agent/docs/product/post-v0.1.0-plan.md` Track PL.
> **Prerequisite checklist:** `.agent/docs/specs/2026-10-21-adapter-readiness/stem.md`. It covers
> field storage kinds (Q19), `vex` in hook props (Q13), a serializable `where` (list filters),
> and the data seam shared with Convex-component collections (Q16), so plugins never build on
> Convex-only surfaces.

## Goal

Let other developers — app teams, agencies, and **Convex component authors** — extend VexCMS
without forking it: add or change collections, fields, globals, hooks, access resources, admin
pages and UI, and server functions; depend on each other's plugins; and install many plugins
side by side without conflicts unless they opt into interacting. Make VexCMS the default way to
give any Convex component an admin surface (e.g. a `@convex-dev/workflow` plugin).

## Decided so far

- **Plugins come first after 0.1.0** (Track PL), ahead of maprios www, brownfield adoption, and
  the paid tiers (2026-10-21).
- **Admin extension points (slots) are built into launch specs G, H, I** rather than retrofitted
  — see "Pre-0.1.0 groundwork" below.
- **Every first-party extension becomes a plugin** — `@vexcms/better-auth`,
  `@vexcms/file-storage-convex`, `@vexcms/richtext-plate`, and the Pro / Agency / Enterprise
  packages. Nothing first-party keeps a private integration path.
- **Plugin API is core (Apache-2.0).** Paid tiers attach as plugins checked by the build-time
  licence hook (`post-v0.1.0-plan.md` decision 11).
- Absorbs `post-v0.1.0-plan.md` **MW-4** (per-field component slot) and **AD-7** (custom
  actions / views / filters).

## Pre-0.1.0 groundwork (lands in G / H / I)

### Decisions (2026-10-21)

| # | Decision | Why | Rejected |
|---|---|---|---|
| S1 | **Slots are configurable at three levels before plugins exist:** root `admin.components`, per-collection / per-global `admin.components`, per-field `admin.components` — all in the client config. Plugins later merge into the same keys | Useful from 0.1.0, and plugins become "config contributions" rather than a second mechanism | Plugins-only — slots would be dead code until PL |
| S2 | **Nested config keys map 1:1 to flat slot IDs.** Authors write `admin.components.edit.header.actions`; internally it is `"edit.header.actions"`, exported as a typed constant map that plugins, docs and errors use | Autocomplete for authors; one stable identifier for plugins and conflict messages | Flat-ID map as the only authoring shape |
| S3 | **Overrides compose with a `renderDefault` chain** (Sanity model): each override receives `renderDefault(props)` and wraps it, changes props, or replaces it by not calling it; applied in contribution order | The only pattern where two contributors can both customise one component | Last-one-wins replacement (Payload) — silent conflicts |
| S4 | **Built-in UI is registered as default contributions with IDs** in the same slot lists — Save, Publish, Unpublish, Delete, Duplicate, row / bulk delete, block actions, nav items | Users and plugins can add, reorder, hide or wrap built-ins by ID; proves there are no private paths | Fixed built-ins with before/after slots — reordering/hiding needs a later refactor |
| S5 | **Slot components get minimal typed props plus public context hooks** — `useVexDocument`, `useVexCollection` (or a resource-neutral equivalent for globals), `useVexForm`, `useVexPermissions`, alongside `useVexConfig` | Props stay stable as features add data; growth happens in hooks | Rich per-slot props — every new feature changes every slot's signature |
| S6 | **Field customisation in G covers per-field and per-type overrides through one registry.** Per-field `admin.components.{Input, Cell, Label, Description, beforeInput, afterInput}`; project-wide per-type `admin.components.fields.<type>.{Input, Cell}`; `RenderFields` resolves every field through a single registry (today `fieldInputComponents` / `fieldCellComponents` duplicate `reactAdapter.fields`) | Covers MW-4 (`ui`-style and icon-picker fields) and removes the duplicated registries | Per-field `Input` / `Cell` only (the 2026-04 HKT design) |
| S7 | **Components are referenced directly** in the client config (`component: MyButton`, `React.lazy(() => import(…))` allowed) | ADR-013 already ships the client config to the browser; type-checked props, refactor-safe, no codegen | Path strings + generated import map (Payload v3 needs it only because its config lives on the server) |
| S8 | **Additive contributions are ordered by `order` plus `before` / `after` IDs.** Shape: `{ id, component, order?, before?, after?, hidden?, access?, condition? }` | Built-ins are contributions (S4), so a plugin must be able to anchor "right after `vex.publish`" without knowing other plugins' numbers | `order` only (priority collisions); config array order only |
| S9 | **Duplicate IDs in one additive slot are a config-resolution error naming both sources.** Replacing a built-in = `hidden: true` on its ID plus a new contribution, or wrapping it via an override (S3) | Conflicts are loud and attributable (Backstage model) | Later-replaces-earlier — two plugins replacing one built-in silently fight |
| S10 | **Every contribution renders inside its own error boundary**, with an inline error naming its ID | Third-party code must not take down an editor mid-edit | Per-slot boundary (one bad contribution hides the whole slot); none |
| S11 | **Contributions declare `access` and `condition` predicates; the renderer gates before mounting.** `access` reuses RBAC (`hasPermission`, access resources); `condition` reuses G's `admin.condition({ data, siblingData })` signature | One rule for built-ins and third parties; authors cannot forget permission checks | Each component checks and returns `null` |
| S12 | **Slot IDs and prop types are declared in `@vexcms/core`**, typed through `ComponentHKT` / `ApplyComponent`; `@vexcms/react` renders them and implements the S5 hooks | Config is authored against core types; a future non-React admin reuses the contracts | React-package-only types |
| S13 | **Slots and hooks are documented as experimental** (docs + TypeDoc `@experimental`) until Track PL ships `definePlugin`; no `unstable_` prefixes or experimental subpath | Avoids a mass rename when stabilising, which is itself a breaking change | `unstable_` prefixes; `@vexcms/react/experimental` subpath |
| S14 | **Slots are client-only in 0.1.0; server-component contributions are deferred to Track PL.** Feasible later: `NextAdminPage` is already an async server component holding the server config, so `@vexcms/next` can render contributions declared in `vex.config.server.ts` and pass the output to client views by contribution ID. Limited to page-level slots (edit header / before-fields, list before-table, dashboard, routes); they render per request and cannot react to unsaved edits or live updates. Additive later — a new server-config key | Avoids an untested second render path in H / I; most Convex data needs are met by reactive client queries or actions | Building server slots into H / I now; never supporting them |

### Slot inventory (assigned 2026-10-21 — G spec steps 7–8, 11, 15–18; launch plan H and I)

| Area | Owning spec | Slots (flat IDs) | Built-in contributions |
|---|---|---|---|
| Fields | **G** (after step 6) | `field.input`, `field.cell`, `field.label`, `field.description`, `field.beforeInput`, `field.afterInput`; per-type overrides | every field type's Input / Cell |
| Blocks / arrays | **G** (step 13 area) | `blocks.item.actions`, `blocks.header.actions`, `array.item.actions` | duplicate, insert above/below, move, copy / paste |
| Edit view | **H** | `edit.header.actions`, `edit.header.before`, `edit.header.after`, `edit.beforeFields`, `edit.afterFields`, `edit.sidebar.before`, `edit.sidebar.after` | Save, Publish, Unpublish, Delete, Duplicate, version history, live preview toggle |
| List view | **I** | `list.header.actions`, `list.toolbar`, `list.filters`, `list.beforeTable`, `list.afterTable`, `list.row.actions`, `list.bulkActions` | Create, search, row delete, bulk delete, column / view menus |
| Shell | **Track PL, post-0.1.0** (decided 2026-10-21) | `nav.items`, `nav.before`, `nav.after`, `header.actions`, `dashboard.widgets`, `providers`, `routes` | collection / global nav items, dashboard sections |

**G placement (decided 2026-10-21):** the core slot model and single field registry are
inserted as G steps 7–8, directly after the layout model (step 6) and before `RenderFields`
consumes them; former steps 7–16 renumber to 9–18. Integer step headings are required by the
harness task parser.

Questions 22 and 24 below are partly answered by S5 (public hooks) and S10 (error boundaries);
server-component contributions (S14) are tracked in `backlog.md` § "Custom server components in
admin slots". Known G gap: `field.label` / `field.description` ship as override outlets with no
built-in contribution — every input still renders its own label; extracting them is left to
Track PL.

## Questions the spec must answer

### Shape and lifecycle
1. **Plugin object.** `definePlugin({ id, requires, client, server })` — exact keys; client
   and server halves as separate entry points (ADR-013), like `@vexcms/better-auth/client`.
2. **Contribution style.** Typed partial-merge (Sanity) only, or also a Payload-style
   `(config) => config` escape hatch? Merge gives attribution and conflict errors; transforms
   give unlimited reach.
3. **Contribution kinds** (each an explicit typed key): collections; fields injected into
   *existing* collections; field types; globals; hooks; validators; access resources/actions;
   admin routes/views; slots; nav items; settings pages; server functions; CLI hooks (licence
   check, codegen extensions); `onInit` seed contributions.
4. **Determinism.** Plugin config is loaded by `vex dev` for codegen — must be pure (no network,
   no env-dependent collections). How is that enforced or documented?
5. **Plugins that include plugins** (Sanity allows it) — allowed? How is the flattened order
   defined?

### Stability and versioning
6. **API version.** Separate `apiVersion` / `requires.vex` semver range, checked at config
   resolution. Experimental marker until two outside plugins exist? Frozen at 0.2.0 or
   experimental through 0.x?
7. **Deprecation policy** for hooks and slots once third parties depend on them.

### Conflicts, ordering, dependencies
8. **Namespacing** of collection slugs, table names, global slugs, routes, slot contribution
   IDs, hook names; `vex_` stays core-reserved. Errors must name both plugins.
9. **Ordering** — array order plus `enforce: "pre" | "post"`? Per-contribution `before` /
   `after` IDs?
10. **Dependencies** — required and optional plugin dependencies with version ranges,
    validated at startup (Fastify-plugin model).
11. **Inter-plugin APIs** — typed service registry (`ctx.plugins.get(id)`) vs plain exported
    functions; how optional "enhance if present" integrations are written.
12. **Field injection into another plugin's collection** — allowed? Ordering? Conflict rules?

### Server runtime
13. **Hook composition semantics** — `beforeChange` chains output; `validate` runs all and
    aggregates; `after*` all run; one plugin's throw aborts the transaction (Convex mutation
    semantics). Write it down.
14. **Cost budget** — every plugin hook runs inside every write and spends the same per-
    transaction read/write limits. Document limits; consider per-collection hook targeting.
15. **Access** — plugin data paths and admin pages must go through `hasPermission`; plugin
    pages and actions register as `customResources` / `customActions`. No sandbox: trust is the
    npm supply chain — state it in docs.

### Convex components
16. **External collections.** Component data is isolated from the app ("the component's data
    cannot be directly mutated by the main app" — Convex docs), so the Vex server API cannot
    CRUD it. Design a data-provider interface (`list` / `get` / `create` / `update` / `delete`
    via the component's functions) — the same seam as `research/db-adapter-feasibility.md`;
    design once for both. Relationships into component data become string ids.
17. **`convex/convex.config.ts`** — does the CLI add `app.use(component)` (codemod, like its
    `schema.ts` import sync) or do plugins document a manual step?
18. **Packaging** — `@acme/component` + `@acme/component/vex`, `@vexcms/*` as optional peer so
    non-Vex users of the component pay nothing.

### Codegen and data
19. **Plugin field types** — unify `generateVexTypes` and `generateVexSchema` first
    (`backlog.md`), or every plugin field type is implemented twice?
20. **Generated types** — plugin collections appear in `vex.types.ts`; plugin options typed;
    can a plugin augment another plugin's types?
21. **Upgrade / uninstall** — plugin-owned migrations; what removing a plugin does to its
    tables and data.

### Admin UI
22. **Public admin primitives** — curated `@vexcms/react/ui` surface (`AppForm`,
    `createFieldInput`, data table, dialogs, field inputs, theme tokens). Each export freezes
    its props.
23. **Bundle size** — lazy-load plugin UI per slot and per route.
24. **Error isolation** — one plugin's component must not take down a view.

### Packages and ecosystem
25. **Peer dependencies** — plugins take `@vexcms/*`, `react`, `convex` as peers; no
    cross-package `instanceof`; `Symbol.for` keys for shared registries.
26. **Plugin kit** — `create-vexcms --plugin` template; `createVexTestApp({ plugins })` on
    `convex-test` + `@vexcms/react/testing`; conformance suite; naming convention
    (`vex-plugin-*`, npm keyword); docs directory page.
27. **Reference plugins** — `@convex-dev/workflow` (Convex-team component), plus the three
    first-party ports.
28. **Third-party paid plugins** — allowed by licence? Marketplace later?

## Acceptance (for the eventual spec)

- `better-auth`, `file-storage-convex`, and `richtext-plate` install as plugins with no
  private core paths.
- A `@convex-dev/workflow` plugin lists and acts on workflow runs in the admin through an
  external collection, with RBAC enforced.
- Two independent sample plugins that touch the same slot and the same collection install
  together without conflict; a genuine conflict errors with both plugin IDs named.
- A plugin built against `requires.vex: "^X"` is rejected with a clear error on an
  incompatible core.
