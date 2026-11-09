title: Plugin system
labels: planned, type: feature

## Context

0.1.0 ships the extension points (admin slots, component overrides, action contributions) a plugin
system needs, but nothing outside the core packages can register against them yet.

## Scope

A `definePlugin({ id, requires, client, server })` API with typed contributions to any part of a
VexCMS config — collections, fields, hooks, access resources, routes, admin slots, server functions,
CLI hooks — plus declared inter-plugin dependencies and a `renderDefault` chain so a plugin can wrap
rather than replace a built-in. First-party packages (`@vexcms/better-auth`,
`@vexcms/file-storage-convex`, `@vexcms/richtext-plate`) become the reference implementations, dog-
fooding the same API third-party plugin authors use.

## Acceptance criteria

- [ ] A third-party plugin can add a collection, a field type, and an admin-slot contribution without
      forking `@vexcms/core`
- [ ] `@vexcms/better-auth` is rewritten as a plugin using the new API with no behavior change
- [ ] The plugin API and authoring guide are documented in `apps/docs`

## Out of scope

A plugin marketplace or registry.
