---
"@vexcms/core": patch
"@vexcms/react": patch
---

**Breaking — `find` and `search` take `where` instead of `filter`.** Fields are named
directly, with no `q.field(...)`:

```ts
// before
find({ ctx, collection: "posts", filter: (q) => q.eq(q.field("published"), true) })
// after
find({ ctx, collection: "posts", where: (q) => q.eq("published", true) })
```

`where` uses the same builder as access rules: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `and`,
`or`, `not`. `withIndex` is unchanged at the call site; its `range` is now typed from your
generated index declarations rather than the Convex data model.

**Breaking — access rules: `constraints` splits into `withIndex` and `where`.** Each maps onto
the `find` argument of the same name. `withIndex` (query actions only) is the same
`{ name, range }` object `find` takes, or a function of the caller returning one; `where`
builds a predicate with `q`. Either callback may return `true` (no restriction from this half)
or `false` (deny). The rule-level `filter` property is unchanged. Any combination is allowed.

```ts
// before
read: { constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")) }
read: { constraints: ({ user, q }) => q.withIndex("by_author", (ix) => ix.eq("author", user._id)) }
update: { constraints: ({ user, q }) => q.filter((f) => f.eq("author", user._id)) }
// after
read: { withIndex: { name: "by_status", range: (ix) => ix.eq("status", "published") } }
read: { withIndex: ({ user }) => ({ name: "by_author", range: (ix) => ix.eq("author", user._id) }) }
update: { where: ({ user, q }) => q.eq("author", user._id) }
```

`@vexcms/react/testing`'s access fixtures use the new shape.

**Breaking — a field's `index` takes a name or an object; field-level indexes win.**
`index: "by_slug"` is unchanged. The object form `index: { name, additionalFields?, draftStatus? }`
declares a compound index led by the field, and replaces the sibling `indexDraftStatus`:

```ts
// before
author: relationship({ to: "users", index: "by_author", indexDraftStatus: true })
// after
author: relationship({ to: "users", index: { name: "by_author", draftStatus: true } })
// new: compound index led by the field → .index("by_author_status", ["author", "status"])
author: relationship({ to: "users", index: { name: "by_author_status", additionalFields: ["status"] } })
```

- An explicit field-level index now wins over a collection-level `indexes` entry of the same
  name (previously the collection-level entry won), which wins over a relationship field's
  automatic `by_<fieldKey>` index. A relationship field that wants `draftStatus` on its
  automatic index names it explicitly, as above.
- Two fields declaring the same index name now throw at `defineCollection`. Previously the
  schema emitted both (which Convex rejects) while the generated types merged them.
- `additionalFields` names are checked against the collection's fields at `defineCollection`.
  Field factories take the field's own key as an optional second generic
  (`text<"articles", "slug">`) to type `additionalFields` against the collection's other
  fields; `TFieldMeta` moves to the third generic.

**New — `VexError`.** Throw it from a field's `validate()` instead of `ConvexError`; the admin
receives the same structured data with the failing `field` added.

**New — `where` accepts a plain data form.** Besides the builder callback, `where` now also
accepts `VexWhereNode<S>`, the same filter as plain JSON — for a filter that needs to be saved
or sent over the wire, which a function cannot be:

```ts
find({ ctx, collection: "posts", where: { and: [{ field: "featured", op: "eq", value: true }] } })
```

Convert a builder callback to this shape with `whereToNode`; validate an untrusted one (a
saved view, a URL param) with `validateWhereNode`, which throws a `VexError` on a malformed
shape (including an empty `and` / `or`), an unknown operator, or an unknown field name.

**New — `where` on the client.** `find` and `search` from `@vexcms/react/client` accept
`where` in either form; a callback is converted to the plain form before it is sent. A `where`
on a field the caller cannot read (field-level RBAC) excludes the documents where it is hidden,
so a filter cannot be used to probe hidden values.
