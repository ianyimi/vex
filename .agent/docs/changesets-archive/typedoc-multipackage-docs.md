---
"@vexcms/core": minor
"@vexcms/react": minor
"@vexcms/file-storage-convex": patch
---

Enable a zero-warning multi-package TypeDoc API reference and export supporting API.

- Export `usePaginatedQuery` (`@vexcms/react`) and `StorageAdapterPresignedUrlInterface` plus its base interface (`@vexcms/core`) as public API.
- Fix `RelationshipFieldAdminConfig` to extend the resolved admin base (`FieldAdminConfig`) instead of the input base, so resolved relationship admin properties are correctly required rather than optional.
