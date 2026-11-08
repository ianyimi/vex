---
"@vexcms/core": patch
---

`publishedSlugs` from `vexServerApi` now threads the bound config and auth into `find`, so draft-only documents in a collection with `versions.drafts` no longer appear in `sitemap.xml` or `generateStaticParams`.
