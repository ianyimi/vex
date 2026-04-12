# Developer Preferences

> Patterns extracted from sync-spec runs. Each entry represents a deviation from
> AI-generated spec code that the developer consistently prefers. These are encoded
> in `.claude/commands/dev-spec.md` — this file is the audit trail.

## Next.js Adapter Naming

- **Components are named `Next*` not `Vex*`**: Framework adapter components exported
  from `@vexcms/next` use the `Next` prefix (e.g. `NextAdminPage`, `NextAdminLayout`),
  not the `Vex` prefix. The `Vex` prefix is for framework-agnostic APIs in `@vexcms/core`
  or `@vexcms/react`. *(Encoded: sync-spec 01, 2026-04-07)*

## Convex Functions

- **Mutation payload arg is named `data`, not `fields`**: `create` and `update` Convex
  mutations use `data: v.any()` as the payload arg name. `fields` is confusing because
  "fields" in VexCMS refers to field definitions in the collection config, not the data
  being written to the database. Use `data` everywhere for the mutation payload.
  *(Encoded: sync-spec 01, 2026-04-07)*

- **Convex mutation payload uses `v.any()`**: Generic collection mutations accept
  `data: v.any()` rather than a typed record (`v.record(v.string(), v.any())` or
  `fields: Record<string, unknown>`). Flexibility is preferred at this stage; the CLI
  will enforce schema correctness at codegen time. *(Encoded: sync-spec 01, 2026-04-07)*

## File Organization

- **Context + hook collocated in `hooks/` as a single file**: When a React context has
  a companion hook (e.g., `FrameworkComponentsContext` + `useFrameworkComponents`), put
  both in the `hooks/` directory as one file (`hooks/useFrameworkComponents.ts`), not in
  `components/` and not as two separate files. *(Encoded: sync-spec 01, 2026-04-07)*

## Next.js Route Params

- **Catch-all slug param is `[[...slug]]`**: The optional catch-all segment for the admin
  route is named `slug`, not the feature name. So the directory is `[[...slug]]/page.tsx`,
  not `[[...vex]]/page.tsx` or `[[...admin]]/page.tsx`.
  *(Encoded: sync-spec 01, 2026-04-07)*

## Tailwind CSS in Monorepo

- **`@source` points to workspace package source, not dist**: In a pnpm monorepo, Tailwind
  `@source` directives for workspace packages should point to the source files directly
  using relative paths (`../../../../packages/react/src/**/*.{ts,tsx}`), not to
  `node_modules/@vexcms/react/dist/**`. Workspace packages are symlinked, not copied to
  `node_modules` locally, and the dist files don't exist during dev if packages haven't
  been built. *(Encoded: sync-spec 01, 2026-04-07)*

## Next.js Package Structure (`@vexcms/next`)

- **Server/client split via sub-path exports**: Any `@vexcms/next` package that exports
  both async server components AND `"use client"` components must split into sub-path
  exports (`./server`, `./client`) with separate tsup entry points. tsup's global
  `banner: { js: '"use client";' }` stamps ALL entries in a single config — a shared
  entry would incorrectly mark server components as client components.
  *(Encoded: sync-spec 01, 2026-04-07)*

## Field Type Naming

- **Field type names describe the UI widget, not the data type**: The function name, type string, and interfaces match the input control, not the underlying data type. `checkbox()` stores a `boolean` via `v.boolean()`, but the field type is `"checkbox"`. `select()` stores a `string`, but the field type is `"select"`. Never name a field type after its data type (no `boolean()`, no `string()`). *(Encoded: sync-spec 20, 2026-04-11)*

## Field Type Defaults

- **Do not override `admin.width` or `admin.cellAlignment` as field-type-level defaults**: Keep both at the base defaults (`width: "full"`, `cellAlignment: "left"`) and let users opt in via the config. Field-type-specific override defaults in the spec (e.g., `width: "half"` for checkbox, `cellAlignment: "right"` for number) were intentionally dropped during implementation. *(Encoded: sync-spec 20, 2026-04-11)*

- **`date()` defaultValue is `undefined`, not `0`**: An empty start is more intuitive than epoch. `0` would silently pre-fill the form with 1970-01-01. *(Encoded: sync-spec 20, 2026-04-11)*

## Date Field

- **`date` input uses `<DateTimePicker>`, not `<input type="datetime-local" />`**: The custom DateTimePicker component handles `Date ↔ Unix ms` conversion, `clearable`, `modal`, `use12HourFormat`, and `timePicker` props internally. Never write manual `toISOString().slice(0, 16)` conversion code in a date field input component. *(Encoded: sync-spec 20, 2026-04-11)*

- **`date` cell uses `toLocaleDateString()`, not `date-fns`**: Native browser API is sufficient for locale-aware date display in table cells. Reserve `date-fns` for cases where formatting precision or locale control is actually required. *(Encoded: sync-spec 20, 2026-04-11)*

- **`date()` `time` option is a config object, not a boolean**: `time?: { hidden?: boolean; use12HourFormat?: boolean; timePicker?: { hour, minute, second } }`. The config function deeply merges defaults so all keys are always present on the resolved `DateField.time`. This lets components drive all picker props from `fieldDef.time` without conditional logic. Defaults: `{ hidden: false, use12HourFormat: true, timePicker: { hour: true, minute: true, second: false } }`. *(Encoded: sync-spec 20, 2026-04-11)*

## Checkbox / Boolean Fields

- **`CheckboxFieldCell` renders `"Yes"` / `"No"` text, not icons**: Avoids an icon import and is readable regardless of font/icon loading state. Always use text strings for boolean cell display. *(Encoded: sync-spec 20, 2026-04-11)*

## Implementation Completeness

- **CollectionListView needs a real data table**: The list view should include a TanStack
  Table implementation with column definitions derived from the collection's field config,
  not a `<p>` placeholder or a manual `<Table>` iteration. This was deferred to a dedicated
  data table spec because it requires cursor-based Convex pagination, column configuration,
  and sorting — enough complexity to deserve its own spec. Future specs for list views should
  default to including this. *(Noted: sync-spec 01, 2026-04-07)*

- **`Button nativeButton={false}` when wrapping non-button elements**: When Base UI's
  `Button` component wraps a non-`<button>` render element (e.g., `VexLink` which renders
  an `<a>`), always pass `nativeButton={false}` to suppress the accessibility warning.
  *(Encoded: sync-spec 01, 2026-04-07)*
