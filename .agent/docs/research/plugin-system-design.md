# Plugin system, admin extension points, and Convex-component plugins

> Research, 2026-10-21, at `0.1.0-alpha.26`. Prior work this builds on:
> `custom-field-components-hkt-design.md` (2026-04-04, deferred custom input/cell components
> via HKT), `db-adapter-feasibility.md` (data-adapter seam), ADR-013 (client/server config
> split).

## Question

Is there an industry-standard design for a CMS plugin system that lets third parties (including
Convex component authors) add collections, hooks, admin UI, and pages, depend on each other,
and coexist without conflicts? What does VexCMS need to consider before building one and
stacking every later feature on it?

## Answer

**There is no single agreed standard, but the mature systems converge on the same five
mechanisms.** Build a hybrid of them rather than copying any one product:

1. **A plugin is a typed value with a stable, globally unique `id`** (Better Auth `id`,
   Backstage extension IDs, Fastify `name`), produced by a factory (`definePlugin`).
2. **Config contributions are resolved at build time** — either a config transform
   (Payload: `(config) => config`, applied in array order) or a typed partial that the host
   merges (Sanity `definePlugin`). Transforms are maximally flexible but give no attribution
   and no conflict detection; partial-merge gives both. Prefer partial-merge with an escape
   hatch transform.
3. **Runtime behaviour is attached to named hooks with defined composition semantics**
   (Better Auth `hooks.before/after` with matchers; Vite `enforce: "pre" | "post"`;
   WordPress priorities).
4. **UI is contributed to named extension points (slots) with stable IDs, not DOM positions**
   — Payload's `admin.components.{beforeDashboard,afterNavLinks,views,…}`, Strapi's injection
   zones, Backstage's `attachTo: { id, input }`. For *overrides* of an existing component,
   Sanity's middleware chain (`props.renderDefault(props)`) is the only pattern that lets
   several plugins customise the same component without one silently replacing another.
5. **Dependencies are declared and validated at startup** — Fastify-plugin `dependencies` +
   `decorators` + host-version range; Backstage errors on duplicate IDs. Cross-plugin
   communication goes through exported, typed APIs ("services"), never by mutating another
   plugin's config.

**Recommendation for VexCMS:** `definePlugin({ id, requires, client, server })` with
partial-merge config contributions, ordered hook composition, semantic slot IDs with a
`renderDefault` chain for overrides, a typed service registry for inter-plugin APIs, and
**external collections** backed by a data provider for Convex-component data. Ship every
first-party adapter (auth, storage, richtext editor) and every paid tier as plugins — that is
the proof the API is sufficient. Mark the API experimental until two outside plugins exist.

## 1. Industry survey (verified shapes)

| System | Plugin shape | Ordering / conflicts | UI extension | Dependencies |
|---|---|---|---|---|
| **Payload** | `type Plugin = (config: Config) => Config \| Promise<Config>` (`packages/payload/src/config/types.ts:139`); applied sequentially (`config/build.ts:13-15`) | Array order; last write wins; no attribution | Fixed named slots under `admin.components` — `actions`, `beforeDashboard`, `afterNavLinks`, `beforeLogin`, `header`, `providers`, `settingsMenu`, `views` (`config/types.ts:783-857`); components referenced by **path strings** resolved through a generated `importMap` (`:874-895`) because the config lives server-side under RSC | None declared |
| **Better Auth** | Object: `id`, `init`, `endpoints`, `middlewares`, `onRequest`, `onResponse`, `hooks.before/after`, `schema`, `migrations`, `options`, `$Infer`, `rateLimit`, plus a separate **client plugin** (`@better-auth/core/dist/types/plugin.d.mts`) | Hooks matched per request; schemas merged | Client plugin adds typed client methods | None declared; types merge via `$Infer` |
| **Sanity v3** | `definePlugin` returns a partial studio config; plugins can include plugins | Config arrays merged; document actions/badges are **resolver functions** receiving the previous list | Form/studio components compose as middleware: each calls `props.renderDefault(props)`; "if any component in the chain fails to invoke the callback, the chain breaks" ([docs](https://www.sanity.io/docs/studio/form-components)) | Via npm |
| **Strapi 5** | Server `register` / `bootstrap` / `destroy`; admin `register` / `bootstrap` | Lifecycle order | **Injection zones** — predefined areas; plugins can define their own zones ([docs](https://docs.strapi.io/cms/plugins-development/admin-injection-zones)) | Via npm |
| **Backstage (new frontend)** | Extensions with IDs, `attachTo: { id, input }`, typed inputs | "For each frontend app instance there can only be a single extension for any given ID"; apps can override or disable by ID ([docs](https://backstage.io/docs/frontend-system/architecture/extensions)) | The whole UI is an extension tree | Plugins reference parent extension inputs |
| **Fastify** | `fp(fn, { name, fastify: "5.x", dependencies, decorators })` | Encapsulation contexts; named decorators error on collision | — | Declared and validated against the dependency graph ([fastify-plugin](https://github.com/fastify/fastify-plugin#dependencies)) |
| **Vite / Rollup** | Object with `name` + named hooks | `enforce: "pre" \| "post"`, then array order | — | None |

## 2. What VexCMS already has to build on

- **Adapters** — `VexAuthAdapter` (`core/src/auth/types.ts`), `VexStorageAdapter`
  (`core/src/media/types.ts`), `VexEditorAdapter` (`core/src/editor/types.ts`). These are
  single-purpose plugins already; they become the first dogfood targets.
- **Client/server config split** (ADR-013): `vex.config.ts` (client-safe) +
  `vex.config.server.ts`. A plugin therefore needs **two halves** with separate entry points
  (`@acme/vex-plugin/client`, `/server`), exactly as `@vexcms/better-auth/client` already
  does. This sidesteps Payload's import-map/path-string machinery.
- **HKT component typing** (`ComponentHKT` / `ApplyComponent`, used by relationship preview and
  the richtext editor adapter) — the typing path for plugin-supplied components.
- **RBAC extension points** — `customResources` / `customActions` in `defineAccess`
  (`core/src/access/config.ts`); plugin pages and actions can register as resources so the
  permission matrix covers them.
- **Codegen** — collections flow through `vex.schema.ts` and `vex.types.ts`; plugin
  collections get schema and types for free *if* plugin config is resolvable at codegen time.
- **Exported test kit** (`@vexcms/react/testing`) — the pattern for a plugin conformance kit.

## 3. Things to decide before building (and that later features will inherit)

### API surface and stability
1. **The plugin API is the most expensive public contract you will ever ship.** Every
   internal refactor that touches an exposed hook or slot becomes a breaking change for
   third parties. Version it separately (`apiVersion` / `requires.vex` semver range),
   check compatibility at config resolution, and ship it as `experimental` until at least two
   outside plugins exist.
2. **Slots must be semantic, not positional.** IDs like `edit.header.actions`,
   `edit.sidebar`, `list.toolbar`, `list.row.actions`, `field.<type>.input`,
   `dashboard.widgets`, `nav.items`, `routes` survive a redesign; "after the Save button" does
   not. Launch specs G/H/I (field inputs, edit view, list view) have **not started** — design
   the slot inventory first and let those specs build them in, instead of retrofitting.
3. **Two UI contribution kinds:** *additive* (lists: actions, widgets, nav items, routes —
   order by declared `order`/`before`/`after`, then plugin order) and *override* (replace a
   field input, the dashboard, the nav — a `renderDefault` chain so overrides compose).

### Config and codegen
4. **Plugin config must be deterministic and side-effect-free** — `vex dev` loads it to
   generate schema and types. No network, no env-dependent collections.
5. **Namespacing.** Plugin collection slugs, table names, global slugs, route segments, and
   hook names collide. Require a plugin-scoped prefix (or error with attribution), keep `vex_`
   reserved for core, and report conflicts as `VexPluginConflictError: "foo" defines
   collection "events", already defined by "bar"`.
6. **Contribution kinds to support** (each an explicit, typed key, not free-form mutation):
   collections, fields (extra fields injected into *existing* collections — the most
   conflict-prone), field types, globals, hooks, validators, access resources/actions, admin
   views/routes, slots, nav items, settings pages, server functions, CLI hooks (licence check,
   codegen extensions), seed/`onInit` contributions, and the escape-hatch transform.
7. **Field types from plugins** collide with the dual schema/type generators (`backlog.md` §
   "Type generation and schema generation are separate code paths"). Unify those two walks
   before opening field-type registration, or every plugin field type is implemented twice.

### Runtime semantics
8. **Hook composition rules must be written down:** `beforeChange` chains (each receives the
   previous output) in a deterministic order; `validate` runs all and aggregates; `after*`
   run all — decide whether one plugin's throw aborts the write (Convex mutation semantics
   say yes, the whole transaction rolls back). Plugins compound mutation cost and Convex
   per-transaction limits — budget and document it.
9. **Inter-plugin APIs** — a typed service registry (`ctx.plugins.get("workflow")`) or plain
   exported functions with declared `requires`. Optional dependencies ("enhance if present")
   must be first-class, or plugin authors will probe config shapes.
10. **Duplicate packages.** Plugins must take `@vexcms/*`, `react`, and `convex` as **peer**
    dependencies. Two copies of `@vexcms/react` mean two React contexts and silently broken
    admin state; avoid `instanceof` checks across package boundaries (use `Symbol.for` keys).

### Convex components
11. **Component data is isolated.** "Code inside a component can't read data that is not
    explicitly provided to it … the component's data cannot be directly mutated by the main
    app" ([Convex docs](https://docs.convex.dev/components/understanding)). The Vex server API
    works on `ctx.db` in the app, so it **cannot list or edit a component's tables**. A
    component plugin needs **external collections**: a collection backed by a data provider
    (`list` / `get` / `create` / `update` / `delete` implemented by calling the component's API).
    This is the same seam as `db-adapter-feasibility.md`'s data adapter — design it once.
    Consequences: relationships into component data are string IDs, not `v.id`; RBAC and
    hooks must run in the provider wrapper; reactivity still works through component queries.
12. **Installation touches `convex/convex.config.ts`** (`app.use(component)`). Either the
    CLI learns to manage it (codemod) or plugins document a manual step; decide which,
    because `vex dev` already rewrites `convex/schema.ts` imports.
13. **Distribution:** component authors would ship `@acme/component` plus
    `@acme/component/vex` (the plugin) in the same package — keep `@vexcms/*` an optional peer
    so non-Vex users of the component pay nothing.

### Security, performance, ecosystem
14. **Plugins run with full `ctx.db`** inside the customer's functions; they can bypass RBAC.
    Every plugin data path and admin page must go through `hasPermission`; plugin pages register
    as access resources. There is no sandbox — trust is the npm supply chain; say so in docs.
15. **Admin bundle size** — lazy-load plugin UI per slot/route; a plugin's dashboard widget
    must not ship in every edit view.
16. **Admin primitives become public API.** Exporting `AppForm`, field inputs, data table,
    dialogs, and theme tokens (`maprios-roadmap-gaps.md` notes `AppForm`/`createFieldInput`
    are built but not exported) freezes their props. Export a curated `@vexcms/react/ui`
    surface with semantic tokens only.
17. **Plugin kit:** `create-vexcms --plugin` template, `createVexTestApp({ plugins })` on top
    of `convex-test` + the React test kit, a conformance suite, naming convention
    (`vex-plugin-*` / `@scope/vex-plugin-*`, npm keyword), and a docs directory page.
18. **Uninstall and upgrade.** Removing a plugin leaves its tables and data; upgrading one can
    change its schema. Plugins need owned migrations and a documented removal path.
19. **Licensing.** The plugin API is core (Apache-2.0). Paid tiers become plugins checked by a
    build-time licence hook (`post-v0.1.0-plan.md` decision 11). Third-party paid plugins are
    possible — a later marketplace question.

## 4. Illustrative shape (not an API decision)

```ts
// @acme/vex-plugin-workflow/server
export const workflowPlugin = definePlugin({
  id: "convex-workflow",
  requires: { vex: "^0.2.0", plugins: { optional: ["audit-log"] } },
  server: {
    collections: [externalCollection({ slug: "workflowRuns", provider: workflowRunsProvider })],
    hooks: { afterChange: [{ collection: "*", handler: emitWorkflowEvent }] },
    access: { resources: { workflowRuns: ["read", "cancel"] } },
  },
  client: {
    routes: [{ path: "workflows", component: WorkflowsPage }],
    slots: { "edit.header.actions": [{ id: "start-workflow", component: StartButton }] },
  },
})
```

## 5. Suggested build order

1. **ADR: extension model** — contribution kinds, merge/override rules, slot inventory,
   hook composition, versioning, peer-dep rules.
2. **Slots inside G/H/I** — the edit/list/field overhauls build the extension points
   instead of being retrofitted. Folds in `post-v0.1.0-plan.md` MW-4 (per-field component
   slot) and AD-7 (custom actions/views).
3. **`definePlugin` + dogfood** — port `@vexcms/better-auth`, `@vexcms/file-storage-convex`,
   and `@vexcms/richtext-plate` to plugins; nothing first-party keeps a private path.
4. **External collections + Convex component plugins** — reference plugin for
   `@convex-dev/workflow` (a Convex-team component; a natural partnership showcase).
5. **Plugin kit and docs** — template, test harness, conformance suite, directory.
6. **Paid tiers as plugins** (Pro → Agency → Enterprise).

## Sources

- Payload: `/Users/zaye/Documents/Projects/payload.git/dev/packages/payload/src/config/types.ts:139, 783-895`; `config/build.ts:12-16`.
- Better Auth: `node_modules/.pnpm/@better-auth+core@1.6.23_*/node_modules/@better-auth/core/dist/types/plugin.d.mts` (`BetterAuthPlugin`).
- Sanity form components: https://www.sanity.io/docs/studio/form-components
- Strapi injection zones: https://docs.strapi.io/cms/plugins-development/admin-injection-zones
- Backstage extensions: https://backstage.io/docs/frontend-system/architecture/extensions
- fastify-plugin: https://github.com/fastify/fastify-plugin#dependencies
- Convex component isolation: https://docs.convex.dev/components/understanding
- Repo: `packages/core/src/config/types.ts` (client config), ADR-013, `custom-field-components-hkt-design.md`, `db-adapter-feasibility.md`, `legacy-planning/roadmap-monetization-strategy-v2.md` § "Convex Component Packaging".

## Open questions

- Partial-merge only, or also the Payload-style transform escape hatch from day one?
- Does the CLI own `convex/convex.config.ts` edits for component plugins?
- Field types from plugins before or after unifying the schema/type generators?
- Which slot IDs ship in v0.1.0's G/H/I versus after?
- Is the plugin API frozen at 0.2.0, or experimental through 0.x?
