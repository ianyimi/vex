title: TanStack Start adapter
labels: planned, type: feature, area: core

## Context

`@vexcms/next` is the only framework adapter today; the admin panel and its caching helpers are
Next.js-specific.

## Scope

A `@vexcms/tanstack-start` package mirroring `@vexcms/next`'s public surface (admin panel mount,
server config wiring, caching/revalidation helpers) on TanStack Start, built against the same
framework-adapter seam `@vexcms/next` already uses internally.

## Acceptance criteria

- [ ] A TanStack Start app can mount the full admin panel via the new package, with the same field
      types and access-control behavior as the Next.js adapter
- [ ] `create-vexcms` can scaffold a TanStack Start project
- [ ] The adapter is documented in `apps/docs` alongside the Next.js guide

## Out of scope

Any framework adapter other than TanStack Start.
