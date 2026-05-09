# Spec 23 — Vex API: Design Walkthrough

> **Read this first.** This is a *design companion* to the eventual implementation spec
> (`spec.md`, drafted later). It shows what the user-facing API will look like by walking
> through real code an `apps/www` developer would write once everything is implemented.
> The goal is to see, before writing the implementation spec, that the public surface
> is coherent end-to-end and to make layering decisions visible.
>
> When the implementation spec is drafted, this file becomes the readable reference
> consumers use to understand the API. Update it whenever the surface changes.

---

## What this spec covers

A typed data layer for VexCMS that:

1. **Wraps the existing Convex API** with `populate`-aware result types — relationship
   fields can be statically narrowed from `Id[]` to `Doc[]` based on the populate
   array, with no `string | Doc` union ever appearing in user code.
2. **Centralises access control** (RBAC) at the data layer — every read/write goes
   through one path that runs collection-level + field-level access checks against
   the current session.
3. **Stays Convex-idiomatic** — no parallel "Local API" namespace. Users compose
   `useQuery` / `useMutation` from tanstack-query the same way they do today, just
   with a typed query factory in the middle.

---

## Layering — where does the new code live?

```
┌────────────────────────────────────────────────────────────────┐
│  User code                                                     │
│                                                                │
│    useQuery(vex.find({ slug: "posts", populate: { author: true } }))       │
│    └── tanstack-query (unchanged)                              │
│        └── vex.find({ slug, ... })         ←──── NEW: typed       │
│            └── convexQuery(api, args)         query factory    │
│                └── vexConvexApi.list    ←──── ENHANCED:        │
│                    └── Convex query           accepts populate │
│                        + access checks  ←──── ENHANCED:        │
│                                               runs RBAC        │
└────────────────────────────────────────────────────────────────┘
```

**Plain English:** a single new function `vex.find({ slug, ... })` (and siblings:
`vex.get`, `vex.create`, `vex.update`, `vex.delete`, `vex.search`) sits between
`convexQuery` and `vexConvexApi`. It's a thin typed factory — at runtime it just
calls `convexQuery(vexConvexApi.list, { collection: slug, populate: opts.populate })`.
The value-add is **purely at the type level**: it narrows the result type using
the augmented-module `RelationshipMap` codegen.

`useQuery`, `convexQuery`, and `vexConvexApi` all stay exactly where they are.
**The new layer doesn't replace any of them**; it composes them and adds typing.

> **Why not replace `useQuery` with a `useVexQuery` wrapper?** We could (and might
> add it later as sugar), but it's optional. `useQuery(vex.find({…}))` is already
> ergonomic; an additional hook layer would just be `useQuery(vex.find({…}))` with
> different syntax.

---

## Package placement

`@vexcms/core` for now. Specifically:

- `packages/core/src/api/` — new module: `vex.find`, `vex.get`, `vex.create`,
  `vex.update`, `vex.delete`, `vex.search`. Plus the `Populated<TDoc, TPopulate>`
  type machinery.
- `packages/core/src/access/` — new module: `runAccessChecks`, `filterFields`,
  the `Access<TDoc>` type. Used by Convex query handlers in
  `packages/core/src/convex/vex/`.
- `packages/core/src/types/generated.ts` — gains `CollectionsFieldTypeMap` (as a derived top-level export reading `GeneratedVexTypes["CollectionsFieldTypeMap"]`)
  declaration alongside the existing `GeneratedVexTypes`.
- Re-exported from `@vexcms/react` (HKT-bound where applicable) → re-exported
  transitively from `@vexcms/next`.
  Users always import from `@vexcms/next` (Next apps) or `@vexcms/react`
  (other React apps), never from `@vexcms/core` directly.

**Why core, not a separate package?**

| | Core | Separate `@vexcms/api` |
|---|---|---|
| Coupling to Convex | tight — but Convex is the only backend currently | independent — but currently a non-issue |
| RBAC+data fetching coupling | cohesive — same path, same checks | RBAC has to call into the data layer or duplicate logic |
| Type generation | reuses existing `vex.types.ts` augmentation | needs its own codegen pipeline OR consumes core's |
| Publishing cadence | locked to core releases | can ship breaking changes independently |
| User import | `@vexcms/next` (transitive) | `@vexcms/api` direct |

For v0.1.0, **core wins on cohesion** — RBAC is the data layer, and there's only
one backend. If a second backend (e.g. raw Postgres adapter, or a remote-only
mode) ever materialises, splitting `@vexcms/api` out is a refactor, not a
re-architecture. The public-facing import path doesn't change because everything
flows through `@vexcms/next` regardless.

---

## End-to-end walkthrough — what code an `apps/www` developer writes

### 1. Define collections (unchanged today)

```ts
// apps/www/src/vexcms/collections/authors.ts
import { defineCollection, text } from "@vexcms/next";

export const authors = defineCollection({
  slug: "authors",
  admin: { useAsTitle: "name" },
  fields: {
    name: text({ required: true }),
    email: text({ required: true }),
    bio: text(),
  },
});
```

```ts
// apps/www/src/vexcms/collections/posts.ts
import { defineCollection, text, relationship, select } from "@vexcms/next";

export const posts = defineCollection({
  slug: "posts",
  admin: { useAsTitle: "title" },
  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    author: relationship({ collection: { slug: "authors" }, required: true }),
    status: select({
      required: true,
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    }),
    body: text(),
  },
});
```

```ts
// apps/www/src/vex.config.ts
import { defineConfig } from "@vexcms/next";
import { authors } from "./vexcms/collections/authors";
import { posts } from "./vexcms/collections/posts";

export default defineConfig({
  collections: [authors, posts],
});
```

### 2. Codegen runs (`vex dev` or `vex generate`)

```ts
// apps/www/src/vex.types.ts — AUTO-GENERATED
import type { Id } from "convex/values";

declare module "@vexcms/core" {
  // Existing — typed document shapes per slug
  interface GeneratedVexTypes {
    authors: {
      _id: Id<"authors">;
      _creationTime: number;
      name: string;
      email: string;
      bio?: string;
    };
    posts: {
      _id: Id<"posts">;
      _creationTime: number;
      title: string;
      slug: string;
      // Note: relationship is stored as Id[] (UI-only hasMany distinction)
      author: Id<"authors">[];
      status: "draft" | "published";
      body?: string;
    };
  }

  // NEW — per-collection field-type map, used by helper types like
  // RelationshipKeysOf<TSlug>, TextKeysOf<TSlug>, etc. Added as a property
  // on the SAME GeneratedVexTypes interface (no parallel `GeneratedFieldTypeMap`
  // augmentation) — single registry, multiple properties.
  CollectionsFieldTypeMap: {
    authors: {
      text: "name" | "email" | "bio";
    };
    posts: {
      text: "title" | "slug" | "body";
      relationship: "author";
      select: "status";
    };
  };
}
```

The user never edits this file. It regenerates whenever a collection file changes.

### 3. Read data — populate narrows the result type

```ts
// apps/www/src/app/(vexcms)/admin/posts/page.tsx
"use client";
import { useQuery } from "@tanstack/react-query";
import { vex } from "@vexcms/next";

export function PostsList() {
  const { data: posts, isPending } = useQuery(
    vex.find({ slug: "posts", populate: { author: true } }),
  );
  // posts is typed as: ReadonlyArray<{
  //   _id: Id<"posts">;
  //   _creationTime: number;
  //   title: string;
  //   slug: string;
  //   author: Doc<"authors">[];        ←── narrowed from Id<"authors">[]
  //   status: "draft" | "published";
  //   body?: string;
  // }>
  // No string | Doc union, no narrowing needed at usage sites.

  if (isPending) return <p>Loading…</p>;
  return (
    <ul>
      {posts?.map((post) => (
        <li key={post._id}>
          {post.title} — by {post.author[0]?.name ?? "Unknown"}
          {/*                  ^^^^^^^^^^^^^^^^^^
              author[0] is fully Doc<"authors">; .name autocompletes,
              accessing .nonexistent would compile-error. */}
        </li>
      ))}
    </ul>
  );
}
```

```ts
// Without populate — author stays as IDs
const { data: posts } = useQuery(vex.find({ slug: "posts" }));
// posts[0].author is Id<"authors">[]
posts[0].author[0].name;  // ❌ Compile error: 'name' does not exist on type 'Id<"authors">'
```

```ts
// Wrong populate key — caught at compile time
const { data: posts } = useQuery(
  vex.find({ slug: "posts", populate: { authr: true } }),
  //                              ^^^^^^^
  //  ❌ Type '"authr"' is not assignable to type 'RelationshipKeysOf<"posts">'.
  //     Did you mean '"author"'?
);
```

```ts
// Wrong slug — caught at compile time
const { data: posts } = useQuery(vex.find({ slug: "postz" }));
//                                         ^^^^^^^
//  ❌ Argument of type '"postz"' is not assignable to parameter of type
//     'CollectionSlug'.
```

### 4. Read a single doc — same type machinery

```ts
const { data: post } = useQuery(
  vex.get({ id: postId, populate: { author: true } }),
);
// post: Doc<"posts"> & { author: Doc<"authors">[] } | undefined
//       (undefined while loading or if not found)

post?.author[0]?.email;  // ✓ typed access
```

### 5. Mutations — typed input shape

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vex } from "@vexcms/next";

export function CreatePostButton() {
  const queryClient = useQueryClient();
  const create = useMutation({
    ...vex.create({ slug: "posts" }),
    onSuccess: () => {
      // Invalidate the posts list so it re-fetches.
      queryClient.invalidateQueries({ queryKey: vex.find.queryKey("posts") });
    },
  });

  return (
    <button
      onClick={() =>
        create.mutate({
          data: {
            title: "New post",
            slug: "new-post",
            author: ["a_01"],          // Id<"authors">[]
            status: "draft",           // narrowed to the select's options
            body: "Hello world",
          },
          // The `data` argument is typed against the WRITE shape of Doc<"posts">:
          // - System fields (_id, _creationTime) are excluded (Convex generates them)
          // - Relationship fields stay as Id[] (you write IDs, you read populated docs)
          // - Required fields must be present; optional fields can be omitted
        })
      }
    >
      Create
    </button>
  );
}
```

```ts
// Update — partial shape; slug recovered from Id<T> brand (D13)
const update = useMutation(vex.update());
update.mutate({
  id: postId,
  data: { status: "published" },  // partial — only changed fields
});
```

```ts
// Delete — just an id; slug recovered from Id<T> brand
const remove = useMutation(vex.delete());
remove.mutate({ id: postId });
```

### 6. Server-side — same API, no hooks

```ts
// apps/www/src/app/(frontend)/blog/[slug]/page.tsx
import { fetchVex } from "@vexcms/next/server";  // server-only entry
import { vex } from "@vexcms/next";

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const [post] = await fetchVex(
    vex.find({
      slug: "posts",
      where: { slug: params.slug, status: "published" },
      populate: { author: true },
      limit: 1,
    }),
  );
  // Same type narrowing as the React-side hooks. Runs RBAC against the
  // server's session (or anonymous if no session).

  if (!post) return <p>Not found.</p>;
  return (
    <article>
      <h1>{post.title}</h1>
      <p>By {post.author[0].name}</p>
      <div>{post.body}</div>
    </article>
  );
}
```

### 7. Search inside the picker (existing path, re-typed)

```ts
// Used internally by RelationshipFieldInput
const { data: candidates, isPending } = useQuery(
  vex.search({ slug: "authors", query: debouncedQuery, limit: 20 }),
);
// candidates: Doc<"authors">[]  — typed against the slug
```

### 8. Nested populate — follow relationships through multiple levels

```tsx
import { useQuery } from "@tanstack/react-query";
import { vex } from "@vexcms/next";

export function PostsWithAuthorOrgs() {
  const { data: posts } = useQuery(
    vex.find({
      slug: "posts",
      populate: {
        author: {
          populate: {
            organization: true,
          },
        },
        category: true,
      },
    }),
  );
  // posts is typed as: ReadonlyArray<{
  //   _id: Id<"posts">;
  //   _creationTime: number;
  //   title: string;
  //   slug: string;
  //   author: ReadonlyArray<Doc<"authors"> & {
  //     organization: ReadonlyArray<Doc<"organizations">>;
  //                            // ^^^^^^^^^^^^^^^^^^^^^^^^
  //                            // typed via the recursive Populated<>
  //   }>;
  //   category: Doc<"categories">[];
  //   status: "draft" | "published";
  //   body?: string;
  // }>

  return (
    <ul>
      {posts?.map((post) => (
        <li key={post._id}>
          {post.title}
          {" — by "}
          {post.author[0]?.name}
          {" @ "}
          {post.author[0]?.organization[0]?.name}
          {/*                  ^^^^^^^^^^^^^^^^^^^
              Recursively narrowed; .name autocompletes. */}
        </li>
      ))}
    </ul>
  );
}
```

```ts
// Three levels deep — still works
const { data } = useQuery(
  vex.find({
    slug: "posts",
    populate: {
      author: {
        populate: {
          organization: {
            populate: { headquarters: true },
          },
        },
      },
    },
  }),
);
// data[0].author[0].organization[0].headquarters: Doc<"locations">[]
```

```ts
// Five levels — still works as long as the data fits Convex's per-query limits
const { data } = useQuery(
  vex.find({
    slug: "posts",
    populate: {
      author: {
        populate: {
          organization: {
            populate: {
              headquarters: {
                populate: { city: true },
              },
            },
          },
        },
      },
    },
  }),
);
// data[0].author[0].organization[0].headquarters[0].city: Doc<"cities">[]
//
// No artificial depth cap. The natural limits are:
//   - TypeScript: refuses around ~50 levels of recursive type instantiation
//   - Convex runtime: throws if the total fetched data exceeds 32 MB or
//     16k doc reads regardless of declared depth
//   - Reactive subscription cost: each populated doc adds a Convex sub;
//     visible in the Convex dashboard, user self-regulates based on perf
```

> **Performance note.** Each populate level adds another batched fetch on the
> server. For a 100-post list with 2 nested levels and ~20 unique authors
> across all posts and ~5 unique organizations, you're looking at ~3 round
> trips total (Convex internally batches `ctx.db.get(id)` calls within a
> query handler). Reactive subscriptions multiply with nesting — each
> populated doc is its own subscription — so for live-updating list views
> use `useSuspenseQuery` over `useQuery` only when fresh-data-on-mount is
> sufficient and you don't need realtime.

### 9. Isomorphic API — same `vex.find` (server overload) works inside custom Convex queries

The data layer is **isomorphic across client and server**. The same join
logic that powers `vex.find` (client) also powers `vex.find({ ctx, ... })`
which users call inside their own Convex query handlers in `apps/www/convex/`.

```ts
// apps/www/convex/customQueries.ts
import { query } from "./_generated/server";
import { vex } from "@vexcms/core";
//        ^^^^ same import as client; the namespace exports both
//             `vex.find` (client factory) and `vex.find` (server overload) (server handler).

/**
 * Custom Convex query: featured published posts, populated with author info,
 * sorted by view count. Composes `vex.find` (server overload) with project-specific logic.
 */
export const featuredPosts = query({
  args: {},
  handler: async (ctx) => {
    // Same args, same return shape as `vex.find` — just synchronous in the
    // Convex runtime. Type narrows the same way: posts[0].author = Doc<"authors">[].
    const posts = await vex.find({
      ctx,
      slug: "posts",
      populate: { author: true },
      limit: 50,
    });

    return posts
      .filter((p) => p.featured && p.status === "published")
      .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
      .slice(0, 10);
    // Return type is inferred all the way through:
    // ReadonlyArray<Doc<"posts"> & { author: Doc<"authors">[] }>
  },
});
```

Users' frontend code calls the custom query exactly like any other Convex
query — the populated shape comes through unchanged:

```tsx
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "~/../convex/_generated/api";

function FeaturedPostsWidget() {
  const { data: featured } = useQuery(
    convexQuery(api.customQueries.featuredPosts, {}),
  );
  // featured[0].author[0].name autocompletes — the populated shape was
  // preserved through the custom query into the client.
  return (
    <ul>
      {featured?.map((p) => (
        <li key={p._id}>{p.title} — {p.author[0]?.name}</li>
      ))}
    </ul>
  );
}
```

Why this matters:

- **One implementation of the join logic.** `vexConvexApi.list` (the auto-
  registered query) is a 3-line wrapper around `vex.find` (server overload). No drift
  between "how the API endpoint joins" and "how user-written queries join".
- **User queries get the same type narrowing.** Custom Convex queries
  composing `vex.find` (server overload) get full populate-narrowed types in their
  return values — propagates through Convex's generated `api.*` types into
  the client.
- **Future hooks system slot.** The eventual `beforeRead` / `afterChange`
  hooks (Phase 4) hook into the same `vex.find({ ctx, ... })` path. Once that
  lands, hooks fire whether the data flows through the client overload
  `vex.find({ slug, ... })` or the server overload `vex.find({ ctx, slug, ... })` —
  same path, same hooks, no duplication.
- **Convex-only architecture is OK.** No backend abstraction layer needed
  (per Decision 14). When and if a Postgres adapter ever materialises, the
  isomorphic API gets refactored at that point. Don't pre-abstract.

---

## Access control — same data layer, RBAC built in

Access checks live on the collection config and run server-side on every
`vex.*` call. The user never has to remember to call them; they're always on.

### 8. Collection-level access

```ts
// apps/www/src/vexcms/collections/posts.ts
import { defineCollection, text, relationship, select } from "@vexcms/next";

export const posts = defineCollection({
  slug: "posts",
  admin: { useAsTitle: "title" },

  // Access runs in the Convex query/mutation handlers automatically.
  access: {
    // Read: anyone can read published posts; authors can read their own drafts.
    read: ({ user, doc }) => {
      if (doc.status === "published") return true;
      if (!user) return false;
      return user.role === "admin" || doc.author.includes(user._id);
    },

    // Create: any authenticated user.
    create: ({ user }) => Boolean(user),

    // Update: author of the post or an admin.
    update: ({ user, doc }) => {
      if (!user) return false;
      return user.role === "admin" || doc.author.includes(user._id);
    },

    // Delete: admins only.
    delete: ({ user }) => Boolean(user && user.role === "admin"),
  },

  fields: {
    title: text({ required: true }),
    slug: text({ required: true }),
    author: relationship({ collection: { slug: "authors" }, required: true }),
    status: select({
      options: [
        { label: "Draft", value: "draft" },
        { label: "Published", value: "published" },
      ],
    }),
    body: text(),
  },
});
```

When a client calls `vex.find({ slug: "posts" })`:

1. Convex query handler iterates posts.
2. For each post, runs `posts.access.read({ user, doc })`.
3. Filters out posts the user can't see.
4. Returns the visible subset.

The client gets a result that's **always pre-filtered**. No "did the user have
permission?" guessing in the React layer.

### 9. Field-level access

```ts
fields: {
  // ... other fields
  internalNotes: text({
    access: {
      // Hidden from non-admins. Reads return undefined; writes are rejected.
      read: ({ user }) => Boolean(user && user.role === "admin"),
      update: ({ user }) => Boolean(user && user.role === "admin"),
    },
  }),

  email: text({
    required: true,
    access: {
      // Email visible to admins and the user themselves; hidden from others.
      read: ({ user, doc }) =>
        Boolean(
          user && (user.role === "admin" || user._id === doc._id),
        ),
    },
  }),
}
```

When a non-admin reads a post via `vex.get({ id })`, the response is the
post object **with `internalNotes: undefined` and `email: undefined`**. The
fields are typed as optional in the read result; writes that touch them throw
a permission error.

> **Type-level note.** Field-level access does NOT narrow types per role —
> role is dynamic and cannot be tracked through the type system without a
> code-generated permission map. Instead, fields with field-level access become
> `T | undefined` in the result type. The UI handles "missing field" gracefully
> (e.g. shows "—" or hides the cell). This trade-off is intentional and
> documented in `developer-preferences.md` (RBAC type-narrowing rejected; runtime
> behaviour is the source of truth).

### 10. Reading with implicit access — same code as before

```ts
const { data: posts } = useQuery(
  vex.find({ slug: "posts", populate: { author: true } }),
);
// posts is the access-filtered subset.
// Each post's internalNotes / email may be undefined depending on the caller's role.
```

There is no `vex.findUnsafe()` or `vex.findAsAdmin()` escape hatch. If the user
needs broader access, they elevate their role; the API doesn't allow bypassing.

---

## Two mechanisms for field-typed constraints — same-call vs cross-call

This spec uses both, in different places:

| Constraint | Mechanism | Why |
|---|---|---|
| `defineCollection.admin.useAsTitle` (must be a text key) | **Deep generics** | Fields are in the same call; no codegen lag |
| `defineCollection.admin.defaultSort` (must be sortable) | **Deep generics** | Same |
| `select.defaultValue` (must be one of `options[].value`) | **Deep generics** | Options are in the same call |
| `vex.find({ slug, populate })` (must be relationship keys for slug) | **Codegen** | Slug is a string; fields aren't in scope |
| Relationship picker target-side preview's `useAsTitle` lookup | **Codegen** | Target collection's fields aren't in scope |
| RBAC predicate `({ doc }) => doc.field` typing | **Codegen** | Reads via `Doc<TSlug>` registry |

The codegen registry expands from just `GeneratedVexTypes` (document shapes) to
also include `CollectionsFieldTypeMap` as a property of the same
`GeneratedVexTypes` interface (alongside `CollectionSlug` and `DocumentBySlug`
properties):

```ts
declare module "@vexcms/core" {
  interface GeneratedVexTypes {
    CollectionSlug: "posts" | "authors";
    DocumentBySlug: { posts: Post; authors: Author };
    CollectionsFieldTypeMap: {
      posts: {
        text: "title" | "slug" | "body";
        relationship: "author" | "category";
        select: "status";
        date: "publishedAt";
      };
      authors: { text: "name" | "email" | "bio" };
    };
  }
}
```

From this single registry, all per-field-type helpers derive:
`RelationshipKeysOf<TSlug>`, `TextKeysOf<TSlug>`, `SortableKeysOf<TSlug>`, etc.
Adding a new constraint dimension never requires a new augmentation interface
— just a new top-level helper type in core that reads the existing map. Adding
a new generated metadata kind is a new property on `GeneratedVexTypes` plus a
top-level derived export following the same `extends { X: infer T } ? T : <fallback>`
pattern as `CollectionSlug` / `DocumentBySlug`.

The deep-generics half doesn't need codegen; it works at the call site by
inspecting the `fields` object literal's `type: "…"` discriminator on each
field-config function's return shape.

---

## How the populate type machinery works (under the hood)

Skip this section unless you're implementing it. Users don't see this.

```ts
// packages/core/src/types/generated.ts
export interface GeneratedVexTypes {}      // augmented by user's vex.types.ts
// Single augmentation interface; codegen adds properties to it
export interface GeneratedVexTypes {}

// Top-level derived exports — same `extends { X: infer T }` pattern across all
export type CollectionSlug = GeneratedVexTypes extends {
  CollectionSlug: infer S extends string;
} ? S : string;

export type DocumentBySlug = GeneratedVexTypes extends {
  DocumentBySlug: infer D extends Record<string, unknown>;
} ? D : Record<string, unknown>;

export type CollectionsFieldTypeMap = GeneratedVexTypes extends {
  CollectionsFieldTypeMap: infer M extends Record<string, Record<string, string>>;
} ? M : Record<string, Record<string, never>>;

export type Doc<TSlug extends CollectionSlug> = TSlug extends keyof DocumentBySlug
  ? DocumentBySlug[TSlug]
  : never;

// Helpers consult the per-collection field-type map for relationship lookups
export type RelationshipKeysOf<TSlug extends CollectionSlug> =
  TSlug extends keyof CollectionsFieldTypeMap
    ? "relationship" extends keyof CollectionsFieldTypeMap[TSlug]
      ? CollectionsFieldTypeMap[TSlug]["relationship"] & string
      : never
    : never;

export type RelationshipTargetOf<
  TSlug extends CollectionSlug,
  TKey extends string,
> = /* derived from Doc<TSlug>[TKey]'s Id<T> brand — see Step 1 in spec.md */
  CollectionSlug;

// Result narrowing — Populated<Doc<TSlug>, TPopulate>
export type Populated<
  TDoc,
  TPopulate extends readonly string[],
> = Omit<TDoc, TPopulate[number]> & {
  [K in TPopulate[number] & keyof TDoc]:
    K extends keyof TDoc
      ? TDoc[K] extends ReadonlyArray<infer _>
        ? // K is a relationship field on the parent slug — replace Id[] with Doc[]
          Array<Doc<RelationshipTargetOf<ParentSlugOf<TDoc>, K>>>
        : TDoc[K]
      : TDoc[K];
};
```

```ts
// packages/core/src/api/list.ts
import { convexQuery } from "@convex-dev/react-query";
import { vexConvexApi } from "../convex";
import type { CollectionSlug, Doc, Populated, RelationshipKeysOf } from "../types";

export function listFactory<
  TSlug extends CollectionSlug,
  const TPopulate extends readonly RelationshipKeysOf<TSlug>[] = readonly [],
>(
  slug: TSlug,
  opts?: { populate?: TPopulate; where?: Partial<Doc<TSlug>>; limit?: number },
) {
  return convexQuery(vexConvexApi.list, {
    collection: slug as string,
    populate: opts?.populate as readonly string[] | undefined,
    where: opts?.where,
    limit: opts?.limit,
  }) as ReturnType<typeof convexQuery> & {
    // Type-only assertion: at runtime convexQuery returns the same opaque shape;
    // we override the inferred result type via the queryFn signature.
    __typedResult: ReadonlyArray<Populated<Doc<TSlug>, TPopulate>>;
  };
}

// `vex.find` — exported as part of the `vex` namespace
export const vex = {
  list: listFactory,
  // ... get, create, update, delete, search
};
```

The runtime is a one-line `convexQuery(...)` call. All the magic is types.

---

## What to look for during implementation

Use this checklist when building. If any item fails, the spec is wrong, not the code.

1. **Plain object literals work.** `vex.find({ slug: "posts", populate: { author: true } })` should
   compile without `as const` on the populate object.
2. **Wrong slug = compile error.** `vex.find({ slug: "postz" })` produces a clear error pointing
   at the slug literal.
3. **Wrong populate key = compile error.** `populate: { authr: true }` produces an error
   suggesting `"author"`. Hover over the type shows the valid keys.
4. **Result type narrows.** With `populate: { author: true }`, `result[0].author` is
   `Doc<"authors">[]`, not `Id<"authors">[]` and not a union.
4a. **Nested populate narrows recursively.** `populate: { author: { populate: { organization: true } } }`
   types `result[0].author[0].organization` as `Doc<"organizations">[]`. No artificial depth cap.
4b. **Deep populate scales with actual data, not declared depth.** TypeScript
   refuses ~50 levels of recursion (compile-time, far past anything practical);
   Convex throws if fetched data exceeds 32 MB / 16k doc reads regardless of
   nesting; reactive subscription cost grows with populated-doc count. All
   three are visible to the user; none are punitive on small-data deep queries.
4c. **Isomorphic API works in custom Convex queries.** `vex.find({ ctx,
   slug: "posts", populate: { author: true } })` inside `apps/www/convex/*.ts`
   returns the same type-narrowed result as the client-side `vex.find`. Filter /
   transform the result in the custom query before returning to the client.
5. **Without populate, IDs stay IDs.** No narrowing happens; relationship fields
   are `Id<TargetSlug>[]`.
6. **Mutations type input correctly.** `vex.create({ slug: "posts", data })`
   takes `data: WriteShape<"posts">` — required fields enforced, system fields
   excluded, relationship fields are `Id[]`.
7. **Access checks fire.** With a `posts.access.read` set, a non-authorized user
   gets an empty array (not an error, not the full list). Browser dev console
   shows zero `Permission denied` errors — filtering happens server-side, silently.
8. **Field-level access strips fields.** `internalNotes` is `undefined` for
   non-admins in the result; UI handles gracefully.
9. **Server-side calls work.** `await vex.find({ ctx, slug: "posts", … })` in
   a server component (or Convex action) returns the same shape, runs the same
   access checks against the server session.
10. **Codegen freshness.** After adding a new relationship field, `vex generate`
    must run before the new key appears in `RelationshipKeysOf<TSlug>`. Until
    then, populate references to the new key are compile errors.

---

## What this design intentionally does NOT include

To keep scope narrow:

- **Best-practice docs for populate depth + fanout.** When does populate help
  vs hurt? When should you write a custom Convex query that joins differently
  than `vex.find`? When are reactive subscriptions worth their cost vs
  `useSuspenseQuery`? These are real performance questions but they're
  documentation, not enforced caps. A best-practices doc lands as a follow-up
  once real-world usage data exists. Until then, the natural limits (TS
  recursion ceiling, Convex per-query limits, observable subscription count)
  cover all enforcement.
- **`select` (return only specific fields).** Useful for performance but adds
  another generic dimension to the result type. Defer.
- **GraphQL-style query builders.** Convex queries are functions, not query
  language. Stay imperative.
- **Per-role result type narrowing.** Field-level access produces `T | undefined`
  at runtime; no role-aware type narrowing. Documented limitation.
- **Custom `where` operators (gt, lt, contains).** v0.1.0 supports equality
  matching only. Add operators when the use case lands.

---

## Where this fits in the implementation timeline

This spec lands in the **May 22–28 window** (Week 4 of the v0.1.0 plan, see
`.pi/agent-docs/product/implementation-plan.md` § M-NEW Vex API). It's a
**foundational** dependency for:

- Live Preview (M3) — needs typed query invalidation
- Future hooks system (Phase 4) — `beforeRead`, `afterChange` etc. share the
  access-check pipeline
- Future REST surface (Phase 5) — exposes the same API over HTTP
- Cell rendering of relationship columns in `CollectionListView` — currently
  shows IDs because the cell can't fetch related docs cleanly. With `populate`,
  the list query auto-populates relationship fields and the cell renders the
  preview component against the actual target doc.

---

## Open questions for the implementation spec

These need answers before `spec.md` is drafted:

1. **`select` in the access-check shape** — should access functions receive the
   full doc or a filtered version? Filtered avoids leaking sensitive fields
   into access predicates; full is simpler and matches Payload.
2. **Reactive subscription cost on populated lists** — every populated relationship
   adds a Convex subscription per fetched doc. For 100 posts × 2 populated
   fields, that's 200 subscriptions. Need to evaluate whether `convex-helpers`'
   join utilities batch this internally or if we need our own batching.
3. **`fetchVex` server-side helper** — does it use Convex's HTTP API or the
   server SDK? The latter requires an admin key in env; the former is rate-limited.
4. **Migration from `vexConvexApi.list` to `vex.find` in `@vexcms/react`** —
   call sites in `CollectionListView`, `RelationshipFieldInput`, etc. need to
   migrate. Decide: hard cut at this spec, or coexist for one release?
5. **`limit`/`offset` vs Convex pagination** — Convex prefers cursor-based
   pagination via `paginationOpts`. Should `vex.find` mirror that or offer a
   simpler `limit/offset` interface and translate?

Each becomes a Decision in the implementation spec.

---

## Decisions Reference

> Full rationale for every decision listed in `spec.md` § *Design Decisions*.
> Read this when you need to know **why** a choice was made; the spec table
> gives you the **what** at a glance.

1. **`vex.find` is a typed query factory, not a hook.** Returns the same
   queryOptions shape `convexQuery` returns, so consumers compose with their
   own `useQuery` / `useSuspenseQuery` / `prefetchQuery` calls. No new hook
   abstraction in this spec. Sugar (`useVexQuery`) deferred — call sites are
   already ergonomic without it.

2. ~~**`populate` uses literal-array narrowing via codegen registry.**~~ **Superseded by Decision 11 (2026-05-04).** Original text retained for history: `populate: ["author"]` was an array of literal field keys with `<const TPopulate extends readonly RelationshipKeysOf<TSlug>[]>`. Object notation in Decision 11 is strictly more expressive and supports nesting; switching post-launch would be a breaking change.

3. **Server-side join via `convex-helpers/server/relationships`.** The Convex
   `vexConvexApi.find` query reads `populate` from args, calls `getManyFrom` (or
   the appropriate helper) once per populate field, and shapes the response so
   each post's relationship field is replaced inline with the resolved target
   docs. `convex-helpers` is already in deps. One round trip per list view.

4. **One unified `GeneratedVexTypes` registry, not parallel interfaces.** All
   codegen output is augmented onto the single existing `GeneratedVexTypes`
   interface (which already holds `CollectionSlug` and `DocumentBySlug` as
   properties); the new field-type registry is added as a property called
   `CollectionsFieldTypeMap` keyed `slug → fieldType → fieldKey union`. Top-level
   exports `CollectionSlug`, `DocumentBySlug`, `CollectionsFieldTypeMap` are
   derived from the registry via `GeneratedVexTypes extends { X: infer T } ? T :
<fallback>`. All per-field-type helpers (`RelationshipKeysOf`, `TextKeysOf`,
   `SortableKeysOf`, etc.) derive from `CollectionsFieldTypeMap`. Adding a new
   constraint dimension is a new helper type in core; adding a new generated
   metadata kind is a new property on `GeneratedVexTypes` plus a top-level
   derived export. **Never introduce a parallel augmentation interface like
   `GeneratedFieldTypeMap` or `GeneratedRelationshipMap`** — they fragment the
   registry. One interface, multiple properties.

5. **`CollectionListView` auto-populates all relationship columns.** No opt-in
   flag — the list view inspects the collection's field config, collects every
   relationship field key, and passes them as `populate` to `vex.find`. If a
   collection grows expensive at scale, an opt-out config is a future concern.

6. **`defineCollection.admin.useAsTitle` is fixed via deep generics.** The same
   field-type-map machinery used for `populate` (codegen) is built atop a deep-
   generics version (`FieldKeysByType<TFields, "text">`) for same-call-site
   constraints. `useAsTitle` was previously typed as any field key (compile-passes
   for `useAsTitle: "author"` on a relationship field, breaks at runtime); this
   spec fixes it because the work is adjacent and the fix is small.

7. **`vex` namespace lives in `@vexcms/core/src/api/`, re-exported through
   `@vexcms/react` and `@vexcms/next`.** Same re-export discipline as the
   existing config functions (Decision 15 of spec 22). Users always import from
   `@vexcms/next` (Next apps) or `@vexcms/react` (other React apps).

8. ~~**`vexConvexApi.find` keeps its existing public shape**~~ **Superseded by
   Decision 17 (2026-05-04 rev 2).** `vexConvexApi` becomes internal to
   `@vexcms/core` and is no longer part of the public API surface. The
   `populate` arg shape is additive (optional) at the FunctionReference type
   level, but consumers should use `vex.find` (the typed factory) instead of
   `convexQuery(vexConvexApi.find, …)` directly. Pre-spec-23 call sites in
   `@vexcms/react` (e.g., `useRelationshipPickerOptions`) migrate to `vex.search`
   etc. as part of Step 6.

9. **RBAC is explicitly out of scope.** A later spec (24, TBD) adds collection-
   level + field-level access predicates. The Convex query handler in this
   spec must be **structured** so RBAC can hook in without rewriting — i.e.,
   the populate logic and the (future) access-filter logic are separate
   passes over the docs, not entangled.

10. **`Populated<TDoc, TPopulate>` returns the doc shape with relationship
    fields mapped from `Id<TargetSlug>[]` to `Doc<TargetSlug>[]`.** Not narrowed
    to a single `Doc` for `hasMany: false`; both UI states still serialize as
    arrays per spec 22 D2. The picker UI handles the array-of-1 case.

11. **`populate` uses object notation, not string array.** Replaces Decision 2.
    Shape: `populate?: { [K in RelationshipKeysOf<TSlug>]?: true | { populate?: ... ; ... } }`.
    The `true` form means "populate this field, no further options"; the object
    form means "populate this field WITH options" (currently only `populate` for
    nesting, future-extensible for `select`, `where`, etc.). Object notation is
    strictly more expressive than a string array and matches Prisma's `include`.
    Wrong key still produces a compile error: `populate: { authr: true }` errors
    on `"authr"` as not assignable to `RelationshipKeysOf<"posts">`. Type
    inference uses `<const TPopulate extends Record<string, true | { populate?: … }>>`
    to preserve literal keys.

12. **Nested populate is unbounded — no artificial depth cap.** Three natural
    limits handle deep recursion: (a) TypeScript will refuse "Type instantiation
    is excessively deep" around ~50 levels of conditional-type recursion; (b)
    Convex throws at runtime if actual fetched data exceeds 32 MB / 16k doc reads
    regardless of declared depth; (c) reactive subscription cost grows with
    populated-doc count, visible in Convex dashboard. All three are proportional
    to actual data volume, not to the number of nested keys in the populate
    object — capping by declared depth would punish small-data deep queries
    unfairly. Best-practice docs (when populate helps vs when to write a custom
    query, fanout considerations, realtime-subscription tradeoffs) are a
    follow-up doc, not enforced caps.

13. **Payload-style API naming with discriminated-union args on every function.**
    Each public method has the same name on both client and server; the
    **`ctx` field's presence in the args object discriminates**: when `ctx` is
    absent, you're calling the client factory (returns tanstack-query options);
    when `ctx` is present, you're calling the server-side handler (returns
    docs/result directly). Same join logic, same populate type narrowing,
    same shape. The args object pattern matches Prisma / Drizzle / TanStack
    Query conventions; the `ctx` discriminator preserves the isomorphic
    one-name-two-paths design.

    Names mirror Payload's Local API where it reads naturally; one tweak —
    **`get` instead of Payload's `findByID`** — because Convex's
    `ctx.db.get(id)` accepts an `Id<T>` whose target table is type-branded,
    so `vex.get({ id })` infers the slug from the `Id` type without needing it
    as a separate field. Full naming:
    - `vex.find({ slug, populate?, limit? })` — list with filter/populate
    - `vex.get({ id, populate? })` — single doc; slug recovered from `Id<T>` brand
    - `vex.create({ slug, data })` — insert
    - `vex.update({ id, data })` — patch (partial); slug recovered from `Id<T>`
    - `vex.delete({ id })` — remove; slug recovered from `Id<T>`
    - `vex.search({ slug, query, searchIndexName, searchField, limit? })` — text search
    - `vex.count({ slug, opts? })` — count matching

    Server overloads add `ctx` to the args object. Client returns
    tanstack-query options; server returns the result directly:

    ```ts
    // Client
    useQuery(vex.find({ slug: "posts", populate: { author: true } }));
    useQuery(vex.get({ id: postId, populate: { author: true } }));

    // Server (in a custom Convex query/mutation)
    const posts = await vex.find({
      ctx,
      slug: "posts",
      populate: { author: true },
    });
    const post = await vex.get({ ctx, id: postId });
    ```

    The discriminator is implemented at the type level via paired interfaces:
    client args have `ctx?: never` (forbids ctx); server args have `ctx:
    GenericQueryCtx<DataModel>` (requires ctx). TypeScript narrows the union
    based on whether `ctx` is provided. Wrong shape = compile error:

    ```ts
    useQuery(vex.find({ ctx, slug: "posts" }));   // ❌ client args has ctx?: never
    await vex.find({ slug: "posts" });              // ❌ server args needs ctx
    ```

    The Convex query function `vexConvexApi.find` becomes a 3-line wrapper
    that delegates to the server-shape call. Users can compose any
    `vex.*({ ctx, … })` call in their own custom Convex queries with full
    type narrowing:

    ```ts
    // apps/www/convex/customQueries.ts
    export const featuredPosts = query({
      args: {},
      handler: async (ctx) => {
        const posts = await vex.find({
          ctx,
          slug: "posts",
          populate: { author: true },
        });
        return posts.filter((p) => p.featured);
      },
    });
    ```

    "Local API" pattern, Convex-native. **No `listInQuery` or other
    parallel-named exports — one name per function, two args shapes
    discriminated by `ctx` presence.**

14. **Convex-only architecture; no backend abstraction layer.** This API uses
    Convex types directly (`Id<T>`, `GenericQueryCtx<DataModel>`, `convex/values`),
    `convex-helpers` utilities, and Convex's reactive runtime guarantees
    (internal `ctx.db.get(id)` batching, per-query doc-read deduplication).
    No `interface Backend { find(...) }` indirection, no provider pattern,
    no `vex.find` switching on a runtime backend selector. If/when a second
    backend (Postgres, remote-only) is ever added, refactor at that point —
    don't pre-abstract. Decision encodes this so future PRs don't add
    speculative abstraction layers "just in case."

15. **Full API surface declared in this spec, minimum implementation gated by
    relationship-field needs.** All seven functions (`find`, `get`, `create`,
    `update`, `delete`, `search`, `count`) have their signatures defined here
    — see § _API Surface_ below. The relationship field needs only `find`,
    `get`, and `search` to ship; those are **required** in this spec. The
    remaining four (`create`, `update`, `delete`, `count`) are named here so
    consumers (admin form mutations, custom Convex queries, future REST
    endpoints) know what to expect, but their implementation is **optional**
    in this spec — the implementer can choose to include them if it's a small
    lift, or defer to a follow-up. **Naming and signatures must match this
    spec when implemented; the discipline is "never invent the API at the
    call site, look it up here."**

16. **`@vexcms/core` Convex code uses generic types from `convex/server`, never
    `_generated`; ships query/mutation builders via a factory pattern.** This
    is the convex-helpers pattern (proven across `crud`, `relationships`,
    `customFunctions`, etc.) and is what enables `@vexcms/core` to compile
    cleanly without a connected Convex project, AND lets users adopt vexcms
    without copying any code into their own `apps/*/convex/` directory. Two
    rules:
    - **No `_generated` imports inside `@vexcms/core` (or `@vexcms/cli`).**
      Replace with the generic counterparts from `convex/server`:
      `Doc<TSlug>` → `DocumentByName<DataModel, TSlug>` with `<DataModel extends GenericDataModel>`
      `Id<TSlug>` → `GenericId<TSlug>` from `convex/values`
      `QueryCtx` → `GenericQueryCtx<DataModel>`
      `MutationCtx` → `GenericMutationCtx<DataModel>`
      `query`, `mutation` builders → `internalQueryGeneric`, `internalMutationGeneric`
      from `convex/server` as defaults; accept the user's concrete
      `query`/`mutation` builders as factory parameters for public visibility.
      `as any` is permitted ONLY at the boundary between a generic builder
      default and a registered function output (the convex-helpers idiom);
      every external surface stays precisely typed via
      `RegisteredQuery<…>` / `RegisteredMutation<…>` casts on each return value.

    - **Functions that need to register as Convex queries/mutations ship via
      a factory.** `vexQueries(config, query, mutation)` and
      `vexMutations(config, query, mutation)` accept the user's concrete
      builders and return an object of registered Convex functions. The user's
      `apps/www/convex/vex.ts` is a 6-line re-export:

      ```ts
      import { vexQueries, vexMutations } from "@vexcms/core/convex";
      import { query, mutation } from "./_generated/server";
      import config from "../src/vex.config";

      export const { find, get, search } = vexQueries(config, query, mutation);
      export const {
        create,
        update,
        delete: del,
      } = vexMutations(config, query, mutation);
      ```

      Convex's bundler picks up the `@vexcms/core` import and includes the
      implementation in the user's deployment automatically — no copying.
      Updates to vexcms's Convex code propagate through `npm update`. The
      existing copy at `apps/www/convex/vex/collections.ts` gets DELETED;
      its content moves into the factory in `@vexcms/core`.

17. **`vexConvexApi` is internal to `@vexcms/core`, not part of the public API.**
    The typed `FunctionReference` registry that `vex.find` / `vex.get` /
    `vex.search` use to talk to the user's `convex/vex.ts` re-exports lives at
    `packages/core/src/convex/vexConvexApi.ts` (or similar internal file) and
    is imported by sibling files inside `@vexcms/core` via relative paths. It
    is **not** re-exported from the `@vexcms/core` package barrel — the convex
    barrel uses explicit named exports rather than `export *` to enforce this.
    Public users have `vex.*` (the typed factory) for every legitimate case:
    client queries via `useQuery(vex.find(…))`, server queries inside custom
    Convex functions via the `(ctx, slug, opts)` overload, cache invalidation
    via `vex.find.queryKey(…)`. There's no remaining scenario that requires
    raw `vexConvexApi` access. The cast `anyApi.vex.find as FunctionReference<…>`
    has to live somewhere because `convexQuery` requires a `FunctionReference`;
    we centralize those casts internally rather than inlining them per file,
    matching how convex-helpers organizes its own typed references.

18. **Split client and server into separate files and separate package export
    paths. No combined overloads.** (Added 2026-05-07, rev 4.)

    The original D13 combined client and server behavior in a single function
    using a `TArgs`-generic conditional return type:
    `find<TSlug, TPopulate, TArgs extends ClientArgs | ServerArgs>`.
    This worked at call sites but had a critical production defect: `factory.ts`
    (the Convex server code) imported from `find.ts` which imported
    `@convex-dev/react-query`. Convex's bundler is static — it doesn't
    tree-shake based on runtime control flow — so it tried to bundle
    `@convex-dev/react-query` into the server deployment and failed.

    The fix: split into `find.server.ts` (no react-query import) and
    `find.client.ts` (react-query only). `factory.ts` imports from `.server.ts`;
    the Convex bundler never sees react-query. Both files are exposed via
    dedicated package export paths:

    ```
    @vexcms/core/server  →  src/api/server.ts  (find, get, search — server)
    @vexcms/core/client  →  src/api/client.ts  (find, get, search — client)
    @vexcms/core/convex  →  src/convex/factory.ts  (vexQueries)
    ```

    Users import from the path that matches their environment. Each function
    has one signature and one return type — no conditional type machinery.
    The simpler `TArgs`-generic approach was tried, confirmed to work for
    type narrowing at call sites, but discarded due to the bundler issue.

    Supersedes D13 (the combined-overload discriminated-union pattern).
    D13 is kept for history; the args object shape (`{ ctx, slug, ... }` vs
    `{ slug, ... }`) is unchanged — only the delivery mechanism differs.
