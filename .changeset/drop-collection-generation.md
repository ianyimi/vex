---
"@vexcms/cli": minor
---

Drop per-collection Convex file generation (`generateCollectionFiles`, and the call to it from
`vex generate`/`vex dev`). The emitted `convex/vex/api/*` and `convex/vex/model/api/*` files had
no consumers under the factory-registered runtime API (`collectionsApi` et al.) — `vex
generate`/`vex dev` now only write `vex.schema.ts` and `vex.types.ts`.

BREAKING: a project relying on the generated per-collection query/mutation files must migrate to
the factory-registered API exposed by `@vexcms/core`. Bumped `minor` rather than `major` —
these packages are pre-1.0 alpha.
