---
"@vexcms/core": minor
---

`populate`/`depth` now reach a `relationship()`/`upload()` field nested inside a `blocks()`
block, an `array()` item, or a `group()` — not only top-level fields. The populate shape
mirrors the field tree: a `group()`/`array()` key nests directly (`{ seo: { ogImage: true } }`),
a `blocks()` key nests one level further, keyed by the block's own `blockType` slug
(`{ content: { hero: { image: true } } }`). `tabs()`/`row()`/`collapsible()` need no special
handling — their fields were already hoisted to the containing level.

The augmented `CollectionsPopulateMap` registry (emitted by `vex generate`, mirroring
`CollectionsFieldTypeMap`) drives both the compile-time `PopulateShape`/`Populated` types and
the runtime walk (`populateDocs`, `buildDepthPopulate`); every target collection's own read
rule, field-permission map, `HiddenDocument` placeholder, and draft exclusion apply to a
nested target exactly as they already did for a top-level one, batched per target collection
across EVERY nesting level in one call (never once per block/array item).

`PopulateShape<TCollectionSlug>` now also accepts a top-level `upload()` field key (previously
type-restricted to `relationship()` keys only, even though the runtime already resolved
`upload()` fields the same way).

**Depth cost:** crossing from one collection into a populated target's own relationships
costs one depth level, same as before. Descending through a `blocks()`/`array()`/`group()`
boundary within the SAME collection costs nothing.

Run `vex generate` (or `vex dev`) to refresh `vex.types.ts` with the new
`CollectionsPopulateMap` entries before nested populate type-checks in your project.
