---
"@vexcms/core": patch
---

Moves `disableCreate?: boolean` from `admin.disableCreate` to the top level of a collection's
config (`CollectionConfigInput`/`CollectionConfig`) — hides every admin-authored create entry
point for that collection (the list view's "+ New" action, `?createNew=true`'s create-document
modal, and a relationship field's picker Create tab/trigger when the collection is the target),
and now also makes the `vex:create` Convex endpoint (`collectionsApi`) reject with a `ConvexError`.
`create()` imported directly from `@vexcms/core/server` is unaffected. Moving it out from under
`admin` lets it survive `mergeAuthCollections`.

`mergeAuthCollections` now merges the auth adapter's and the project's collection generically
instead of letting the project's resolved `admin` object replace the adapter's whole-sale (which
silently dropped adapter-only settings like `disableCreate` in every real project). It recovers
both sides' raw `defineCollection()` input via the newly-exported `COLLECTION_INPUT` symbol and
deep-merges every key but `fields` (which keeps its existing locked-field rule): a plain object on
both sides merges key-by-key, recursively — so `admin.view.where`/`admin.view.sort` compose instead
of one side replacing the other whole — while an array, function, class instance, or primitive is
replaced wholesale by the project's value, and a project value of `undefined` never overwrites. A
collection assembled by spreading a resolved `CollectionConfig` rather than calling
`defineCollection()` on the modified input now throws, naming the slug.
