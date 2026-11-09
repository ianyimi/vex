# VexCMS 0.1.0 — release notes

VexCMS is a type-safe headless CMS built on Convex. 0.1.0 is the first release on the `latest` npm tag. Everything below is free and Apache-2.0.

## Highlights

- **One config, generated schema and types.** `defineCollection()` / `defineGlobal()` generate the Convex schema, TypeScript types and Zod validators through `vex dev` / `vex generate`.
- **16 field types**, including `richtext` (Plate.js via `@vexcms/richtext-plate`, with inline images from the media library), `blocks` with a cross-document block clipboard, and layout fields (`tabs`, `collapsible`, `row`, `ui`) with conditional fields enforced on client and server.
- **Versioning and drafts:** draft/publish, autosave, version history, restore and unpublish.
- **Live preview:** the admin streams unsaved form state onto your real route, for collections and globals.
- **Access control:** document- and field-level RBAC whose `withIndex` ranges and `where` predicates apply inside the Convex query itself, with an `anonRole` fallback.
- **A real-time admin panel** with list views (search, AND/OR filters, column controls, saved views), lifecycle hooks with async server-side `validate()`, and `pnpm create vexcms` scaffolding a full Next.js + Convex project.

## Breaking changes since the alphas

- `@vexcms/core`, `@vexcms/react`: `find` and `search` take `where` instead of `filter`; access-rule `constraints` split into `withIndex` and `where`; a field's `index` takes a name or an object, and field-level indexes win. See [`@vexcms/core` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md).
- `@vexcms/core`, `@vexcms/react`, `@vexcms/next`: collection admin URLs moved to `/admin/collections/<slug>`; the old `/admin/<slug>` URLs 404, with no redirect. See [`@vexcms/react` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/react/CHANGELOG.md).
- `@vexcms/core`, `@vexcms/react`, `@vexcms/next`: `@vexcms/core` no longer depends on React. Client wrappers moved to `@vexcms/react/client`, `LucideIconName` is now `IconName`, and `CellComponentProps.row` is `CellRow<TData>`. See [`@vexcms/core` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md).
- `@vexcms/core`, `@vexcms/react`, `@vexcms/next`: `defineCollection` singularizes the slug for derived `labels.singular`; dead pagination exports (`usePagination` and related) were removed from `@vexcms/react`. See [`@vexcms/core` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md).
- `@vexcms/core`, `@vexcms/react`: a field-permission map that lists only some fields now also hides system fields. See [`@vexcms/core` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md).
- `@vexcms/core`, `@vexcms/react`: `versions.saveDraft` covers collections and globals through one endpoint with new wire args, and `globals.upsert` on a versioned global no longer writes a draft row. See [`@vexcms/core` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md).
- `@vexcms/core`: the saved-view actions (`readViews`, `createView`, `updateView`, `deleteView`) accept only boolean permissions. See [`@vexcms/core` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md).
- `@vexcms/react` (narrow): `Button` groups icon and label by default instead of spacing them apart; `GlobalsListView` is now permission-filtered. See [`@vexcms/react` CHANGELOG](https://github.com/ianyimi/vex/blob/master/packages/react/CHANGELOG.md).

## Upgrade notes

Install from the `latest` npm tag: `pnpm add @vexcms/core@latest @vexcms/react@latest @vexcms/next@latest @vexcms/better-auth@latest @vexcms/file-storage-convex@latest` (drop any `@alpha` pins), then run `vex generate`.

## Full changelog

- [`@vexcms/core`](https://github.com/ianyimi/vex/blob/master/packages/core/CHANGELOG.md)
- [`@vexcms/react`](https://github.com/ianyimi/vex/blob/master/packages/react/CHANGELOG.md)
- [`@vexcms/next`](https://github.com/ianyimi/vex/blob/master/packages/next/CHANGELOG.md)
- [`@vexcms/cli`](https://github.com/ianyimi/vex/blob/master/packages/cli/CHANGELOG.md)
- [`@vexcms/better-auth`](https://github.com/ianyimi/vex/blob/master/packages/better-auth/CHANGELOG.md)
- [`@vexcms/file-storage-convex`](https://github.com/ianyimi/vex/blob/master/packages/file-storage-convex/CHANGELOG.md)
- [`@vexcms/richtext-plate`](https://github.com/ianyimi/vex/blob/master/packages/richtext-plate/CHANGELOG.md)
- [`create-vexcms`](https://github.com/ianyimi/vex/blob/master/packages/create-vexcms/CHANGELOG.md)
