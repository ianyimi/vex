---
"@vexcms/core": patch
---

`CollectionConfig` gains an optional 8th type parameter `TFieldSlug` (default
`CollectionDataFieldSlug<TFields, TTimestamps>`), used by `admin` and `indexes[].fields`, and
`defineCollection` passes it explicitly. Deriving the slugs via `keyof TFields` inside the
interface made TypeScript < 6's variance probe treat `TFields` as invariant, so every concrete
collection failed assignment to `CollectionConfig` in editors running TS 5.x (e.g. vtsls with
bundled TS 5.8.3) even though `tsc` 6 accepted it. No change for code that omits the parameter.
