---
"@vexcms/core": patch
---

Thread optional `width`/`height` through `createMediaDocument`'s full args chain —
`api.vex.media.createMediaDocument`'s Convex mutation args, `CreateMediaDocumentServerArgs`/
`CreateMediaDocumentClientArgs`/`VexMediaCreateMediaDocumentArgs`, and the
`StorageAdapterBaseInterface`/`StorageAdapterPresignedUrl` `createMediaDocument` contract
every storage adapter implements — so a client that measures an uploaded image's pixel
dimensions can pass them through to the adapter. Previously there was no way to get
dimensions to the storage layer at all.

`width`/`height` are omitted entirely from the field-permission `changes` object and the
adapter call when not provided, rather than passed as `undefined`-valued keys — the latter
would count as a denied field against any existing field-permission map that doesn't
happen to list `width`/`height`, rejecting every media upload for roles whose map predates
this change.
