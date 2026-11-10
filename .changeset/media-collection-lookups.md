---
"@vexcms/core": patch
---

`find`, `get`, `search`, `remove` and relationship population now find media collections, not
only `config.collections` (new internal `findCollectionConfig`). An edited image's `updatedAt`
reached the admin media list as a raw `bigint` and crashed it ("Cannot convert a BigInt value
to a number"), and deleting from the media list failed with "No collection registered".
