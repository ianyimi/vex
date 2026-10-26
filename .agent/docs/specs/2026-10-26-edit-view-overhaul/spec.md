---
status: draft
spec_id: 2026-10-26-edit-view-overhaul
touches:
  - ".agent/docs/product/v0.1.0-launch-plan.md"
  - ".changeset/admin-collections-route.md"
  - ".changeset/duplicate-document.md"
  - ".changeset/edit-view-slots.md"
  - ".changeset/unsaved-changes-guard.md"
  - "apps/docs/src/content/docs/guides/admin-customization.mdx"
  - "apps/docs/src/content/docs/guides/framework-adapters.md"
  - "apps/test/src/vex.config.ts"
  - "apps/test/src/vexcms/collections/posts.ts"
  - "apps/test/src/vexcms/collections/users.ts"
  - "apps/test/src/vexcms/components/CachePurgeNote.tsx"
  - "apps/test/src/vexcms/components/EditorialChecklist.tsx"
  - "apps/test/src/vexcms/components/EnvironmentBadge.tsx"
  - "apps/test/src/vexcms/components/SaveWithAnalytics.tsx"
  - "apps/test/src/vexcms/globals/siteSettings.ts"
  - "packages/core/src/collections/api/create/server.ts"
  - "packages/core/src/collections/types.ts"
  - "packages/core/src/components/builtinIds.ts"
  - "packages/core/src/components/resolve.test.ts"
  - "packages/core/src/components/resolve.ts"
  - "packages/core/src/components/types.ts"
  - "packages/core/src/config/config.ts"
  - "packages/core/src/config/types.ts"
  - "packages/core/src/documents/cloneDocumentForDuplicate.test.ts"
  - "packages/core/src/documents/cloneDocumentForDuplicate.ts"
  - "packages/core/src/globals/types.ts"
  - "packages/next/package.json"
  - "packages/next/src/NextAdminLayoutClient.tsx"
  - "packages/next/src/NextAdminPage.test.ts"
  - "packages/next/src/NextAdminPage.tsx"
  - "packages/next/src/navigation/index.ts"
  - "packages/next/src/navigation/useNextNavigate.ts"
  - "packages/next/src/navigation/useNextNavigationBlocker.test.ts"
  - "packages/next/src/navigation/useNextNavigationBlocker.ts"
  - "packages/react/src/admin/adminHref.test.ts"
  - "packages/react/src/admin/adminHref.ts"
  - "packages/react/src/collections/CollectionDeleteAction.tsx"
  - "packages/react/src/collections/CollectionDuplicateAction.tsx"
  - "packages/react/src/collections/CollectionEditView.test.tsx"
  - "packages/react/src/collections/CollectionEditView.tsx"
  - "packages/react/src/collections/CreateDocumentForm.tsx"
  - "packages/react/src/collections/CreateDocumentModal.tsx"
  - "packages/react/src/collections/index.ts"
  - "packages/react/src/collections/useDuplicateCollectionDocument.ts"
  - "packages/react/src/config/index.ts"
  - "packages/react/src/config/useFrameworkComponents.ts"
  - "packages/react/src/config/useVexNavigate.test.tsx"
  - "packages/react/src/config/useVexNavigate.ts"
  - "packages/react/src/documents/DocumentEditRuntimeContext.tsx"
  - "packages/react/src/documents/DocumentEditSlotOutlet.test.tsx"
  - "packages/react/src/documents/DocumentEditSlotOutlet.tsx"
  - "packages/react/src/documents/DocumentSaveAction.tsx"
  - "packages/react/src/documents/VexDocumentContext.test.tsx"
  - "packages/react/src/documents/VexDocumentContext.tsx"
  - "packages/react/src/documents/documentEditBuiltinContributions.ts"
  - "packages/react/src/documents/index.ts"
  - "packages/react/src/forms/UnsavedChangesDialog.tsx"
  - "packages/react/src/forms/useUnsavedChangesGuard.test.tsx"
  - "packages/react/src/forms/useUnsavedChangesGuard.ts"
  - "packages/react/src/globals/GlobalEditView.tsx"
  - "packages/react/src/index.ts"
  - "packages/react/src/livePreview/LivePreviewToggleAction.tsx"
  - "packages/react/src/livePreview/index.ts"
  - "packages/react/src/slots/ComponentErrorBoundary.test.tsx"
  - "packages/react/src/slots/ComponentErrorBoundary.tsx"
  - "packages/react/src/slots/SlotOverrideOutlet.test.tsx"
  - "packages/react/src/slots/SlotOverrideOutlet.tsx"
  - "packages/react/src/slots/resolveFieldCellComponent.test.tsx"
  - "packages/react/src/slots/resolveFieldCellComponent.tsx"
  - "packages/react/src/slots/resolveFieldComponent.test.tsx"
  - "packages/react/src/slots/resolveFieldComponent.tsx"
  - "packages/react/src/testing/fieldCellContract.ts"
  - "packages/react/src/versions/DraftToolbar.tsx"
  - "packages/react/src/versions/VersionHistoryAction.tsx"
  - "packages/react/src/versions/VersionPublishAction.tsx"
  - "packages/react/src/versions/VersionUnpublishAction.tsx"
  - "packages/react/src/versions/index.ts"
  - "packages/react/src/versions/useAutosave.test.tsx"
  - "packages/react/src/versions/useAutosave.tsx"
prompt_version: 1
---

# 2026-10-26-edit-view-overhaul — Spec

## Overview

Launch-plan spec **H**. It rebuilds the collection and global edit views on G's slot layer (`6764c26`)
and K's form layer (`f837f20`). Five user-visible changes: an unsaved-changes navigation guard
through the framework adapter; collections move to `/admin/collections/<slug>`; a duplicate-document
action; seven `edit.*` extension slots whose built-in actions are `vex.*` contributions; and the
`useVexDocument` S5 hook. It ships now because I (list view) and the 0.1.0 tag both freeze the admin
URL and slot contracts, and H is the last edit-view change before them.

## Design Decisions

1. **The guard intercepts in-app link clicks, `useVexNavigate` calls, unload, and back/forward.** Why: losing work on a misclick is the worst first impression; covering only some paths still loses work.
2. **`@vexcms/react` defines `navigationBlocker` (link-click and popstate interception) and `useNavigate` (post-mutation navigation) on the framework adapter, and `@vexcms/next` implements both.** Why: a `next/navigation` import in `@vexcms/react` would be the first hard block for the TanStack Start adapter (decided 2026-10-21). Everything clickable stays `VexLink`. `useVexNavigate` exists only because Delete and Duplicate navigate after a mutation resolves, when no link has been clicked.
3. **No `history.pushState` patching. A raw `useRouter().push` from third-party code is not guarded; `useVexNavigate` is the documented path.** Why: Next calls `pushState` from `HistoryUpdater`'s `useInsertionEffect` after the new route commits, and patches `pushState` itself (`next/dist/client/components/app-router.js`), so blocking there is too late. Wrapping `AppRouterContext` would import a Next-internal module.
4. **In-app prompt is a styled Stay / Leave `AlertDialog`; unload uses the browser's native prompt.** Why: browsers forbid custom UI on `beforeunload`. Save & leave was rejected because a failed save mid-navigation adds states for little gain.
5. **The guard blocks when the form is dirty (`!isDefaultValue`), except on autosave docs, where it blocks only while `useAutosave`'s new `hasUnsavedChanges` is true (debounce pending, save in flight, or last save failed).** Why: autosaved work is already persisted. Status alone is not enough: during the debounce window status is `idle`/`saved`, and unmount clears the timer (`useAutosave.tsx`), so keying on `saving`/`error` would lose the last edits.
6. **Built-ins that just saved, deleted or duplicated `release()` the guard before navigating.** Why: no "leave?" prompt right after a successful action.
7. **Collections live at `/admin/collections/<slug>[/<id>]`; `/admin/<slug>` returns 404 with a changelog entry — no redirect.** Why: a clean cutover pre-0.1.0 frees the top-level namespace for plugin and account pages now; a redirect would have to be removed later.
8. **Duplicate first tries a server `create` with the cloned saved document and navigates to the new id.** Why: the common case (no unique conflicts) is one click.
9. **If that create fails, a create modal opens with every field (not just the required ones), prefilled with the clone, and submits immediately.** Why: the conflict can be in any field. The failed submit triggers `AppForm`'s existing `focusFirstFieldError` and tab/collapsible reveal, which scrolls to the exact input to change.
10. **The clone strips only framework fields (`_id`, `_creationTime`, `vex_status`, `vex_publishedAt`, `vex_publishedId`, `vex_activeVersion` via `removeVexFields`, plus `updatedAt`) and regenerates array/block item ids.** Why: no per-field opt-out config surface pre-0.1.0. Unique values copy as-is and are resolved through decision 9.
11. **A duplicated document in a versioned collection is always a draft, via a new optional `status` arg on `create`.** Why: duplicating must never publish anything by accident, and `create` currently hard-codes `versions.defaultStatus`.
12. **Duplicate is offered on non-media collections only (not globals, not media).** Why: globals are singletons; duplicating media re-references one stored file and raises shared-file deletion questions.
13. **Edit slots: `edit.header.actions`, `edit.header.before`, `edit.header.after`, `edit.beforeFields`, `edit.afterFields`, `edit.sidebar.before`, `edit.sidebar.after`, for collections and globals.** Why: the plugin-system stem assigns exactly these to H.
14. **Slot ids, prop types, built-in ids and config keys are declared in `@vexcms/core`; React renders them.** Why: S12, so a future non-React admin reuses the contracts.
15. **Save, Publish, Unpublish, Delete, Duplicate, version history and the live-preview toggle become built-in contributions with `vex.*` ids, all in `edit.header.actions`.** Why: S4 — users and plugins can hide, reorder and wrap them, which shows that built-ins use no private code paths.
16. **`DraftToolbar.tsx` is deleted; `StatusBadge` stays an inline header element.** Why: one flat, reorderable action list replaces the fixed toolbar row.
17. **`vex.delete` is new on the edit view (collections only).** Why: today Delete exists only as a list-view bulk action, and globals have no remove endpoint.
18. **Contributions merge builtins → root → collection/global level, using G's existing ordering (`order`, `before`, `after`, `hidden`), resolved per flat slot id by core `resolveEditSlot`.** Why: S1/S8, the same model as G's block and array slots.
19. **Built-ins are wrapped through `admin.components.edit.header.overrides: { "vex.save": ComponentOverrideInput[] }`, a sibling of `header.actions`.** The key is what is wrapped; each entry's `id` names the wrapper (author-chosen, unique per chain). Array order is composition order (first = outermost), and root wrappers compose outside resource wrappers. Each wrapper receives `renderDefault`. Only `header.actions` carries built-ins, so it is the only slot with an override map. Why: S3/S9 keep additive lists and override chains separate. A `wrap` field on contributions was rejected because it mixes both models in one shape.
20. **An override keyed by an id that isn't in that slot's resolved list (unknown or hidden) is a `VexComponentConfigError`.** Why: a typo in a built-in id would otherwise silently do nothing.
21. **Every override layer, in `SlotOverrideOutlet` and in field input/cell overrides, gets its own `ComponentErrorBoundary` keyed by the override id; on a throw it renders the layer beneath plus an inline error naming the id.** Why: S10 applied to overrides; third-party wrappers must not take down an editor. This deliberately changes G's shipped field-override behavior.
22. **`useVexDocument()` returns `{ kind, slug, id?, saved, isDirty, status?, canEdit }` and no form values.** Why: live values already come from `useVexForm`; adding them here would re-render every consumer on each keystroke. It throws outside its provider.
23. **View-local edit state (viewed version, live-preview panel open, post-publish id repoint) lives in an internal `DocumentEditRuntimeProvider`, not in `useVexDocument`.** Why: built-ins need it, and the public hook stays minimal per decision 22.
24. **`useVexPermissions` is reused as is.** Why: it already exists as the S5 permission hook (`access/useVexPermissions.ts`).
25. **No document-level error summary banner.** Why: jump-to-first-error already ships (`forms/AppForm.tsx` `focusFirstFieldError`, `fields/tabs/Field.tsx` errored-tab reveal). The brief's item is covered.

## Out of Scope

- Concurrent-edit conflict resolution (`backlog.md`, own spec).
- Server-component slots (S14: slots are client-only in 0.1.0).
- `list.*` slots (I) and shell/nav slots (Track PL).
- The TanStack Start adapter implementation. H defines the contract and the Next implementation only.
- Guarding raw `next/navigation` router calls made outside `useVexNavigate`.
- A per-field duplicate opt-out (`admin.disableDuplicate` or similar).
- A document-level error summary banner.
- Redirects from old `/admin/<slug>` URLs.
- Duplicating globals or media documents.

## Implementation

### Step 1 — Collections move to `/admin/collections/<slug>` [agent]

- [ ] `packages/react/src/admin/adminHref.ts`: `"collection"`, `"document"` and `"create"` targets emit `/<base>/collections/<slug>[/<id>]`
- [ ] `packages/react/src/admin/adminHref.test.ts`: assertions updated for the new collection URL shape
- [ ] `packages/next/src/NextAdminPage.tsx`: parse `["collections", slug, id?]` / `["globals", slug]`; any other first path segment calls `notFound()`
- [ ] `packages/next/src/NextAdminPage.test.ts`: fixtures updated to `collections/<slug>[/<id>]`; new case asserts `notFound()` on an unrecognized first segment
- [ ] `packages/react/src/testing/fieldCellContract.ts`: the title-link assertion expects `/admin/collections/<slug>/<id>`
- [ ] `.changeset/admin-collections-route.md`: breaking, old URLs 404

#### packages/react/src/admin/adminHref.ts

5 edits; everything not shown is unchanged.

**1 — the function's doc comment (`@param`/`@returns` text and the paragraph above them) now describes the landed shape instead of a pending one.**

```ts
/**
 * Builds an admin panel URL from a target and the project's configured
 * `basePath` — the one place every admin link in `@vexcms/react` (and, via
 * re-export, `@vexcms/next`) computes a path. Replaces 30 hand-built
 * `` `${basePath}/...` `` / hardcoded `"/admin/..."` call sites across the
 * nav, breadcrumb, dashboard, list views, and all 16 field types' `Cell.tsx`
 * title links (Step 17 audit finding 7) — grep for `adminHref(` to confirm
 * no hand-built admin URL remains outside this file.
 *
 * Collection targets resolve under `/collections/` —
 * `/{basePath}/collections/{slug}`, `/{basePath}/collections/{slug}/{id}` —
 * and `/{basePath}/{slug}` 404s (launch spec H, no redirect). Global targets
 * are unchanged: `/{basePath}/globals/{slug}`. The route parser
 * `NextAdminPage.tsx` reads these same two first-segment shapes
 * (`collections/<slug>[/<id>]`, `globals/<slug>`) and `notFound()`s on
 * anything else — a separate, pre-existing concern this function does not
 * touch.
 *
 * @param target - What the link points at.
 * @param basePath - The project's configured `VexClientConfig.basePath`
 *   (e.g. `config.basePath`), leading-slash-normalized internally via
 *   `addLeadingSlash` the same way every replaced call site already did.
 * @returns The absolute admin panel path for `target`.
 *
 * @example
 * ```ts
 * adminHref({ type: "dashboard" }, "/admin");                          // "/admin"
 * adminHref({ type: "collection", slug: "posts" }, "/admin");          // "/admin/collections/posts"
 * adminHref({ type: "global", slug: "siteSettings" }, "/admin");       // "/admin/globals/siteSettings"
 * adminHref({ type: "document", slug: "posts", id: "abc" }, "/admin"); // "/admin/collections/posts/abc"
 * adminHref({ type: "create", slug: "posts" }, "/admin");              // "/admin/collections/posts?createNew=true"
 * ```
 */
```

**2 — `"collection"` case in `adminHref`'s `switch`.**

```ts
    case "collection":
      return `${root}/collections/${target.slug}`;
```

**3 — `"document"` case.**

```ts
    case "document":
      return `${root}/collections/${target.slug}/${target.id}`;
```

**4 — `"create"` case.**

```ts
    case "create":
      return `${root}/collections/${target.slug}?${MODALS.createDocument.urlParam}=true`;
```

**5 — none.** (Cases above are listed separately only because they sit apart in the `switch`; no further lines change.)

#### packages/react/src/admin/adminHref.test.ts

3 edits; everything not shown is unchanged.

**1 — "builds a collection list URL".**

```ts
  it("builds a collection list URL", () => {
    expect(adminHref({ type: "collection", slug: "posts" }, "/admin")).toBe(
      "/admin/collections/posts",
    );
  });
```

**2 — "builds a document edit URL".**

```ts
  it("builds a document edit URL", () => {
    expect(
      adminHref({ type: "document", slug: "posts", id: "abc123" }, "/admin"),
    ).toBe("/admin/collections/posts/abc123");
  });
```

**3 — "builds a create-modal URL, reusing MODALS.createDocument's own urlParam", "normalizes a basePath without a leading slash, matching addLeadingSlash" and "supports a custom basePath".**

```ts
  it("builds a create-modal URL, reusing MODALS.createDocument's own urlParam", () => {
    expect(adminHref({ type: "create", slug: "posts" }, "/admin")).toBe(
      `/admin/collections/posts?${MODALS.createDocument.urlParam}=true`,
    );
  });

  it("normalizes a basePath without a leading slash, matching addLeadingSlash", () => {
    expect(adminHref({ type: "collection", slug: "posts" }, "admin")).toBe(
      "/admin/collections/posts",
    );
  });

  it("supports a custom basePath", () => {
    expect(adminHref({ type: "collection", slug: "posts" }, "/cms")).toBe(
      "/cms/collections/posts",
    );
  });
```

#### packages/next/src/NextAdminPage.tsx

3 edits; everything not shown is unchanged.

**1 — import `notFound` alongside the existing `cookies` import.**

```ts
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
```

**2 — the top of `NextAdminPage`, from `const { path = [] } = await props.params;` through `if (collectionSlug === "globals") {`, now parses the `collections/<slug>[/<id>]` and `globals/<slug>` shapes and rejects anything else. Everything from the globals branch's own body (`if (!documentId) { return <GlobalsListView /> }` onward) is unchanged — only the destructuring and the guard above it change.**

```ts
  const { path = [] } = await props.params;
  const [section, collectionSlug, documentId] = path;
  const cookieStore = await cookies();

  if (path.length === 0) {
    return <DashboardView />;
  }

  if (section !== "collections" && section !== "globals") {
    notFound();
  }

  if (section === "globals") {
    if (!collectionSlug) {
      return <GlobalsListView />;
    }
```

**3 — the collection branch now requires a slug after `collections/`; the body below (`const collection = props.config.collections.find(...)` onward, through the final `return <CollectionListView ... />`) is unchanged.**

```ts
  if (!collectionSlug) {
    notFound();
  }

  const collection = props.config.collections.find((c) => c.slug === collectionSlug);
```

#### packages/next/src/NextAdminPage.test.ts

3 edits; everything not shown is unchanged.

**1 — `render`'s `path` arguments throughout the `describe` block switch to the `collections/<slug>[/<id>]` shape.**

```ts
  it("list page of a versioned collection prefetches with drafts: true (CollectionListView)", async () => {
    fetchQueryMock.mockResolvedValue({ page: [], isDone: true, continueCursor: "" });
    await render(["collections", "posts"]);
    expect(prefetchArgs(vexConvexApi.findPaginated)).toMatchObject({ collection: "posts", drafts: true, depth: 1 });
  });

  it("list page of a non-versioned collection prefetches without drafts", async () => {
    fetchQueryMock.mockResolvedValue({ page: [], isDone: true, continueCursor: "" });
    await render(["collections", "pages"]);
    expect(prefetchArgs(vexConvexApi.findPaginated)?.drafts).toBeUndefined();
  });

  it("edit page of a versioned collection prefetches with drafts: true (CollectionEditView)", async () => {
    await render(["collections", "posts", "doc1"]);
    expect(prefetchArgs(vexConvexApi.get)).toEqual({ id: "doc1", collection: "posts", drafts: true });
  });

  it("edit page of a non-versioned collection prefetches with drafts: false (CollectionEditView sends versions.drafts)", async () => {
    await render(["collections", "pages", "doc1"]);
    expect(prefetchArgs(vexConvexApi.get)).toEqual({ id: "doc1", collection: "pages", drafts: false });
  });
```

`["globals", "banner"]` in the remaining case is unchanged — `globals/<slug>` already matched the old shape.

**2 — mock `next/navigation`'s `notFound` so the new reject path is observable, added beside the existing `vi.mock("convex/nextjs", ...)` / `vi.mock("next/headers", ...)` calls.**

```ts
const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
```

**3 — a new `describe` block asserting the first-segment guard, added after the existing `describe("NextAdminPage — prefetch args match the view's client query", ...)` block closes.**

```ts
describe("NextAdminPage — unrecognized first path segment", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    fetchQueryMock.mockReset().mockResolvedValue(null);
  });

  it("calls notFound() for a bare collection slug (old /admin/<slug> shape)", async () => {
    await expect(render(["posts"])).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("calls notFound() for collections/ with no slug", async () => {
    await expect(render(["collections"])).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });

  it("calls notFound() for an unknown first segment", async () => {
    await expect(render(["nonsense", "posts"])).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalledOnce();
  });
});
```

#### packages/react/src/testing/fieldCellContract.ts

1 edit; everything not shown is unchanged.

**1 — the doc comment's reference href and the matching assertion in `"wraps the value in an edit link to the document when isTitleField is true"`.**

```ts
 * 2. When `isTitleField` is `true`, wraps the rendered value in a link to
 *    `${addLeadingSlash(config.basePath)}/collections/${collection.slug}/${row.original._id}`.
 *    Reference: `text/Cell.tsx:27-34`, via `adminHref({ type: "document", ... })`.
 *    `useVexConfig()` throws with no provider mounted, so `renderCell` wraps
 *    every render in {@link withCellConfig} ({@link stubCellConfig}'s
 *    `defineConfig()` default `basePath: "/admin"`), and the expected href is
 *    computed the same way here.
```

```ts
    it("wraps the value in an edit link to the document when isTitleField is true", () => {
      const { container } = renderCell({ value: fixture.valid, isTitleField: true, id: TITLE_ROW_ID });
      const link = container.querySelector("a");
      expect(link).not.toBeNull();
      expect(link?.getAttribute("href")).toBe(`/admin/collections/${collection.slug}/${TITLE_ROW_ID}`);
    });
```

#### .changeset/admin-collections-route.md

> Note: `spec-tasks.md`'s `touches` lists only `.changeset/**`, not a per-package
> breakdown; bump levels below follow this repo's existing convention (all
> breaking and feature changesets ship `patch` — see `.changeset/versioning-and-drafts.md`
> — because every `@vexcms/*` package is pinned to the same pre-1.0
> `0.1.0-alpha.x` line via `.changeset/config.json`'s `fixed` group).

```md
---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/next": patch
---

**Breaking: collection admin URLs moved to `/admin/collections/<slug>`.**
`/admin/<slug>` and `/admin/<slug>/<id>` now 404 — there is no redirect.
Global URLs (`/admin/globals/<slug>`) and the dashboard (`/admin`) are
unchanged.

Every in-app link (`adminHref`, sidebar, dashboard cards, globals list, every
field type's title-column `Cell.tsx`) already resolved through `adminHref` or
`NextAdminPage`'s own route parser, so this is a one-file change in each
package: `adminHref.ts`'s `"collection"`, `"document"` and `"create"` targets
now emit the `/collections/` prefix, and `NextAdminPage` now requires a
`collections/<slug>[/<id>]` or `globals/<slug>` first segment, `notFound()`ing
on anything else.

If you bookmarked or hand-built an admin collection URL outside this package
(a custom nav, an email link, a saved browser bookmark), update it to the new
`/admin/collections/<slug>` shape.
```

Verify: pnpm typecheck && pnpm --filter @vexcms/react test -- adminHref && pnpm --filter @vexcms/next test -- NextAdminPage; in the browser, `/admin/collections/posts` renders and `/admin/posts` returns 404

### Step 2 — Core edit-view slot model [dev]

- [ ] `packages/core/src/components/types.ts`
- [ ] `packages/core/src/components/builtinIds.ts`
- [ ] `packages/core/src/components/resolve.ts`
- [ ] `packages/core/src/components/resolve.test.ts`
- [ ] `packages/core/src/config/types.ts`
- [ ] `packages/core/src/config/config.ts`
- [ ] `packages/core/src/collections/types.ts`
- [ ] `packages/core/src/globals/types.ts`

#### packages/core/src/components/types.ts

3 edits; everything not shown is unchanged.

**1 — `SLOT_IDS`.** Beside the existing `array` key, add H's seven edit-view slots (decision 11).

```ts
  edit: {
    /** Additive contributions in an edit view's header action bar. Built-ins: save, publish, unpublish, delete, duplicate, version history, live preview (decisions 11/13). */
    headerActions: "edit.header.actions",
    /** Additive contributions rendered before an edit view's header. No built-ins. */
    headerBefore: "edit.header.before",
    /** Additive contributions rendered after an edit view's header. No built-ins. */
    headerAfter: "edit.header.after",
    /** Additive contributions rendered before an edit view's field list. No built-ins. */
    beforeFields: "edit.beforeFields",
    /** Additive contributions rendered after an edit view's field list. No built-ins. */
    afterFields: "edit.afterFields",
    /** Additive contributions rendered before an edit view's sidebar content. No built-ins. */
    sidebarBefore: "edit.sidebar.before",
    /** Additive contributions rendered after an edit view's sidebar content. No built-ins. */
    sidebarAfter: "edit.sidebar.after",
  },
```

**2 — `SlotId` union.** Add the edit group so a flat `edit.*` id type-checks everywhere `SlotId` is accepted (e.g. `resolveComponentContributions`'s `slotId` param).

```ts
export type SlotId =
  | (typeof SLOT_IDS.field)[keyof typeof SLOT_IDS.field]
  | (typeof SLOT_IDS.blocks)[keyof typeof SLOT_IDS.blocks]
  | (typeof SLOT_IDS.array)[keyof typeof SLOT_IDS.array]
  | (typeof SLOT_IDS.edit)[keyof typeof SLOT_IDS.edit];
```

**3 — New types.** After `ResolvedComponentOverride`, before `VexComponentConfigError`, add the edit-slot prop type, `resolveEditSlot`'s per-call-site input shape, and the two grouped config shapes `@vexcms/core`'s own `AdminComponentsInput`/`AdminCollectionConfigInput`/`GlobalAdminConfigInput` store (decision 12).

```ts
/**
 * Props every `edit.*` slot's resolved component receives (decisions 11/12) — which
 * collection or global the mounted edit view is showing.
 */
export interface EditSlotProps {
  /** Whether the edit view belongs to a collection document or a global's singleton document. */
  kind: "collection" | "global";
  /** Collection or global slug. */
  slug: string;
}

/**
 * One `edit.*` slot's raw, unresolved configuration at ONE level (root or collection/global) —
 * the additive contribution list plus the built-in-wrapping override map (decision 15). This is
 * {@link resolveEditSlot}'s `root`/`resource` param shape; `@vexcms/core`'s `defineConfig`,
 * `defineCollection` and `defineGlobal` pass their stored config through UNRESOLVED (decision
 * 14's root→resource merge happens per flat slot id, in `resolveEditSlot`, since built-in
 * contributions are framework- and `kind`-specific and core has neither).
 *
 * @typeParam TComponent - The framework's `ComponentHKT`.
 */
export interface EditSlotConfigInput<TComponent extends ComponentHKT = ComponentHKT> {
  /** This level's additive contributions for the slot. */
  contributions?: ComponentContributionInput<TComponent, EditSlotProps>[];
  /** This level's override chains, keyed by the built-in id each chain wraps (decision 15/16). */
  overrides?: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
}

/**
 * The `edit.*` slot config one collection, one global, or the project root declares — grouped
 * by UI region to match {@link SLOT_IDS.edit} (decision 11). `header.overrides` wraps a built-in
 * from `header.actions` by id (decision 15); `beforeFields`/`afterFields`/`sidebar.*` carry no
 * built-ins, so they have no override map. A renderer calls {@link resolveEditSlot} once PER
 * FLAT slot id, passing the matching array (plus `header.overrides` only for
 * `SLOT_IDS.edit.headerActions`) as `root`/`resource`.
 *
 * @typeParam TComponent - The framework's `ComponentHKT`.
 */
export interface EditComponentsConfigInput<TComponent extends ComponentHKT = ComponentHKT> {
  header?: {
    actions?: ComponentContributionInput<TComponent, EditSlotProps>[];
    before?: ComponentContributionInput<TComponent, EditSlotProps>[];
    after?: ComponentContributionInput<TComponent, EditSlotProps>[];
    overrides?: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
  };
  beforeFields?: ComponentContributionInput<TComponent, EditSlotProps>[];
  afterFields?: ComponentContributionInput<TComponent, EditSlotProps>[];
  sidebar?: {
    before?: ComponentContributionInput<TComponent, EditSlotProps>[];
    after?: ComponentContributionInput<TComponent, EditSlotProps>[];
  };
}

/**
 * Root-level `edit.*` slot config after `defineConfig()` applies defaults — every array and the
 * override map always present. Collection/global-level config ({@link EditComponentsConfigInput})
 * is NOT defaulted this way; `resolveEditSlot` owns those defaults at render time, mirroring how
 * `AdminCollectionConfig.livePreview` is passed through unresolved.
 *
 * @typeParam TComponent - The framework's `ComponentHKT`.
 */
export interface EditComponentsConfig<TComponent extends ComponentHKT = ComponentHKT> {
  header: {
    actions: ComponentContributionInput<TComponent, EditSlotProps>[];
    before: ComponentContributionInput<TComponent, EditSlotProps>[];
    after: ComponentContributionInput<TComponent, EditSlotProps>[];
    overrides: Record<string, ComponentOverrideInput<TComponent, EditSlotProps>[]>;
  };
  beforeFields: ComponentContributionInput<TComponent, EditSlotProps>[];
  afterFields: ComponentContributionInput<TComponent, EditSlotProps>[];
  sidebar: {
    before: ComponentContributionInput<TComponent, EditSlotProps>[];
    after: ComponentContributionInput<TComponent, EditSlotProps>[];
  };
}
```

#### packages/core/src/components/builtinIds.ts

1 edit; everything not shown is unchanged.

**1 — `BUILTIN_CONTRIBUTION_IDS`.** Beside the existing `array` key, add H's seven edit built-ins (decision 13).

```ts
  edit: {
    save: "vex.save",
    publish: "vex.publish",
    unpublish: "vex.unpublish",
    delete: "vex.delete",
    duplicate: "vex.duplicate",
    versionHistory: "vex.versionHistory",
    livePreview: "vex.livePreview",
  },
```

#### packages/core/src/components/resolve.ts

2 edits; everything not shown is unchanged.

**1 — imports.** Add the two new edit-slot types to the existing `./types` import.

```ts
import {
  VexComponentConfigError,
  type ComponentContributionInput,
  type ComponentHKT,
  type ComponentOverrideInput,
  type EditSlotConfigInput,
  type EditSlotProps,
  type ResolvedComponentContribution,
  type ResolvedComponentOverride,
  type SlotId,
} from "./types";
```

**2 — `resolveEditSlot`.** After `resolveComponentOverrides`, add the merge H's edit slots use — root then resource additive lists seeded with built-ins, ordered by `resolveComponentContributions`; root then resource override chains merged per built-in id and ordered by `resolveComponentOverrides`; then a new cross-check (G's two functions don't do this) that every override key names a surviving contribution id.

```ts
/**
 * Resolves ONE flat `edit.*` slot id by merging built-ins, then the root-level config, then the
 * collection/global-level config (decision 14 — G's existing root→resource merge model, reused
 * for H's slots). Built-ins seed the additive list first so a project can hide one with
 * `{ id: "vex.save", hidden: true }` at either level, and `order`/`before`/`after` reorder
 * freely from there — only array position (among same-`order` entries) reflects the
 * builtins-then-root-then-resource merge order.
 *
 * Override chains merge per built-in id: root's chain composes first (outermost, decision 15),
 * the resource's chain's entries follow. Every resolved override key must name the id of a
 * contribution that survived into the resolved `contributions` list — the renderer cannot wrap
 * a built-in a hide directive already removed, or a plugin id that was never contributed here.
 *
 * @throws {VexComponentConfigError} From `resolveComponentContributions` on a genuine duplicate
 *   contribution id; from `resolveComponentOverrides` on a duplicate override id within one
 *   built-in's merged chain; or when an override key names an id absent from the resolved
 *   `contributions` list (decision 16).
 * @returns The slot's final ordered contributions, and its overrides keyed by built-in id.
 */
export function resolveEditSlot<TComponent extends ComponentHKT>(props: {
  slotId: SlotId;
  root?: EditSlotConfigInput<TComponent>;
  resource?: EditSlotConfigInput<TComponent>;
  builtins: ComponentContributionInput<TComponent, EditSlotProps>[];
}): {
  contributions: ResolvedComponentContribution<TComponent, EditSlotProps>[];
  overrides: Record<string, ResolvedComponentOverride<TComponent, EditSlotProps>[]>;
} {
  // 1. mergedContributions = [...props.builtins, ...(props.root?.contributions ?? []),
  //    ...(props.resource?.contributions ?? [])]
  // 2. contributions = resolveComponentContributions({ slotId: props.slotId, contributions: mergedContributions })
  //    → final ordered, deduped, hide-applied list for this slot
  // 3. contributionIds = new Set(contributions.map((c) => c.id))
  // 4. mergedOverrideKeys = union of keys in (props.root?.overrides ?? {}) and (props.resource?.overrides ?? {})
  // 5. For each key in mergedOverrideKeys:
  //    a. chain = [...(props.root?.overrides?.[key] ?? []), ...(props.resource?.overrides?.[key] ?? [])]
  //       → root's entries compose first (outermost), resource's layer closer to the built-in
  //    b. resolvedChain = resolveComponentOverrides({ slotId: props.slotId, overrides: chain })
  //       → throws VexComponentConfigError on a duplicate override id within this one chain
  //    c. if (!contributionIds.has(key)) → throw new VexComponentConfigError(
  //         `Slot "${props.slotId}": override targets unknown contribution id "${key}" — it was hidden or never contributed.`)
  //    d. overrides[key] = resolvedChain
  // 6. → { contributions, overrides }
  // Edge cases:
  // - Neither root nor resource configures this slot → contributions is builtins-only (still
  //   resolved through step 2, so a builtins-level duplicate id still throws), overrides is {}.
  // - A built-in hidden at root and still targeted by a resource-level override under the same
  //   id → step 5c throws, since the hidden id never reaches `contributionIds`.
  // - `props.builtins` is empty (`beforeFields`/`afterFields`/`sidebar.*`, which ship no
  //   built-ins) → any override key supplied for this slot always throws per step 5c, since
  //   nothing can ever populate `contributionIds` to match it.
  throw new Error("Not implemented");
}
```

#### packages/core/src/components/resolve.test.ts

2 edits; everything not shown is unchanged.

**1 — imports.** Add `resolveEditSlot` to the existing `./resolve` import.

```ts
import {
  resolveComponentContributions,
  resolveComponentOverrides,
  resolveEditSlot,
  VexComponentConfigError,
} from "./resolve";
```

**2 — new `describe` block.** After the `resolveComponentOverrides` block closes, add:

```ts
describe("resolveEditSlot", () => {
  it("merges builtins, then root, then resource contributions in that array order when no order/before/after is set", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.save", component: comp }],
      root: { contributions: [{ id: "acme.rootAction", component: comp }] },
      resource: { contributions: [{ id: "acme.resourceAction", component: comp }] },
    });
    expect(result.contributions.map((c) => c.id)).toEqual([
      "vex.save",
      "acme.rootAction",
      "acme.resourceAction",
    ]);
    expect(result.overrides).toEqual({});
  });

  it("sorts merged contributions by order across builtin, root and resource levels, ties broken by merge position", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.save", component: comp, order: 10 }],
      root: { contributions: [{ id: "acme.rootAction", component: comp, order: 0 }] },
      resource: { contributions: [{ id: "acme.resourceAction", component: comp, order: 0 }] },
    });
    expect(result.contributions.map((c) => c.id)).toEqual([
      "acme.rootAction",
      "acme.resourceAction",
      "vex.save",
    ]);
  });

  it("a resource-level hide directive drops a built-in by id", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.duplicate", component: comp }],
      root: {},
      resource: { contributions: [{ id: "vex.duplicate", hidden: true }] },
    });
    expect(result.contributions).toEqual([]);
  });

  it("merges root then resource override chains for the same built-in id, root entries first", () => {
    const result = resolveEditSlot({
      slotId: "edit.header.actions",
      builtins: [{ id: "vex.save", component: comp }],
      root: { overrides: { "vex.save": [{ id: "acme.rootWrap", component: comp }] } },
      resource: { overrides: { "vex.save": [{ id: "acme.resourceWrap", component: comp }] } },
    });
    expect(result.overrides["vex.save"]?.map((o) => o.id)).toEqual([
      "acme.rootWrap",
      "acme.resourceWrap",
    ]);
  });

  it("throws VexComponentConfigError when an override is keyed to an id that isn't in the slot's resolved contributions", () => {
    expect(() =>
      resolveEditSlot({
        slotId: "edit.header.actions",
        builtins: [{ id: "vex.save", component: comp }],
        root: { overrides: { "vex.save": [{ id: "acme.wrap", component: comp }] } },
        resource: { contributions: [{ id: "vex.save", hidden: true }] },
      }),
    ).toThrow(VexComponentConfigError);
  });

  it("throws VexComponentConfigError when a duplicate override id appears across root and resource chains for one built-in", () => {
    expect(() =>
      resolveEditSlot({
        slotId: "edit.header.actions",
        builtins: [{ id: "vex.save", component: comp }],
        root: { overrides: { "vex.save": [{ id: "acme.wrap", component: comp }] } },
        resource: { overrides: { "vex.save": [{ id: "acme.wrap", component: comp }] } },
      }),
    ).toThrow(VexComponentConfigError);
  });

  it("returns builtins-only contributions and no overrides when neither level configures the slot", () => {
    const result = resolveEditSlot({
      slotId: "edit.beforeFields",
      builtins: [],
    });
    expect(result).toEqual({ contributions: [], overrides: {} });
  });
});
```

#### packages/core/src/config/types.ts

3 edits; everything not shown is unchanged.

**1 — imports.** Add the two grouped edit-slot config types to the existing `../components/types` import.

```ts
import type {
  ComponentContributionInput,
  ComponentOverrideInput,
  ComponentHKT,
  EditComponentsConfig,
  EditComponentsConfigInput,
} from "../components/types";
```

**2 — `AdminComponentsInput`.** Beside the existing `array?` field, add the root-level edit-slot config (decision 11/12).

```ts
  /** `edit.*` slot defaults, project-wide (decision 11) — merged with each collection/global's own config by `resolveEditSlot` at render time. */
  edit?: EditComponentsConfigInput<ComponentHKT>;
```

**3 — `AdminConfig.components`.** Beside the existing `array` field, add the resolved, defaulted root-level edit-slot config.

```ts
    edit: EditComponentsConfig<ComponentHKT>;
```

#### packages/core/src/config/config.ts

1 edit; everything not shown is unchanged.

**1 — `components` block in `defineConfig`.** Beside the existing `array: { itemActions: resolveComponentContributions({ ... }) }` entry, add root-level edit-slot defaults. Unlike `fields`/`blocks`/`array`, this is NOT run through `resolveComponentContributions`/`resolveComponentOverrides` here — H's built-ins are React components and `kind`-dependent (decision 10), which core cannot supply, so only empty-array/empty-map defaults are applied; `resolveEditSlot` (this step) does the real merge, per flat slot id, at render time.

```ts
        edit: {
          header: {
            actions: config?.admin?.components?.edit?.header?.actions ?? [],
            before: config?.admin?.components?.edit?.header?.before ?? [],
            after: config?.admin?.components?.edit?.header?.after ?? [],
            overrides: config?.admin?.components?.edit?.header?.overrides ?? {},
          },
          beforeFields: config?.admin?.components?.edit?.beforeFields ?? [],
          afterFields: config?.admin?.components?.edit?.afterFields ?? [],
          sidebar: {
            before: config?.admin?.components?.edit?.sidebar?.before ?? [],
            after: config?.admin?.components?.edit?.sidebar?.after ?? [],
          },
        },
```

#### packages/core/src/collections/types.ts

3 edits; everything not shown is unchanged.

**1 — imports.** Add `EditComponentsConfigInput` to the existing `../components/types` import.

```ts
import type { ComponentHKT, EditComponentsConfigInput } from "../components/types";
```

**2 — `AdminCollectionConfigInput`.** Rename the unused `_TComponent` type param to `TComponent` (it is now used in the body), and add the collection-level edit-slot config after `livePreview?`.

```ts
export interface AdminCollectionConfigInput<
  TFieldSlug extends string = ConvexSystemField,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
```

```ts
  /** Collection-level `edit.*` slot contributions and built-in overrides (decision 11/14) — merged with the project-wide config of the same shape by `resolveEditSlot` at render time. */
  components?: {
    edit?: EditComponentsConfigInput<TComponent>;
  };
```

**3 — `AdminCollectionConfig`.** Same param rename on the resolved type, and the same addition — passed through unresolved, mirroring how `livePreview` is left for `resolveLivePreviewSettings` to default.

```ts
export interface AdminCollectionConfig<
  TFieldSlug extends string = ConvexSystemField,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> {
```

```ts
  /** Collection-level `edit.*` slot contributions and built-in overrides, passed through unresolved — `resolveEditSlot` applies every default when assembling one flat slot id at render time. */
  components?: {
    edit?: EditComponentsConfigInput<TComponent>;
  };
```

#### packages/core/src/globals/types.ts

3 edits; everything not shown is unchanged.

**1 — imports.** Add `EditComponentsConfigInput` to the existing `../components/types` import.

```ts
import type { ApplyComponent, ComponentHKT, EditComponentsConfigInput } from "../components/types";
```

**2 — `GlobalAdminConfigInput.components`.** Beside the existing `preview?` field, add the global-level edit-slot config.

```ts
  components?: {
    preview?: ApplyComponent<TComponent, { slug: string }>;
    /** Global-level `edit.*` slot contributions and built-in overrides (decision 11/14) — merged with the project-wide config of the same shape by `resolveEditSlot` at render time. */
    edit?: EditComponentsConfigInput<TComponent>;
  };
```

**3 — `GlobalAdminConfig.components`.** Same addition on the resolved type (globals already default `components` to `{}` in `defineGlobal`; `edit` stays optional and unresolved within it, same as collections).

```ts
  components: {
    preview?: ApplyComponent<TComponent, { slug: string }>;
    /** Global-level `edit.*` slot contributions and built-in overrides, passed through unresolved — mirrors `AdminCollectionConfig.components.edit`. */
    edit?: EditComponentsConfigInput<TComponent>;
  };
```

Verify: pnpm typecheck && pnpm --filter @vexcms/core test -- components config

### Step 3 — `useVexDocument` + document context [dev]

> Note: `packages/react/src/documents/` does not exist yet, but it follows K's one-domain-folder-per-concern
> convention (`access/`, `forms/`, `versions/`, `config/`, each with its own `index.ts`), so the path from
> `spec-tasks.md` is kept as-is.

- [ ] `packages/react/src/documents/VexDocumentContext.tsx` + `VexDocumentContext.test.tsx`: `VexDocumentState` type, `VexDocumentContext`, `VexDocumentProvider`, `useVexDocument` — throws outside the provider
- [ ] `packages/react/src/documents/index.ts`: barrel for the file above
- [ ] Export `VexDocumentProvider`, `useVexDocument` and `VexDocumentState` from the package barrel (`packages/react/src/index.ts`), alongside `useVexPermissions`

#### packages/react/src/documents/VexDocumentContext.tsx

New file.

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * The S5 document-context shape every edit-view slot contribution reads via
 * `useVexDocument()`. Deliberately excludes live, per-keystroke form values —
 * those come from `useVexForm` so a contribution that only needs `isDirty` or
 * `canEdit` doesn't re-render on every field change.
 */
export type VexDocumentState = {
  /** Whether the document belongs to a collection or a global. */
  kind: "collection" | "global";
  /** The collection or global slug. */
  slug: string;
  /** The document id. Absent on a collection's "create new" route. */
  id?: string;
  /**
   * The last-saved document, as returned by the server. `undefined` before
   * the initial load resolves (or on a collection's "create new" route).
   */
  saved: Record<string, unknown> | undefined;
  /** Whether the mounted form currently differs from `saved`. */
  isDirty: boolean;
  /**
   * The document's publish status, for a versioned collection or global.
   * Mirrors core's `VERSION_STATUSES` keys (`packages/core/src/versions/constants.ts`).
   * Absent when the collection/global isn't versioned.
   */
  status?: "draft" | "published";
  /** Whether the current user can edit this document (`useVexPermissions().hasPermission`). */
  canEdit: boolean;
};

/**
 * Holds the current edit view's document state for the subtree it wraps —
 * the single provenance `useVexDocument()` reads from. Default value is
 * `null`, so a consumer rendered outside any provider gets a clear thrown
 * error instead of a silently stale document.
 */
export const VexDocumentContext = createContext<VexDocumentState | null>(null);

/**
 * Mounts `VexDocumentContext` for the subtree it wraps. `CollectionEditView`
 * and `GlobalEditView` (step 4) are the only callers — each recomputes
 * `VexDocumentState` from its own loaded document, form and permission state
 * and wraps its seven `SlotOutlet`s with this provider.
 *
 * @param props - The resolved document state to provide, and the subtree that consumes it.
 * @returns The context provider wrapping `props.children`.
 */
export function VexDocumentProvider(props: {
  value: VexDocumentState;
  children: ReactNode;
}) {
  return (
    <VexDocumentContext.Provider value={props.value}>
      {props.children}
    </VexDocumentContext.Provider>
  );
}

/**
 * S5 context hook — exposes the current edit view's document state to a
 * built-in or third-party `edit.*` slot contribution. Backed by
 * `VexDocumentContext`, mounted by `CollectionEditView`/`GlobalEditView`.
 *
 * Experimental: breaking changes are still possible before this stabilizes.
 * @returns The current `VexDocumentState`.
 * @throws When rendered outside a `VexDocumentProvider`.
 */
export function useVexDocument(): VexDocumentState {
  const value = useContext(VexDocumentContext);
  if (value === null) {
    throw new Error("useVexDocument() must be used within a VexDocumentProvider.");
  }
  return value;
}
```

#### packages/react/src/documents/VexDocumentContext.test.tsx

New file.

```tsx
import { describe, expect, it } from "vitest";
import { render, renderHook } from "@testing-library/react";
import { VexDocumentProvider, useVexDocument } from "./VexDocumentContext";
import type { VexDocumentState } from "./VexDocumentContext";

const baseState: VexDocumentState = {
  kind: "collection",
  slug: "posts",
  id: "doc1",
  saved: { title: "Hello" },
  isDirty: false,
  status: "draft",
  canEdit: true,
};

describe("useVexDocument", () => {
  it("returns the provided document state", () => {
    const { result } = renderHook(() => useVexDocument(), {
      wrapper: ({ children }) => (
        <VexDocumentProvider value={baseState}>{children}</VexDocumentProvider>
      ),
    });
    expect(result.current).toEqual(baseState);
  });

  it("throws outside a VexDocumentProvider", () => {
    const Consumer = () => {
      useVexDocument();
      return null;
    };
    expect(() => render(<Consumer />)).toThrow(
      "useVexDocument() must be used within a VexDocumentProvider.",
    );
  });

  it("omits id and status for a global, and reflects isDirty/canEdit", () => {
    const globalState: VexDocumentState = {
      kind: "global",
      slug: "siteSettings",
      saved: { title: "Site" },
      isDirty: true,
      canEdit: false,
    };
    const { result } = renderHook(() => useVexDocument(), {
      wrapper: ({ children }) => (
        <VexDocumentProvider value={globalState}>{children}</VexDocumentProvider>
      ),
    });
    expect(result.current.id).toBeUndefined();
    expect(result.current.status).toBeUndefined();
    expect(result.current.isDirty).toBe(true);
    expect(result.current.canEdit).toBe(false);
  });
});
```

#### packages/react/src/documents/index.ts

New file.

```ts
export { VexDocumentContext, VexDocumentProvider, useVexDocument } from "./VexDocumentContext";
export type { VexDocumentState } from "./VexDocumentContext";
```

#### packages/react/src/index.ts

1 edit; everything not shown is unchanged.

**1 — beside the existing `export { useVexPermissions } from "./access";` line.**

```ts
export { useVexPermissions } from "./access";
export { useVexForm } from "./forms";
export { VexDocumentProvider, useVexDocument } from "./documents";
export type { VexDocumentState } from "./documents";
```

Verify: pnpm --filter @vexcms/react test -- useVexDocument

### Step 4 — Edit-view slots + built-in actions as contributions [dev]

> Note: spec-tasks.md's bullet says Delete is "extracted" from `CollectionEditView.tsx` /
> `DraftToolbar.tsx` alongside Save/Publish/Unpublish/VersionHistory/LivePreviewToggle. Reading
> those files: there is no Delete control in either edit view today (`CollectionListView.tsx` /
> `MediaCollectionListView.tsx` have the only existing delete UI, as a bulk-selection action). This
> step therefore ADDS `vex.delete` as new edit-view functionality, modeled on the list view's
> `vexConvexApi.remove` + `CRUD_ACTIONS.delete` pattern, rather than moving existing code. It
> applies to collections only — there is no `globals.remove` endpoint (`packages/core/src/revalidate/types.ts`
> documents the server's `"remove"`/`"upsert"` vocabulary), matching why Duplicate (Step 6) is
> collection-only for a different reason.
>
> Deviation from this step's pinned interfaces: `useVexDocument()` deliberately excludes form
> values, the viewed-history-version, the live-preview panel's open state, and the post-mutation
> row-id repoint (decision 18) — all four are view-local UI state today (`viewedVersion`,
> `previewPanel` from `useLivePreviewPanelState`, `activeDocumentId`). Built-ins that need them
> (`VersionPublishAction`/`DocumentSaveAction` for `restoredFrom` and the post-save id repoint,
> `VersionHistoryAction` for the viewed version, `LivePreviewToggleAction` for the panel) cannot
> receive them as props — `documentEditBuiltinContributions()` takes no other argument, per this
> step's own interface — and cannot read them off `useVexDocument()`, per Step 3's. This step adds
> one more provider, `packages/react/src/documents/DocumentEditRuntimeContext.tsx`, mirroring
> `VexDocumentProvider`/`useVexDocument`'s
> split exactly, carrying only what `useVexDocument` leaves out. Recorded as spec decision 23.

Why: first visual result. Both edit views render through `SlotOutlet`, and the duplicate and guard
steps plug into this structure.

- [ ] `packages/react/src/documents/DocumentEditRuntimeContext.tsx`: shared view-local state (viewed version, post-save id repoint, live-preview toggle) that `useVexDocument` deliberately omits
- [ ] `packages/react/src/documents/DocumentEditSlotOutlet.tsx` + test: resolves one `edit.*` slot via core's `resolveEditSlot`, applies `header.overrides` per built-in id with a per-layer `ComponentErrorBoundary`
- [ ] `packages/react/src/documents/DocumentSaveAction.tsx`, `packages/react/src/versions/{VersionPublishAction,VersionUnpublishAction,VersionHistoryAction}.tsx`, `packages/react/src/livePreview/LivePreviewToggleAction.tsx`, `packages/react/src/collections/CollectionDeleteAction.tsx` + `packages/react/src/documents/documentEditBuiltinContributions.ts` (`documentEditBuiltinContributions()`, shared built-ins only — save, publish, unpublish, versionHistory, livePreview): self-contained — each reads `useVexDocument`/`useVexForm`/`useDocumentEditRuntime`/`useVexConfig` and performs its own mutation, same public path a plugin replacing it would use
- [ ] `packages/react/src/documents/index.ts`: barrel additions for the above
- [ ] `packages/react/src/versions/index.ts` + `packages/react/src/livePreview/index.ts` + `packages/react/src/collections/index.ts`: barrel additions for their new action files
- [ ] `packages/react/src/index.ts`: export `DocumentEditSlotOutlet`, `DocumentEditRuntimeProvider`, `useDocumentEditRuntime`, `documentEditBuiltinContributions`, `EditSlotProps`
- [ ] `packages/react/src/collections/CollectionEditView.tsx`: `CollectionEditForm` mounts `VexDocumentProvider` + `DocumentEditRuntimeProvider` and all seven `DocumentEditSlotOutlet`s; removes `DraftToolbar`, the inline Save/Publish/Unpublish/Cancel buttons and `VersionHistoryDropdown` call (now rendered through built-ins), and every mutation/permission hook that moved into a built-in; keeps the sticky header, `activeDocumentId`, `viewedVersion`, autosave, `resetWhenSaved`; appends `CollectionDeleteAction` to the builtins passed into the `edit.header.actions` outlet, since `documentEditBuiltinContributions()` no longer includes it
- [ ] `packages/react/src/globals/GlobalEditView.tsx`: same shape of change, using `documentEditBuiltinContributions()`'s builtins unmodified (no delete)
- [ ] `packages/react/src/versions/DraftToolbar.tsx` + any barrel export: removed — its layout (status badge + buttons) is now the `edit.header.actions` contribution list; `StatusBadge` becomes an inline (non-contribution) header element, same tier as `RevalidateButton`
- [ ] `packages/react/src/slots/ComponentErrorBoundary.tsx` + test: add an optional `fallback` prop, rendered alongside the inline error on a throw
- [ ] `packages/react/src/slots/SlotOverrideOutlet.tsx` + `resolveFieldComponent.tsx` + `resolveFieldCellComponent.tsx`: each override layer gets its own `ComponentErrorBoundary` keyed by the override `id`, falling back to the previous stage. Update G's override tests; add a throwing-wrapper case on a field and on `vex.save`
- [ ] Tests: root, collection and global contributions render in order/before/after; a built-in is hidden, reordered and wrapped by id; a throwing contribution shows inline and the view survives

#### packages/react/src/documents/DocumentEditRuntimeContext.tsx

New file. Mounted by `CollectionEditForm`/`GlobalEditView`, inside `VexDocumentProvider`, above the seven `DocumentEditSlotOutlet`s — every built-in that needs view-local UI state (not server document state) reads it via `useDocumentEditRuntime`.

```tsx
"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { ViewedVersion } from "../versions";

/**
 * View-local UI state `useVexDocument` deliberately excludes (S5, decision 18): which history
 * version is being previewed, how to re-point the view at a new row id after a mutation returns
 * one, how to settle the form once a save round-trips, and the live-preview panel's open state.
 * One instance per mounted edit view — `CollectionEditForm`/`GlobalEditView` own the real state
 * and pass it down as `value`; built-ins only ever read it.
 */
export interface DocumentEditRuntimeState {
  /** The history version currently shown in the form, or `null` for the live document. */
  viewedVersion: ViewedVersion | null;
  /** Shows a version's snapshot in the form, or `null` to return to the live document. Never saves. */
  onViewVersion: (view: ViewedVersion | null) => void;
  /**
   * Re-points the view at a different row id — called after `saveDraft`/`publish` returns one
   * (the first draft save on a published document bootstraps a new row). Omitted for a global,
   * which has no separate row id to re-point.
   */
  onDocumentIdChange?: (id: string) => void;
  /** Defers the form's post-save reset until the live row reflects the write — see `useResetWhenSaved`. */
  onSaved: (changes: Record<string, unknown>) => void;
  /** Live-preview panel state for this resource, or `undefined` when no `livePreview` config resolves. */
  livePreview?: {
    isOpen: boolean;
    toggle: () => void;
    isSplit: boolean;
  };
}

export const DocumentEditRuntimeContext = createContext<DocumentEditRuntimeState | undefined>(undefined);

/**
 * Provides {@link DocumentEditRuntimeState} to every built-in and third-party contribution rendered
 * beneath one edit view.
 *
 * @param props.value - The edit view's own runtime state.
 * @param props.children - The edit view's slotted header/fields/sidebar tree.
 * @returns `children` wrapped in the runtime context provider.
 */
export function DocumentEditRuntimeProvider(props: {
  value: DocumentEditRuntimeState;
  children: ReactNode;
}) {
  return (
    <DocumentEditRuntimeContext.Provider value={props.value}>
      {props.children}
    </DocumentEditRuntimeContext.Provider>
  );
}

/**
 * Reads the nearest {@link DocumentEditRuntimeState}.
 *
 * @returns The current edit view's runtime state.
 * @throws {Error} Outside a `DocumentEditRuntimeProvider`.
 */
export function useDocumentEditRuntime(): DocumentEditRuntimeState {
  const value = useContext(DocumentEditRuntimeContext);
  if (!value) {
    throw new Error("useDocumentEditRuntime must be used within a DocumentEditRuntimeProvider");
  }
  return value;
}
```

#### packages/react/src/documents/DocumentEditSlotOutlet.tsx

New file. One `DocumentEditSlotOutlet` call per flat `edit.*` slot id; `root`/`resource` are the two
`EditSlotConfigInput` halves `resolveEditSlot` (core, Step 2) merges — `builtins` and
`header.overrides` only apply where the call site passes them (`edit.header.actions`); the other
six slots pass `builtins={[]}` and their `EditSlotConfigInput` carries no `overrides`, so
`resolved.overrides` is always empty there and this component behaves exactly like a plain
`SlotOutlet`.

```tsx
"use client";

import type { ComponentType, ReactNode } from "react";
import {
  resolveEditSlot,
  type ComponentContributionInput,
  type EditSlotConfigInput,
  type SlotAccessContext,
  type SlotId,
} from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { ComponentErrorBoundary } from "../slots/ComponentErrorBoundary";
import { useVexPermissions } from "../access/useVexPermissions";

/**
 * Renders one resolved `edit.*` slot (S11/S12): `root` then `resource`-level contributions,
 * ordered, with `builtins` merged in before resolution (same two-array split as `SlotOutlet`,
 * for the same reason — `documentEditBuiltinContributions` closes over nothing per-render, but keeping
 * the split matches every other slot renderer and lets a project's `before`/`after` target a
 * built-in id). Contributions whose id has a `header.overrides` entry are additionally composed
 * through that override chain (S3), each layer in its own `ComponentErrorBoundary` keyed by the
 * override's own id (decision 17) — a throwing wrapper falls back to the stage beneath it
 * (ultimately the built-in or project contribution itself) plus an inline error naming the
 * wrapper, rather than losing the whole action.
 *
 * @param props.slotId - One of `SLOT_IDS.edit.*`.
 * @param props.root - The root-level `admin.components.edit` config for this slot.
 * @param props.resource - The collection/global-level config for this slot.
 * @param props.builtins - This slot's built-in contributions (`edit.header.actions` only; `[]` elsewhere).
 * @param props.contributedProps - `EditSlotProps` passed to every contribution.
 * @returns The resolved, override-composed contribution list, each wrapped in a `ComponentErrorBoundary`.
 */
export function DocumentEditSlotOutlet<TProps extends {}>(props: {
  slotId: SlotId;
  root: EditSlotConfigInput<ReactHKT, TProps> | undefined;
  resource: EditSlotConfigInput<ReactHKT, TProps> | undefined;
  builtins: ComponentContributionInput<ReactHKT, TProps>[];
  contributedProps: TProps;
}): ReactNode {
  const { hasPermission } = useVexPermissions();
  const ctx: SlotAccessContext = { hasPermission };

  const { contributions, overrides } = resolveEditSlot<ReactHKT, TProps>({
    slotId: props.slotId,
    root: props.root,
    resource: props.resource,
    builtins: props.builtins,
  });

  return (
    <>
      {contributions.map((contribution) => {
        if (contribution.access && !contribution.access(ctx)) return null;
        // TODO: implement
        // 1. Base = (p) => <ComponentErrorBoundary id={contribution.id}><contribution.component {...p} /></ComponentErrorBoundary>
        //    → a throw with zero overrides configured behaves exactly like today's `SlotOutlet`.
        // 2. Compose `overrides[contribution.id] ?? []` on top of Base via `.reduce`, same shape as
        //    `SlotOverrideOutlet`: each layer is `(p) => <ComponentErrorBoundary id={override.id}
        //    fallback={<RenderDefault {...p} />}><Override {...p} renderDefault={RenderDefault} />
        //    </ComponentErrorBoundary>`, `RenderDefault` = the previous stage (Base for the first
        //    override, the prior override for the next).
        //    → a throwing wrapper renders the stage beneath it plus its own inline error; sibling
        //      wrappers and sibling contributions are unaffected.
        // 3. Render the final composed component with `key={contribution.id}` and
        //    `{...props.contributedProps}`.
        throw new Error("Not implemented");
      })}
    </>
  );
}
```

Edge cases:
- `overrides[contribution.id]` naming an id outside this slot's resolved `contributions` never
  reaches this component — `resolveEditSlot` throws `VexComponentConfigError` during resolution
  (decision 16), before any render.
- An override chain composes even over a HIDDEN-then-unhidden built-in exactly as it would over any
  other contribution id; hiding is resolved before overrides are applied.

#### packages/react/src/documents/DocumentEditSlotOutlet.test.tsx

New file.

```tsx
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComponentOverrideInput } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { DocumentEditSlotOutlet } from "./DocumentEditSlotOutlet";
import { renderWithVexProviders } from "../testing/harness/accessFixtures";

interface Probe {
  kind: "collection" | "global";
  slug: string;
}

function makeContribution(id: string, text: string) {
  return {
    id,
    component: () => <span>{text}</span>,
  };
}

describe("DocumentEditSlotOutlet", () => {
  it("renders root then resource-level contributions, ordered by before/after", () => {
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={{ contributions: [makeContribution("acme.root", "root")] }}
        resource={{
          contributions: [
            { ...makeContribution("acme.resource", "resource"), before: "acme.root" },
          ],
        }}
        builtins={[]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    const spans = screen.getAllByText(/root|resource/);
    expect(spans.map((el) => el.textContent)).toEqual(["resource", "root"]);
  });

  it("hides a built-in via a hide directive and reorders another with order", () => {
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={undefined}
        resource={{
          contributions: [
            { id: "vex.save", hidden: true },
            { ...makeContribution("acme.first", "first"), order: -1 },
          ],
        }}
        builtins={[makeContribution("vex.save", "Save")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
    expect(screen.getByText("first")).toBeInTheDocument();
  });

  it("wraps a built-in by id, the wrapper receiving renderDefault", () => {
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={{
          overrides: {
            "vex.save": [
              {
                id: "acme.saveWrap",
                component: (p: Probe & { renderDefault: (p: Probe) => React.ReactNode }) => (
                  <div data-testid="wrap">
                    wrapped
                    <p.renderDefault {...p} />
                  </div>
                ),
              } as ComponentOverrideInput<ReactHKT, Probe>,
            ],
          },
        }}
        resource={undefined}
        builtins={[makeContribution("vex.save", "Save")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    expect(screen.getByTestId("wrap")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("falls back to the stage beneath a throwing wrapper on vex.save, with an inline error naming it", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithVexProviders(
      <DocumentEditSlotOutlet<Probe>
        slotId="edit.header.actions"
        root={{
          overrides: {
            "vex.save": [
              {
                id: "acme.saveThrows",
                component: (): never => {
                  throw new Error("boom");
                },
              } as ComponentOverrideInput<ReactHKT, Probe>,
            ],
          },
        }}
        resource={undefined}
        builtins={[makeContribution("vex.save", "Save")]}
        contributedProps={{ kind: "collection", slug: "posts" }}
      />,
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("acme.saveThrows");
    expect(alert).toHaveTextContent("boom");
    spy.mockRestore();
  });
});
```

#### packages/react/src/documents/DocumentSaveAction.tsx

New file. The non-versioned Save and the versioned Save Draft button — which endpoint it writes
to is resolved from the collection/global's own `versions.drafts`, not from `props`.

```tsx
"use client";

import { useStore } from "@tanstack/react-form";
import { CRUD_ACTIONS, DRAFT_ACTIONS, vexConvexApi, type EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "./VexDocumentContext";
import { useVexForm } from "../forms/useVexForm";
import { useVexConfig } from "../config/VexConfigContext";
import { usePermission } from "../access";
import { useDocumentEditRuntime } from "./DocumentEditRuntimeContext";
import { changedValues } from "../forms/changedValues";
import { Button } from "../ui";

/**
 * Built-in `vex.save` contribution for `edit.header.actions`. Writes the form's dirty diff —
 * `vexConvexApi.versions.saveDraft` for a versioned resource, `vexConvexApi.update` /
 * `vexConvexApi.globals.upsert` otherwise — the same endpoints a plugin replacing this button
 * would call (decision 13).
 *
 * @param props - `{ kind, slug }` (`EditSlotProps`).
 * @returns The Save / Save Draft button.
 * @throws Never — a rejected mutation is toasted, never re-thrown.
 */
export function DocumentSaveAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const form = useVexForm()!;
  const runtime = useDocumentEditRuntime();
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);

  // TODO: implement
  // 1. Resolve `collection`/`global` from `config` by `props.slug` → `isVersioned`.
  // 2. `canEdit = usePermission({ resource: props.slug, action: isVersioned ?
  //    DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update, data: document.saved })`.
  // 3. `useVexMutation`/`useMutation` for the resolved endpoint; `onClick` reads
  //    `changedValues(form)` plus `restoredFrom: runtime.viewedVersion?.version` when set.
  //    a. Versioned, document never saved (global only) → send `form.state.values` instead of a
  //       diff (mirrors today's `GlobalEditView` first-save branch) and `form.reset()` on success.
  //    b. Otherwise → on success call `runtime.onDocumentIdChange?.(newId)` (collection only),
  //       `runtime.onViewVersion(null)`, `runtime.onSaved(changes)`.
  // 4. `disabled={!canEdit || isDefaultValue}`; label "Save Draft" when `isVersioned`, else "Save".
  // Edge cases:
  // - Viewing an old version with no further edits (`isDefaultValue` true): still enabled — saving
  //   restores the viewed version as the current draft (matches today's `DraftToolbar` disabled logic).
  throw new Error("Not implemented");
}
```

#### packages/react/src/versions/VersionPublishAction.tsx

New file.

```tsx
"use client";

import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import {
  DRAFT_ACTIONS,
  valuesEqual,
  vexConvexApi,
  type EditSlotProps,
} from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useVexForm } from "../forms/useVexForm";
import { useVexConfig } from "../config/VexConfigContext";
import { usePermission } from "../access";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { changedValues } from "../forms/changedValues";
import { applyVexFieldErrors } from "../utils/errors";
import { Button } from "../ui";

/**
 * Built-in `vex.publish` contribution for `edit.header.actions`. Renders nothing for a
 * non-versioned resource.
 *
 * @param props - `{ kind, slug }`.
 * @returns The Publish button, or `null` when the resource is not versioned.
 * @throws Never — a rejected mutation applies field errors via {@link applyVexFieldErrors}, never re-thrown.
 */
export function VersionPublishAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const form = useVexForm()!;
  const runtime = useDocumentEditRuntime();

  // TODO: implement
  // 1. Resolve the collection/global; return `null` when `!versions.drafts`.
  // 2. `canPublish = usePermission({ resource: props.slug, action: DRAFT_ACTIONS.publish, data: document.saved })`.
  // 3. While `document.status === "draft"`, query the published row (`vexConvexApi.get` /
  //    `vexConvexApi.globals.get`, no `drafts` flag) to compute `matchesPublished` the same way
  //    `CollectionEditView`/`GlobalEditView` do today (`valuesEqual` against form values).
  // 4. `onClick`: `vexConvexApi.versions.publish` with the merged `{ ...document.saved, ...form.state.values }`
  //    diff and `version: runtime.viewedVersion?.version`; on success `runtime.onDocumentIdChange?.(newId)`
  //    (collection only), `runtime.onViewVersion(null)`, `runtime.onSaved(changes)`; on rejection
  //    `applyVexFieldErrors(form, error)`.
  // 5. `disabled={!canPublish || (runtime.viewedVersion === null && matchesPublished)}` — a global
  //    never yet saved is additionally disabled while the form is at its defaults.
  throw new Error("Not implemented");
}
```

#### packages/react/src/versions/VersionUnpublishAction.tsx

New file. Owns its own confirmation dialog — the single parent-level `AlertDialog` both edit
views shared is retired along with the rest of their header wiring.

```tsx
"use client";

import { useState } from "react";
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { DRAFT_ACTIONS, vexConvexApi, type EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useVexConfig } from "../config/VexConfigContext";
import { usePermission } from "../access";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { getVexErrorMessage } from "../utils/errors";
import { Button } from "../ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { toast } from "sonner";

/**
 * Built-in `vex.unpublish` contribution for `edit.header.actions`. Renders nothing for a
 * non-versioned resource, or for a global never yet saved.
 *
 * @param props - `{ kind, slug }`.
 * @returns The Unpublish button plus its confirmation dialog, or `null`.
 * @throws Never — a rejected mutation is toasted, never re-thrown.
 */
export function VersionUnpublishAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const [confirming, setConfirming] = useState(false);

  // TODO: implement
  // 1. Resolve the collection/global; return `null` when `!versions.drafts` or (global) `document.saved` undefined.
  // 2. `canUnpublish = usePermission({ resource: props.slug, action: DRAFT_ACTIONS.unpublish, data: document.saved })`.
  // 3. While `confirming`, query `vexConvexApi.versions.listVersions` (by collection+id or by
  //    global) and derive `publishedTimeline`/`unpublishTarget` exactly as today's edit views did,
  //    for the dialog's description text.
  // 4. `disabled={!canUnpublish || document.status === "draft" || document.isDirty}`.
  // 5. On confirm: `vexConvexApi.versions.unpublish`; close the dialog on both success and
  //    rejection, toasting the rejection via `getVexErrorMessage`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/CollectionDeleteAction.tsx

New file. Collection only — there is no `globals.remove` endpoint.

```tsx
"use client";

import { useState } from "react";
import { CRUD_ACTIONS, vexConvexApi, type EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useVexConfig } from "../config/VexConfigContext";
import { useVexMutation } from "../hooks";
import { usePermission } from "../access";
import { adminHref } from "../admin/adminHref";
import { Button } from "../ui";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

/**
 * Built-in `vex.delete` contribution for `edit.header.actions`. Collection-only —
 * `CollectionEditView` appends it directly to the builtins it passes into
 * `DocumentEditSlotOutlet`; `documentEditBuiltinContributions` never includes it.
 *
 * @param props - `{ kind: "collection", slug }`.
 * @returns The Delete button plus its confirmation dialog.
 * @throws Never — a rejected mutation is toasted (via `useVexMutation`'s own `onError`), never re-thrown.
 */
export function CollectionDeleteAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const [confirming, setConfirming] = useState(false);

  // TODO: implement
  // 1. `canDelete = usePermission({ resource: props.slug, action: CRUD_ACTIONS.delete, data: document.saved })`.
  // 2. `useVexMutation({ collection: props.slug, getChanges: () => document.saved ? [{ before:
  //    document.saved }] : [], mutationFn: vexConvexApi.remove, operation: "remove" })`.
  // 3. On confirm: `mutateAsync({ ids: [document.id!], collection: props.slug })`; on success,
  //    navigate to the collection list — `window.location.assign(adminHref({ type: "collection",
  //    slug: props.slug }, config.basePath))` (no in-package router exists before Step 8; a full
  //    navigation is correct here since nothing on the deleted document's edit view should survive).
  // 4. `disabled={!canDelete}`.
  throw new Error("Not implemented");
}
```

> Note: Step 7 swaps this `window.location.assign` for `useVexNavigate()` and calls the active
> unsaved-changes guard's `release()` first, so the delete's own navigation never triggers its
> own Stay/Leave prompt. See "Step 7 follow-up edit" at the end of this file for the exact edit.

#### packages/react/src/versions/VersionHistoryAction.tsx

New file. Thin adapter over the existing `VersionHistoryDropdown` — no new history logic.

```tsx
"use client";

import type { EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "../documents/VexDocumentContext";
import { useVexConfig } from "../config/VexConfigContext";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { VersionHistoryDropdown } from "./VersionHistoryDropdown";

/**
 * Built-in `vex.versionHistory` contribution for `edit.header.actions`. Renders nothing for a
 * non-versioned resource — mirrors `VersionHistoryDropdown`'s own "no `readDrafts`" `null` return
 * for the permission case.
 *
 * @param props - `{ kind, slug }`.
 * @returns A `VersionHistoryDropdown` targeting this resource, or `null`.
 */
export function VersionHistoryAction(props: EditSlotProps) {
  const config = useVexConfig();
  const document = useVexDocument();
  const runtime = useDocumentEditRuntime();

  // TODO: implement
  // 1. Resolve the collection/global; return `null` when `!versions.drafts`.
  // 2. `target = props.kind === "collection" ? { collection: props.slug, documentId: document.id! }
  //    : { global: props.slug }`.
  // 3. Render `<VersionHistoryDropdown target={target} hasDraft={document.status === "draft"}
  //    viewingVersion={runtime.viewedVersion?.version ?? null} onViewVersion={runtime.onViewVersion}
  //    hasUnsavedChanges={document.isDirty} activeVersion={(document.saved as { vex_activeVersion?:
  //    number } | undefined)?.vex_activeVersion ?? null} />`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/versions/index.ts

2 edits; everything not shown is unchanged.

**1 — remove `DraftToolbar`'s export (deleted by this step):**

```ts
export * from "./StatusBadge";
```

**2 — add the three action files, beside the existing exports:**

```ts
export * from "./VersionHistoryDropdown";
export * from "./DocumentTimestamps";
export * from "./useAutosave";
export * from "./useResetWhenSaved";
export * from "./utils";
export * from "./VersionHistoryAction";
export * from "./VersionPublishAction";
export * from "./VersionUnpublishAction";
```

#### packages/react/src/livePreview/LivePreviewToggleAction.tsx

New file.

```tsx
"use client";

import type { EditSlotProps } from "@vexcms/core";
import { useDocumentEditRuntime } from "../documents/DocumentEditRuntimeContext";
import { Button } from "../ui";

/**
 * Built-in `vex.livePreview` contribution for `edit.header.actions`. Renders nothing when the
 * resource has no resolved `livePreview` config (`runtime.livePreview` is `undefined`).
 *
 * @param props - `{ kind, slug }` — unused; the panel state travels through `useDocumentEditRuntime`.
 * @returns The Preview toggle button, or `null`.
 */
export function LivePreviewToggleAction(_props: EditSlotProps) {
  const runtime = useDocumentEditRuntime();
  if (!runtime.livePreview) return null;
  const { toggle, isSplit } = runtime.livePreview;
  return (
    <Button type="button" variant="outline" onClick={toggle} icon={isSplit ? "Eye" : "EyeOff"}>
      Preview
    </Button>
  );
}
```

#### packages/react/src/livePreview/index.ts

1 edit; everything not shown is unchanged. Beside the existing exports:

```ts
export * from "./LivePreviewToggleAction";
```

#### packages/react/src/documents/documentEditBuiltinContributions.ts

New file.

```ts
import type { ComponentContributionInput, EditSlotProps } from "@vexcms/core";
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { DocumentSaveAction } from "./DocumentSaveAction";
import { VersionPublishAction, VersionUnpublishAction, VersionHistoryAction } from "../versions";
import { LivePreviewToggleAction } from "../livePreview";

/**
 * `edit.header.actions`' shared built-in contributions (decision 13) — every entry is
 * self-contained, reading `useVexDocument`/`useVexForm`/`useDocumentEditRuntime`/`useVexConfig`
 * itself, since `DocumentEditSlotOutlet` merges `documentEditBuiltinContributions()` with project
 * contributions before resolving `order`/`before`/`after`/`hidden`/`overrides` (S8/S9), and a
 * built-in that closed over per-render parent state could not be constructed here.
 *
 * Returns only the built-ins every edit view shares. `vex.delete` (Step 4) and `vex.duplicate`
 * (Step 6) are collection-only and appended directly by `CollectionEditView.tsx` to the builtins
 * it passes into its `edit.header.actions` outlet — `documents/` must not import from
 * `collections/`, so this function never references either.
 *
 * @returns The ordered shared built-in contribution list for `edit.header.actions`.
 */
export function documentEditBuiltinContributions(): ComponentContributionInput<ReactHKT, EditSlotProps>[] {
  return [
    { id: BUILTIN_CONTRIBUTION_IDS.edit.livePreview, component: LivePreviewToggleAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.versionHistory, component: VersionHistoryAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.save, component: DocumentSaveAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.publish, component: VersionPublishAction },
    { id: BUILTIN_CONTRIBUTION_IDS.edit.unpublish, component: VersionUnpublishAction },
  ];
}
```

#### packages/react/src/collections/CollectionEditView.tsx (builtins wiring)

Not shown complete here (see the full file below, under "the `edit.header.actions` outlet" in its
return statement) — `CollectionEditForm` appends `CollectionDeleteAction` to
`documentEditBuiltinContributions()`'s list before passing it as `builtins`:

```tsx
builtins={[
  ...documentEditBuiltinContributions(),
  { id: BUILTIN_CONTRIBUTION_IDS.edit.delete, component: CollectionDeleteAction },
]}
```

#### packages/react/src/collections/index.ts

1 edit; everything not shown is unchanged. Beside the existing exports:

```ts
export * from "./CollectionDeleteAction";
```

#### packages/react/src/documents/index.ts

1 edit; everything not shown is unchanged — this file is Step 3's, extended here.

```ts
export { VexDocumentContext, VexDocumentProvider, useVexDocument } from "./VexDocumentContext";
export type { VexDocumentState } from "./VexDocumentContext";
export { DocumentEditRuntimeContext, DocumentEditRuntimeProvider, useDocumentEditRuntime } from "./DocumentEditRuntimeContext";
export type { DocumentEditRuntimeState } from "./DocumentEditRuntimeContext";
export { DocumentEditSlotOutlet } from "./DocumentEditSlotOutlet";
export { DocumentSaveAction, documentEditBuiltinContributions } from "./documentEditBuiltinContributions";
```

#### packages/react/src/index.ts

4 edits; everything not shown is unchanged.

**1 — beside the existing "Admin extension points (slots)" exports.** After the `SLOT_IDS`/`BUILTIN_CONTRIBUTION_IDS` re-export:

```ts
export {
  DocumentEditSlotOutlet,
  DocumentEditRuntimeProvider,
  useDocumentEditRuntime,
  documentEditBuiltinContributions,
} from "./documents";
export type { DocumentEditRuntimeState } from "./documents";
export type { EditSlotProps, EditSlotConfigInput } from "@vexcms/core";
```

**2 — beside the existing `VexDocumentProvider`/`useVexDocument` export added by Step 3** (not shown — out of this step's diff).

**3 — beside `export { CollectionListView, CollectionEditView } from "./collections";`.** No change to this line; `CollectionEditView`'s own exports are unaffected by its internal rewrite.

**4 — beside `export { GlobalEditView, GlobalsListView } from "./globals";`.** No change to this line, same reason.


#### packages/react/src/versions/DraftToolbar.tsx

Removed. Its layout (status badge, Save Draft, Publish, Cancel, Unpublish in one row, each gated
by caller-supplied `onClick`/`isPending`/`disabled`) is superseded by `edit.header.actions`'
contribution list, where each button is its own self-contained, independently hideable/wrappable
built-in. Remove its export from `packages/react/src/versions/index.ts` (one line) and delete
`DraftToolbarProps`/`DraftToolbarAction` with it — nothing else imports them (`CollectionEditView.tsx`
and `GlobalEditView.tsx` are this step's only other callers, both rewritten below).

#### packages/react/src/collections/CollectionEditView.tsx

`CollectionEditView` (the outer, document-loading component, lines 93–142) is unchanged.
`CollectionEditForm`'s body changes throughout — shown complete.

```tsx
function CollectionEditForm(
  props: Pick<
    CollectionEditViewProps,
    "initialPreviewPanelOpen" | "initialPreviewPanelSize" | "initialPreviewUrl"
  > & {
    collection: CollectionConfig;
    currentDocument: VexDocument;
    activeDocumentId: VexDocument["_id"];
    setActiveDocumentId: Dispatch<SetStateAction<VexDocument["_id"]>>;
  },
) {
  const config = useVexConfig();
  const { collection, currentDocument, activeDocumentId, setActiveDocumentId } = props;

  const [viewedVersion, setViewedVersion] = useState<ViewedVersion | null>(null);
  const formDocument: VexDocument = viewedVersion
    ? ({
        _id: currentDocument._id,
        _creationTime: currentDocument._creationTime,
        ...viewedVersion.snapshot,
      } as VexDocument)
    : currentDocument;
  const restoredFrom = viewedVersion ? { restoredFrom: viewedVersion.version } : {};

  const dataFields = useMemo(
    () => getDataFields({ fields: collection.fields }),
    [collection.fields],
  );
  const visibleFields = useVisibleFields({
    resource: collection.slug,
    fields: dataFields,
    data: currentDocument,
  });
  const readableFieldKeys = visibleFields.map(([fieldKey]) => fieldKey);

  const form = useFieldsForm({
    document: formDocument,
    fields: collection.fields,
    readableFieldKeys,
    onSubmit: async () => {
      const changes = changedValues(form);
      if (Object.keys(changes).length === 0) return;
      await plainUpdateMutation.mutateAsync({
        id: currentDocument._id,
        collection: collection.slug,
        data: changes,
      });
      resetWhenSaved(changes);
    },
  });

  // Only the non-versioned onSubmit path above still needs a dedicated mutation at this level —
  // `DocumentSaveAction` owns the versioned write. Kept here (not inside the built-in) because `AppForm`'s
  // native submit (Enter in a text field) still calls `form.handleSubmit`, which this `onSubmit`
  // backs regardless of which button is visible.
  const plainUpdateMutation = useVexMutation({
    collection: collection.slug,
    getChanges: ({ args }) => [
      { after: { ...currentDocument, ...args.data }, before: currentDocument },
    ],
    mutationFn: vexConvexApi.update,
    operation: CRUD_ACTIONS.update,
  });

  useLiveFieldMerge({
    form,
    document: formDocument,
    fieldKeys: readableFieldKeys,
  });

  const resetWhenSaved = useResetWhenSaved({ form, document: currentDocument });

  const isVersioned = collection.versions.drafts;
  const editAction = isVersioned ? DRAFT_ACTIONS.saveDraft : CRUD_ACTIONS.update;
  const canEdit = usePermission({
    resource: collection.slug,
    action: editAction,
    data: currentDocument,
  });
  const fieldPermissions = useFieldPermissions({
    resource: collection.slug,
    action: editAction,
    data: currentDocument,
  });
  const isDraftDoc = currentDocument.vex_status === VERSION_STATUSES.draft.key;

  const viewedVersionNumber = viewedVersion?.version ?? null;
  const lastViewedVersionRef = useRef(viewedVersionNumber);
  useEffect(() => {
    if (lastViewedVersionRef.current === viewedVersionNumber) return;
    lastViewedVersionRef.current = viewedVersionNumber;
    form.reset();
  }, [viewedVersionNumber]);

  const { mutateAsync: saveDraftMutation } = useMutation({
    mutationFn: useConvexMutation(vexConvexApi.versions.saveDraft),
  });
  useAutosave({
    values: changedValues(form),
    onSave: async (changes) => {
      const draftId = await saveDraftMutation({
        collection: collection.slug,
        id: activeDocumentId,
        data: changes,
        ...restoredFrom,
      });
      setActiveDocumentId(draftId);
      setViewedVersion(null);
      resetWhenSaved(changes);
    },
    enabled: isVersioned && collection.versions.autosave.enabled && canEdit,
  });

  const isMobile = useIsMobile();
  const livePreview = resolveLivePreviewSettings({
    config: config.admin.livePreview,
    kind: "collection",
    slug: collection.slug,
    admin: collection.admin.livePreview,
  });
  const previewPanel = useLivePreviewPanelState({
    slug: collection.slug,
    initialOpen: props.initialPreviewPanelOpen ?? false,
    enabled: livePreview !== undefined,
  });
  const [tempId] = useState(() => crypto.randomUUID());
  const savedDocumentId = currentDocument._id as string | undefined;
  const formValues = useStore(form.store, (state) => state.values);
  const clientPreviewUrl = resolveLivePreviewUrl({
    url: livePreview?.url,
    collectionSlug: collection.slug,
    baseDoc: currentDocument,
    formValues,
    tempId,
  });
  const previewUrl = useLivePreviewServerUrl({
    url: livePreview?.url,
    clientUrl: clientPreviewUrl,
    initialUrl: props.initialPreviewUrl,
    kind: "collection",
    slug: collection.slug,
    documentId: savedDocumentId,
    tempId: tempId,
    formValues,
    debounceMs: livePreview?.debounceMs,
  });
  const previewIsActive = Boolean(livePreview && previewPanel.isOpen && previewUrl);
  const breakpoints = livePreview?.breakpoints ?? config.admin.livePreview.breakpoints;
  const isSplit = previewIsActive && !isMobile;

  const hasSidebarFields = Object.values(collection.fields).some(
    (fieldDef) =>
      "admin" in fieldDef &&
      "position" in fieldDef.admin &&
      fieldDef.admin.position === "sidebar",
  );
  const showSidebar = hasSidebarFields || currentDocument._creationTime !== undefined;
  const documentStatus = isVersioned
    ? isDraftDoc
      ? VERSION_STATUSES.draft.key
      : VERSION_STATUSES.published.key
    : undefined;
  const renderedFields = applyFieldPermissionReadOnly({
    fields: collection.fields,
    fieldPermissions,
  });

  const slotProps = { kind: "collection" as const, slug: collection.slug };

  const formContent = (
    <div className={showSidebar ? "flex flex-col gap-6 @3xl/form:flex-row" : undefined}>
      <div className="min-w-0 flex-1">
        <DocumentEditSlotOutlet
          slotId={SLOT_IDS.edit.beforeFields}
          root={config.admin.components.edit.beforeFields}
          resource={collection.admin.components?.edit?.beforeFields}
          builtins={[]}
          contributedProps={slotProps}
        />
        <RenderFields
          fields={renderedFields}
          collection={collection}
          readOnly={!canEdit}
          documentStatus={documentStatus}
          fieldKeys={readableFieldKeys}
          region={showSidebar ? "main" : "all"}
          isTopLevel
        />
        <DocumentEditSlotOutlet
          slotId={SLOT_IDS.edit.afterFields}
          root={config.admin.components.edit.afterFields}
          resource={collection.admin.components?.edit?.afterFields}
          builtins={[]}
          contributedProps={slotProps}
        />
      </div>
      {showSidebar && (
        <div className="vex-scroll-area w-full space-y-4 @3xl/form:sticky @3xl/form:top-0 @3xl/form:-m-1 @3xl/form:max-h-[100cqh] @3xl/form:w-72 @3xl/form:shrink-0 @3xl/form:self-start @3xl/form:overflow-y-auto @3xl/form:p-1">
          <DocumentEditSlotOutlet
            slotId={SLOT_IDS.edit.sidebarBefore}
            root={config.admin.components.edit.sidebar?.before}
            resource={collection.admin.components?.edit?.sidebar?.before}
            builtins={[]}
            contributedProps={slotProps}
          />
          <DocumentTimestamps creationTime={currentDocument._creationTime} />
          <RenderFields
            fields={renderedFields}
            collection={collection}
            readOnly={!canEdit}
            documentStatus={documentStatus}
            fieldKeys={readableFieldKeys}
            region="sidebar"
            isTopLevel
          />
          <DocumentEditSlotOutlet
            slotId={SLOT_IDS.edit.sidebarAfter}
            root={config.admin.components.edit.sidebar?.after}
            resource={collection.admin.components?.edit?.sidebar?.after}
            builtins={[]}
            contributedProps={slotProps}
          />
        </div>
      )}
    </div>
  );

  const formPanelSize = props.initialPreviewPanelSize ?? DEFAULT_LIVE_PREVIEW_FORM_PANEL_SIZE;
  const { ref: splitRef, minSizes: panelMinSizes } = useLivePreviewPanelMinSize();
  const formScroll = usePreservedScrollTop();

  return (
    <VexDocumentProvider
      value={{
        kind: "collection",
        slug: collection.slug,
        id: activeDocumentId as string,
        saved: currentDocument,
        isDirty: !useStore(form.store, (state) => state.isDefaultValue),
        status: isVersioned ? (isDraftDoc ? "draft" : "published") : undefined,
        canEdit,
      }}
    >
      <DocumentEditRuntimeProvider
        value={{
          viewedVersion,
          onViewVersion: setViewedVersion,
          onDocumentIdChange: (id) => setActiveDocumentId(id as VexDocument["_id"]),
          onSaved: resetWhenSaved,
          livePreview: livePreview && {
            isOpen: previewPanel.isOpen,
            toggle: previewPanel.toggle,
            isSplit,
          },
        }}
      >
        <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
          <div className="z-10 -mx-6 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-y-2 border-b bg-background px-6">
            <div className="flex flex-wrap items-center gap-2">
              <DocumentEditSlotOutlet
                slotId={SLOT_IDS.edit.headerBefore}
                root={config.admin.components.edit.header?.before}
                resource={collection.admin.components?.edit?.header?.before}
                builtins={[]}
                contributedProps={slotProps}
              />
              <h1 className="text-2xl font-bold">
                Edit {collection.labels.singular} -{" "}
                <span className="text-primary">
                  {String(currentDocument[collection.admin.useAsTitle] ?? "")}
                </span>
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isVersioned && <StatusBadge status={isDraftDoc ? "draft" : "published"} />}
              <RevalidateButton collection={collection.slug} doc={currentDocument} />
              <DocumentEditSlotOutlet
                slotId={SLOT_IDS.edit.headerActions}
                root={{
                  contributions: config.admin.components.edit.header?.actions,
                  overrides: config.admin.components.edit.header?.overrides,
                }}
                resource={{
                  contributions: collection.admin.components?.edit?.header?.actions,
                  overrides: collection.admin.components?.edit?.header?.overrides,
                }}
                builtins={[
                  ...documentEditBuiltinContributions(),
                  { id: BUILTIN_CONTRIBUTION_IDS.edit.delete, component: CollectionDeleteAction },
                ]}
                contributedProps={slotProps}
              />
              <Button
                type="button"
                variant="outline"
                className="transition-all duration-300"
                disabled={!canEdit || useStore(form.store, (state) => state.isDefaultValue)}
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
              <DocumentEditSlotOutlet
                slotId={SLOT_IDS.edit.headerAfter}
                root={config.admin.components.edit.header?.after}
                resource={collection.admin.components?.edit?.header?.after}
                builtins={[]}
                contributedProps={slotProps}
              />
            </div>
          </div>
          {isSplit ? (
            <div ref={splitRef} className="-mr-6 flex min-h-0 flex-1">
              <ResizablePanelGroup
                direction="horizontal"
                className="min-h-0 flex-1"
                onLayout={([formPanelSize]) => {
                  if (formPanelSize !== undefined) {
                    writeLivePreviewLayoutCookie({ slug: collection.slug, formPanelSize });
                  }
                }}
              >
                <ResizablePanel defaultSize={formPanelSize} minSize={panelMinSizes.form}>
                  <div
                    ref={formScroll.ref}
                    onScroll={formScroll.onScroll}
                    className="vex-scroll-area relative h-full overflow-y-auto pt-4 pr-4 pb-6 [container-type:size] [container-name:form]"
                  >
                    <FormCompactProvider>{formContent}</FormCompactProvider>
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={100 - formPanelSize} minSize={panelMinSizes.preview}>
                  <LivePreviewPanel
                    previewUrl={previewUrl as string}
                    collectionSlug={collection.slug}
                    documentId={savedDocumentId}
                    tempId={savedDocumentId ? undefined : tempId}
                    debounceMs={livePreview?.debounceMs}
                    breakpoints={breakpoints}
                    form={form}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </div>
          ) : (
            <div
              ref={formScroll.ref}
              onScroll={formScroll.onScroll}
              className="vex-scroll-area relative -mx-6 min-h-0 flex-1 overflow-y-auto px-6 pt-4 pb-6 [container-type:size] [container-name:form]"
            >
              <FormCompactProvider>{formContent}</FormCompactProvider>
            </div>
          )}
          {previewIsActive && isMobile && (
            <LivePreviewPanel
              previewUrl={previewUrl as string}
              collectionSlug={collection.slug}
              documentId={savedDocumentId}
              tempId={savedDocumentId ? undefined : tempId}
              debounceMs={livePreview?.debounceMs}
              breakpoints={breakpoints}
              form={form}
              isMobile
              onClose={previewPanel.toggle}
            />
          )}
        </AppForm>
      </DocumentEditRuntimeProvider>
    </VexDocumentProvider>
  );
}
```

Imports this version drops versus today's (remove): `convexQuery`, `DRAFT_ACTIONS.publish`/`.unpublish`
usages beyond `editAction`, `applyVexFieldErrors`, `getVexErrorMessage`, `toast`, the six
`AlertDialog*` named imports, `DraftToolbar`, `VersionHistoryDropdown`/`ViewedVersion` (now only
`ViewedVersion` as a type, from `../versions`). Imports it adds: `DocumentEditSlotOutlet`,
`DocumentEditRuntimeProvider`, `documentEditBuiltinContributions` (from `../documents`),
`CollectionDeleteAction` (from `./CollectionDeleteAction`), `BUILTIN_CONTRIBUTION_IDS`,
`VexDocumentProvider` (from `../documents`), `SLOT_IDS`, `StatusBadge` (already re-exported by
`../versions`).

#### packages/react/src/globals/GlobalEditView.tsx

Same shape of change as `CollectionEditView.tsx`'s `CollectionEditForm`: `GlobalEditView`'s body
changes throughout (shown complete in the real patch, omitted here to avoid duplicating ~500
lines already walked above). Differences from the collection version:

- `slotProps = { kind: "global" as const, slug: global.slug }`; every `DocumentEditSlotOutlet`'s `resource`
  reads `global.admin.components?.edit?...` instead of `collection.admin.components?.edit?...`.
- `builtins={documentEditBuiltinContributions()}` passed unmodified — no `CollectionDeleteAction` appended.
- `VexDocumentProvider`'s `value.id` is omitted (globals have no row id); `value.saved = globalDoc`.
- `DocumentEditRuntimeProvider`'s `onDocumentIdChange` is omitted (`undefined`) — nothing re-points a global.
- The plain (non-versioned) `onSubmit` branch keeps its existing "no `globalDoc` yet → send the
  full form value, not a diff" special case (today's lines 235–239) — unchanged, since this is the
  form's own native submit path, same reasoning as the collection version's `plainUpdateMutation`.
- No Delete button, no `canDelete`/`CRUD_ACTIONS.delete` import.

#### packages/react/src/slots/ComponentErrorBoundary.tsx

1 edit; everything not shown is unchanged.

**1 — add an optional `fallback`, rendered on a throw alongside the inline error.** Replace the
whole file (small — shown complete for clarity, not as a diff):

```tsx
"use client";

import { Component, type ReactNode } from "react";

/**
 * Wraps one contribution — or, since decision 17, one override layer — so a throwing component
 * cannot take down the whole slot, override chain, or surrounding form (S10). Renders an inline
 * error naming the id instead of propagating, optionally alongside `fallback` (the layer beneath
 * a throwing override, per decision 17) — editing other fields, or other contributions/layers,
 * must stay possible.
 */
export class ComponentErrorBoundary extends Component<
  { id: string; fallback?: ReactNode; children: ReactNode },
  { error: Error | undefined }
> {
  state: { error: Error | undefined } = { error: undefined };

  /**
   * Captures a thrown render error so `render` can show the fallback instead.
   *
   * @param error - The error thrown by a descendant component.
   * @returns The new state, carrying the thrown error.
   */
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  /**
   * Renders `fallback` (when given) plus an inline error naming `id` when a child threw,
   * otherwise `this.props.children`.
   *
   * @returns The fallback content, or `this.props.children` when no error occurred.
   */
  render() {
    if (this.state.error) {
      return (
        <>
          {this.props.fallback}
          <div
            role="alert"
            className="rounded-sm border border-destructive/50 bg-destructive/10 p-2 text-xs text-destructive"
          >
            Component "{this.props.id}" failed to render: {this.state.error.message}
          </div>
        </>
      );
    }
    return this.props.children;
  }
}
```

#### packages/react/src/slots/ComponentErrorBoundary.test.tsx

1 edit; everything not shown is unchanged — the existing two `it` blocks stay as-is (`fallback`
defaults to `undefined`, so their assertions are unaffected).

**1 — add a case for the new `fallback` prop, beside the existing "renders an inline error" test.**

```tsx
it("renders fallback alongside the inline error when a child throws", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  render(
    <ComponentErrorBoundary id="acme.broken" fallback={<span>beneath</span>}>
      <Throws />
    </ComponentErrorBoundary>,
  );
  expect(screen.getByText("beneath")).toBeInTheDocument();
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("acme.broken");
  spy.mockRestore();
});
```

#### packages/react/src/slots/SlotOverrideOutlet.tsx

1 edit; everything not shown (imports, JSDoc) is unchanged.

**1 — replace the composition `reduce` and the return, around the existing `resolveComponentOverrides` call.**
Each override layer gets its own `ComponentErrorBoundary` keyed by the override's `id`, falling
back to the stage beneath it; the base `defaultComponent` keeps the protection the old single
outer boundary (keyed by `props.slotId`) gave it, now as the innermost layer.

```tsx
export function SlotOverrideOutlet<TProps extends {}>(props: {
  slotId: SlotId;
  overrides: ComponentOverrideInput<ReactHKT, TProps>[] | undefined;
  defaultComponent: ComponentType<TProps>;
  props: TProps;
}): ReactNode {
  const resolved = resolveComponentOverrides<ReactHKT, TProps>({
    slotId: props.slotId,
    overrides: props.overrides ?? [],
  });

  const DefaultComponent = props.defaultComponent;
  const Base: ComponentType<TProps> = (p) => (
    <ComponentErrorBoundary id={props.slotId}>
      <DefaultComponent {...p} />
    </ComponentErrorBoundary>
  );

  const Composed = resolved.reduce<ComponentType<TProps>>((RenderDefault, override) => {
    const Override = override.component;
    function Composed(p: TProps) {
      return (
        <ComponentErrorBoundary id={override.id} fallback={<RenderDefault {...p} />}>
          <Override {...p} renderDefault={RenderDefault} />
        </ComponentErrorBoundary>
      );
    }
    Composed.displayName = `SlotOverride(${override.id})`;
    return Composed;
  }, Base);

  return <Composed {...props.props} />;
}
```

#### packages/react/src/slots/SlotOverrideOutlet.test.tsx

1 edit; everything not shown is unchanged.

**1 — add a throwing-wrapper case, beside the existing "composes two overrides" test.**

```tsx
it("falls back to the stage beneath a throwing override, with an inline error naming it", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  function Throws(): never {
    throw new Error("boom");
  }
  render(
    <SlotOverrideOutlet
      slotId="field.label"
      overrides={[{ id: "acme.broken", component: Throws }]}
      defaultComponent={Default}
      props={{ label: "x" }}
    />,
  );
  expect(screen.getByTestId("default")).toHaveTextContent("x");
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("acme.broken");
  expect(alert).toHaveTextContent("boom");
  spy.mockRestore();
});
```

#### packages/react/src/slots/resolveFieldComponent.tsx

1 edit; everything not shown is unchanged.

**1 — wrap each override layer in the `reduce` beside the existing `chain.reduce` call.** The base
`builtin` stays unguarded, as today (an unregistered/throwing built-in is a real bug in this
package, not a third-party wrapper).

```tsx
export function resolveFieldComponent(props: {
  fieldType: DataFieldType;
  rootOverrides: ComponentOverrideInput<ReactHKT, FieldComponentProps>[] | undefined;
  fieldOverrides: ComponentOverrideInput<ReactHKT, FieldComponentProps>[] | undefined;
}): ComponentType<FieldComponentProps> {
  const builtin = fieldToFieldComponent(props.fieldType);
  if (!builtin) {
    throw new Error(`Missing component for field type '${props.fieldType}'`);
  }
  const chain = [...(props.rootOverrides ?? []), ...(props.fieldOverrides ?? [])];
  return chain.reduce<ComponentType<FieldComponentProps>>((RenderDefault, override) => {
    const Override = override.component;
    function Composed(p: FieldComponentProps) {
      return (
        <ComponentErrorBoundary id={override.id} fallback={<RenderDefault {...p} />}>
          <Override {...p} renderDefault={RenderDefault} />
        </ComponentErrorBoundary>
      );
    }
    Composed.displayName = `FieldOverride(${override.id})`;
    return Composed;
  }, builtin);
}
```

Add the import: `import { ComponentErrorBoundary } from "./ComponentErrorBoundary";`.

#### packages/react/src/slots/resolveFieldComponent.test.tsx

1 edit; everything not shown is unchanged.

**1 — add a throwing-wrapper-on-a-field case, beside the existing "composes root then field overrides" test.**

```tsx
it("falls back to the previous stage when a field override throws, with an inline error naming it", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  const Component = resolveFieldComponent({
    fieldType: "text",
    rootOverrides: undefined,
    fieldOverrides: [
      {
        id: "acme.fieldThrows",
        component: (): never => {
          throw new Error("boom");
        },
      },
    ],
  });
  const { container } = renderInForm(<Component {...baseProps} />);
  expect(container.querySelector("input")).toBeInTheDocument();
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("acme.fieldThrows");
  expect(alert).toHaveTextContent("boom");
  spy.mockRestore();
});
```

Add the import: `import { screen } from "@testing-library/react";` (alongside the existing `render` import).

#### packages/react/src/slots/resolveFieldCellComponent.tsx

1 edit; everything not shown is unchanged. Same change as `resolveFieldComponent.tsx`.

```tsx
export function resolveFieldCellComponent(props: {
  fieldType: DataFieldType;
  rootOverrides:
    | ComponentOverrideInput<ReactHKT, CellComponentProps<AdminDataField>>[]
    | undefined;
  fieldOverrides:
    | ComponentOverrideInput<ReactHKT, CellComponentProps<AdminDataField>>[]
    | undefined;
}): ComponentType<CellComponentProps<AdminDataField>> {
  const builtin = fieldToCellComponent(props.fieldType);
  if (!builtin) {
    throw new Error(`Missing component for field type '${props.fieldType}'`);
  }
  const chain = [...(props.rootOverrides ?? []), ...(props.fieldOverrides ?? [])];
  return chain.reduce<ComponentType<CellComponentProps<AdminDataField>>>(
    (RenderDefault, override) => {
      const Override = override.component;
      function Composed(p: CellComponentProps<AdminDataField>) {
        return (
          <ComponentErrorBoundary id={override.id} fallback={<RenderDefault {...p} />}>
            <Override {...p} renderDefault={RenderDefault} />
          </ComponentErrorBoundary>
        );
      }
      Composed.displayName = `FieldCellOverride(${override.id})`;
      return Composed;
    },
    builtin,
  );
}
```

Add the import: `import { ComponentErrorBoundary } from "./ComponentErrorBoundary";`.

#### packages/react/src/slots/resolveFieldCellComponent.test.tsx

1 edit; everything not shown is unchanged.

**1 — add a throwing-wrapper case, beside the existing "composes root then field overrides" test.**

```tsx
it("falls back to the previous stage when a cell override throws, with an inline error naming it", () => {
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  const Component = resolveFieldCellComponent({
    fieldType: "text",
    rootOverrides: undefined,
    fieldOverrides: [
      {
        id: "acme.cellThrows",
        component: (): never => {
          throw new Error("boom");
        },
      },
    ],
  });
  renderWithVexProviders(<Component {...baseProps} />);
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent("acme.cellThrows");
  expect(alert).toHaveTextContent("boom");
  spy.mockRestore();
});
```

Add the import: `import { screen } from "@testing-library/react";`.

Verify: `pnpm --filter @vexcms/react test -- CollectionEditView GlobalEditView slots viewSuite`; in `apps/test`, header actions render unchanged

### Step 5 — Core duplicate payload [dev]
Why: pure leaf the React action consumes. Item-id regeneration and stripping framework fields are testable without UI.

- [ ] `packages/core/src/documents/cloneDocumentForDuplicate.ts` + test: strip `_id`, `_creationTime`, the `vex_*` version fields (`removeVexFields`) and `updatedAt`; regenerate array/block item ids (reuse `cloneBlockWithFreshIds`); walk nested group/tabs/blocks
- [ ] `packages/core/src/collections/api/create/server.ts`: optional `status` arg on `CreateServerArgs` so a duplicate can force a draft

> Note: the real framework-field names differ from the interview shorthand (`_status`/`_version` don't exist as such) —
> confirmed against `packages/core/src/collections/constants.ts`, `packages/core/src/versions/constants.ts` and
> `packages/core/src/db/documents.ts`. The actual set: `_id`/`_creationTime` (`CONVEX_SYSTEM_FIELDS`), `vex_status` /
> `vex_publishedAt` / `vex_publishedId` / `vex_activeVersion` (`VERSION_SYSTEM_FIELDS`, versioned collections only), and
> `updatedAt` — a real `fields` entry `defineCollection` injects (`COLLECTION_SYSTEM_FIELDS`), stamped by `stampUpdatedAt`,
> not a Convex/version system column. `@vexcms/core` already has `removeVexFields({ doc })` (`versions/removeVexFields.ts`)
> stripping the first two groups (used by `publish`/`saveDraft` to build version snapshots) — reused here rather than
> re-declaring the same strip set (P-003). It does not strip `updatedAt`, so `cloneDocumentForDuplicate` deletes that key
> itself.
>
> Note: `collections/api/create/server.ts`'s `create()` (the server function the duplicate action in Step 6 will call)
> unconditionally inserts with `vex_status: collection.versions.defaultStatus` — it has no way for a caller to request a
> draft when a collection's `defaultStatus` is `"published"`. That makes decision 9 ("a duplicated document in a versioned
> collection is always a draft") unreachable through the existing API for such a collection. `CreateServerArgs` gains an
> optional `status` override, honored ahead of `collection.versions.defaultStatus`, so Step 6's duplicate action can pass
> `status: "draft"` explicitly. This is the smallest change that makes the "always a draft" guarantee true in every
> configuration; flagging it here since spec-tasks.md names no file for this bullet and `collections/api/**` isn't in this
> step's stated scope, but it is in the spec's overall `touches` list.

#### packages/core/src/documents/cloneDocumentForDuplicate.ts

```ts
import { COLLECTION_SYSTEM_FIELDS } from "../collections/constants";
import { removeVexFields } from "../versions/removeVexFields";
import { ADMIN_FIELDS, cloneBlockWithFreshIds, getDataFields } from "../fields";
import type { AdminField, GenericBlock } from "../fields";

/**
 * Regenerates ids on every array/block item reachable through `field` —
 * a `blocks()`/`group()`/`array()` field, at any nesting depth. Leaf data
 * fields and an unrecognised nested `blockType` are returned unchanged.
 * Mirrors `fields/blocks/utils.ts`'s private `cloneNestedBlockIds`, which
 * only walks a single block's OWN fields — this walks a whole document's.
 *
 * @param props - Input props.
 * @param props.value - The current value at `field`'s path.
 * @param props.field - The field definition describing `value`'s shape.
 * @returns `value`, with every nested block's `id` (and its own nested
 *   blocks) replaced; `value` itself unchanged if `field` is not
 *   `blocks()`/`group()`/`array()`.
 */
function regenerateNestedIds(props: { value: unknown; field: AdminField }): unknown {
  // TODO: implement
  // 1. If `props.value` is `null`/`undefined` → return it unchanged.
  // 2. `props.field.type === ADMIN_FIELDS.blocks.type`:
  //    a. Build a `Map` from each `props.field.blocks[].blockType` to its `BlockConfig`.
  //    b. Map `props.value as GenericBlock[]`: for each item, look up its
  //       `blockType` in the map → if found, `cloneBlockWithFreshIds({ block: item, blockDef })`;
  //       otherwise return the item unchanged.
  //    → fresh `id` per item, plus fresh ids on every block the item itself nests.
  // 3. `props.field.type === ADMIN_FIELDS.group.type`:
  //    a. Copy `props.value` (default `{}`) into a new object.
  //    b. For each `[key, subField]` of `props.field.fields` present on the value,
  //       recurse: `result[key] = regenerateNestedIds({ value: value[key], field: subField })`.
  //    → a named `tabs()` tab already reaches this branch group-shaped, since
  //      `getDataFields` flattens it before this function ever sees it.
  // 4. `props.field.type === ADMIN_FIELDS.array.type`:
  //    a. Map `props.value as unknown[]`, recursing each item against `props.field.items`.
  // 5. Any other field type (leaf data field) → return `props.value` unchanged.
  // Edge cases:
  // - A top-level `blocks()`/`array()` field whose stored value is `undefined` → step 1 short-circuits.
  // - An array/blocks item missing a declared sub-field key → step 3b's `in` check skips it, no crash.
  throw new Error("Not implemented");
}

/**
 * Builds the payload for a duplicated document: the source document's saved
 * values, with every framework field stripped and every array/block item's
 * `id` regenerated so the clone shares no item identity with the original.
 *
 * Decision 8 (spec.md): only framework fields are stripped — `_id`,
 * `_creationTime`, `updatedAt`, and (versioned collections only) `vex_status`,
 * `vex_publishedAt`, `vex_publishedId`, `vex_activeVersion`. Every other
 * value, including unique fields like a `slug`, copies as-is; a unique-value
 * conflict is resolved by the fallback create modal (Step 6, decision 7).
 *
 * @param props - Input props.
 * @param props.fields - The source collection's resolved `fields` map
 *   (`collection.fields`, not yet flattened).
 * @param props.document - The saved document being duplicated, as returned
 *   from `vexConvexApi.get`/`find` (a `VexDocument`/`VexVersionDocument`).
 * @returns A plain object: `props.document` minus every framework field,
 *   with a fresh `id` on every array/block item at any nesting depth. Ready
 *   to pass as `data` to `create()` (Step 6).
 * @throws {Error} Propagated from `getDataFields` if `props.fields` is
 *   malformed (duplicate field key across tabs) — `props.fields` is assumed
 *   to be an already-validated `collection.fields`.
 */
export function cloneDocumentForDuplicate(props: {
  fields: Record<string, AdminField>;
  document: Record<string, unknown>;
}): Record<string, unknown> {
  // TODO: implement
  // 1. `getDataFields({ fields: props.fields })` → `dataFields`, the document's
  //    data-field keys (tabs/row/collapsible already hoisted, named tabs group-shaped).
  // 2. `removeVexFields({ doc: props.document })` → strips `_id`, `_creationTime`,
  //    `vex_status`, `vex_publishedAt`, `vex_publishedId`, `vex_activeVersion`.
  // 3. Delete `COLLECTION_SYSTEM_FIELDS.updatedAt.slug` ("updatedAt") from that
  //    result — `removeVexFields` doesn't cover it (not a Convex/version system
  //    field; a real `fields` entry `defineCollection` injects).
  // 4. Copy the result from step 3 into a new object (`cloned`).
  // 5. For every `[key, field]` of `dataFields` present in `cloned`:
  //    `cloned[key] = regenerateNestedIds({ value: cloned[key], field })`.
  // 6. Return `cloned`.
  // Edge cases:
  // - `props.document` missing a declared optional field → absent from `cloned`
  //   too; step 5's presence check skips it.
  // - A non-versioned collection's document carries no `vex_*` keys → step 2
  //   is a no-op for those keys.
  throw new Error("Not implemented");
}
```

#### packages/core/src/documents/cloneDocumentForDuplicate.test.ts

```ts
import { describe, it, expect } from "vitest";
import { cloneDocumentForDuplicate } from "./cloneDocumentForDuplicate";
import { text, group, array, blocks, tabs, defineBlock } from "../fields";
import type { AdminField } from "../fields";

const itemBlock = defineBlock({
  slug: "item",
  label: "Item",
  fields: { label: text() },
});

const galleryBlock = defineBlock({
  slug: "gallery",
  label: "Gallery",
  fields: {
    items: blocks({ label: "Items", blocks: [itemBlock] }),
  },
});

describe("cloneDocumentForDuplicate", () => {
  it("strips _id, _creationTime and updatedAt, keeping every other field as-is", () => {
    const fields: Record<string, AdminField> = { title: text(), slug: text() };
    const document = {
      _id: "doc1",
      _creationTime: 1700000000000,
      updatedAt: 1700000000000,
      title: "Hello",
      slug: "hello",
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned).toEqual({ title: "Hello", slug: "hello" });
  });

  it("strips every VERSION_SYSTEM_FIELDS member from a versioned collection's document", () => {
    const fields: Record<string, AdminField> = { title: text() };
    const document = {
      _id: "doc1",
      _creationTime: 1700000000000,
      vex_status: "published",
      vex_publishedAt: 1700000000000,
      vex_publishedId: "doc1",
      vex_activeVersion: 3,
      title: "Hello",
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned).toEqual({ title: "Hello" });
  });

  it("regenerates a top-level blocks() field's item ids", () => {
    const fields: Record<string, AdminField> = {
      body: blocks({ label: "Body", blocks: [itemBlock] }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      body: [
        { id: "b1", blockType: "item", label: "A" },
        { id: "b2", blockType: "item", label: "B" },
      ],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const body = cloned.body as { id: string; blockType: string; label: string }[];
    expect(body).toHaveLength(2);
    expect(body[0]?.id).not.toBe("b1");
    expect(body[0]?.label).toBe("A");
    expect(body[1]?.id).not.toBe("b2");
    expect(body[1]?.label).toBe("B");
  });

  it("regenerates ids on a block nested inside another block's own blocks() field", () => {
    const fields: Record<string, AdminField> = {
      body: blocks({ label: "Body", blocks: [galleryBlock] }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      body: [
        {
          id: "g1",
          blockType: "gallery",
          items: [{ id: "i1", blockType: "item", label: "Inner" }],
        },
      ],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const body = cloned.body as { id: string; items: { id: string; label: string }[] }[];
    expect(body[0]?.id).not.toBe("g1");
    expect(body[0]?.items[0]?.id).not.toBe("i1");
    expect(body[0]?.items[0]?.label).toBe("Inner");
  });

  it("regenerates block ids nested inside a group() field", () => {
    const fields: Record<string, AdminField> = {
      hero: group({
        label: "Hero",
        fields: { content: blocks({ label: "Content", blocks: [itemBlock] }) },
      }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      hero: { content: [{ id: "c1", blockType: "item", label: "Hi" }] },
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const hero = cloned.hero as { content: { id: string; label: string }[] };
    expect(hero.content[0]?.id).not.toBe("c1");
    expect(hero.content[0]?.label).toBe("Hi");
  });

  it("regenerates block ids nested inside an array() field's items", () => {
    const fields: Record<string, AdminField> = {
      sections: array({
        label: "Sections",
        items: group({ label: "Section", fields: { content: blocks({ label: "Content", blocks: [itemBlock] }) } }),
      }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      sections: [{ content: [{ id: "s1", blockType: "item", label: "First" }] }],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const sections = cloned.sections as { content: { id: string; label: string }[] }[];
    expect(sections[0]?.content[0]?.id).not.toBe("s1");
    expect(sections[0]?.content[0]?.label).toBe("First");
  });

  it("regenerates block ids nested inside a named tab, which getDataFields flattens to a group-shaped field", () => {
    const fields: Record<string, AdminField> = {
      info: tabs({
        tabs: [
          { label: "Content", fields: { title: text() } },
          { label: "SEO", name: "seo", fields: { gallery: blocks({ label: "Gallery", blocks: [itemBlock] }) } },
        ],
      }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      title: "Hello",
      seo: { gallery: [{ id: "t1", blockType: "item", label: "Tab item" }] },
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned.title).toBe("Hello");
    const seo = cloned.seo as { gallery: { id: string; label: string }[] };
    expect(seo.gallery[0]?.id).not.toBe("t1");
    expect(seo.gallery[0]?.label).toBe("Tab item");
  });

  it("leaves an unrecognised nested blockType's id untouched", () => {
    const fields: Record<string, AdminField> = {
      body: blocks({ label: "Body", blocks: [itemBlock] }),
    };
    const document = {
      _id: "doc1",
      _creationTime: 1,
      body: [{ id: "u1", blockType: "not-registered", label: "A" }],
    };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    const body = cloned.body as { id: string }[];
    expect(body[0]?.id).toBe("u1");
  });

  it("leaves a plain array() of text items unchanged beyond the framework-field strip", () => {
    const fields: Record<string, AdminField> = {
      tags: array({ label: "Tags", items: text() }),
    };
    const document = { _id: "doc1", _creationTime: 1, tags: ["a", "b"] };
    const cloned = cloneDocumentForDuplicate({ fields, document });
    expect(cloned.tags).toEqual(["a", "b"]);
  });
});
```

#### packages/core/src/collections/api/create/server.ts

1 edit; everything not shown is unchanged.

**1 — `CreateServerArgs` gains an optional `status` override, and `create()` honors it ahead of `collection.versions.defaultStatus`.**

```ts
import type { VexVersionStatus } from "../../../versions";
```

```ts
export interface CreateServerArgs<
  DataModel extends GenericDataModel,
  TCollectionSlug extends CollectionSlug,
> extends GenericMutationServerParams<DataModel> {
  /** The collection slug to insert into. */
  collection: TCollectionSlug;
  /**
   * Field values for the new document. `_id` and `_creationTime` are
   * excluded — Convex assigns these automatically.
   *
   * Passed through `v.any()` at the network boundary; CLI codegen validates
   * the shape against the Convex schema at build time.
   */
  data: Expand<
    BetterOmit<DocumentByName<DataModel, TableNamesInDataModel<DataModel>>, "_creationTime" | "_id">
  >;
  /**
   * Overrides `collection.versions.defaultStatus` for this one insert.
   * Ignored for a collection that doesn't declare `versions.drafts`. The
   * duplicate action (Step 6) passes `"draft"` here so a clone of a
   * `defaultStatus: "published"` collection's document still lands as a
   * draft (spec.md decision 9).
   */
  status?: VexVersionStatus;
}
```

Beside the existing `const status = collection.versions.defaultStatus;` line in `create()`:

```ts
  if (collection.versions.drafts) {
    const status = args.status ?? collection.versions.defaultStatus;
```

Verify: pnpm --filter @vexcms/core test -- duplicate

### Step 6 — Duplicate action + fallback modal [dev]

- [ ] `packages/react/src/collections/useDuplicateCollectionDocument.ts` (new): clones the current document, tries `create`, and on a server rejection hands the clone to a fallback-modal state
- [ ] `packages/react/src/collections/CollectionDuplicateAction.tsx` (new): `vex.duplicate` contribution — the header button, gated on `create` permission, plus the all-fields fallback dialog
- [ ] `packages/react/src/collections/CollectionEditView.tsx`: appends `CollectionDuplicateAction` to the builtins passed into its `edit.header.actions` outlet, non-media collections only (media documents render through `MediaCollectionEditView`, which does not mount `documentEditBuiltinContributions`/this outlet at all, per Step 4) — `documentEditBuiltinContributions()` itself is untouched by this step
- [ ] `packages/react/src/collections/CreateDocumentForm.tsx`: `fieldsMode?: "required" | "all"` (default `"required"`), `initialValues?`, `submitOnOpen?: boolean`; catches a rejected create and applies it as a field error so `AppForm`'s `focusFirstFieldError` can find it
- [ ] `packages/react/src/collections/CreateDocumentModal.tsx`: forwards the same three new props to `CreateDocumentForm`
- [ ] `packages/react/src/collections/CollectionEditView.test.tsx`: three new `it`s in a `CollectionEditView — duplicate` block (success navigation, conflict fallback auto-submit + focus, versioned → draft), reusing the file's existing `useConvexMutation` mock

> Note: spec-tasks.md names `packages/react/src/testing/viewSuite.ts` as the file for these
> three cases. `viewSuite.ts` is a shared kit imported by every view's own `*.test.tsx`
> (`CollectionEditView.test.tsx`, `GlobalEditView.test.tsx`, `MediaCollectionEditView.test.tsx`,
> …), each of which installs its OWN `vi.mock("@convex-dev/react-query", …)` at module scope
> (`CollectionEditView.test.tsx:15-20`) to stand in a `convexMutationMock`. A module-level
> `vi.mock` call added inside `viewSuite.ts` itself would apply to every test file that
> transitively imports it — colliding with `CollectionEditView.test.tsx`'s own mock and
> silently breaking every OTHER view's real-mutation assertions. The conflict-fallback case
> genuinely needs a rejected mutation, so these three cases are added to
> `packages/react/src/collections/CollectionEditView.test.tsx`'s existing
> `vi.mock`-backed `describe` blocks instead — the exact pattern its own
> `CollectionEditView — diff submit` block already uses.

> Note: Step 5 (per its own session) added an optional `status` override to `CreateServerArgs`
> (`packages/core/src/collections/api/create/server.ts`) — `create({ …, status: "draft" })`
> forces a draft insert on a versioned collection regardless of `collection.versions.defaultStatus`.
> `useDuplicateCollectionDocument` passes it explicitly; `cloneDocumentForDuplicate` itself only sees
> `{ fields, document }` (no `versions` config) so it cannot decide this on its own.

#### packages/react/src/collections/useDuplicateCollectionDocument.ts

New file.

> Note: Step 7 runs after this step and does not exist yet, so the success handler below
> uses `window.location.assign(adminHref(...))` — the same hard-navigation this step's own
> tests (`assignSpy = vi.spyOn(window.location, "assign")`) assert on. Step 7 introduces
> `useVexNavigate`/`useReleaseUnsavedChangesGuard`; its own session appends the follow-up
> edit that swaps this call, at the end of this file.

```tsx
"use client";

import { useState } from "react";
import {
  cloneDocumentForDuplicate,
  VERSION_STATUSES,
  vexConvexApi,
  type CollectionConfig,
  type VexDocument,
} from "@vexcms/core";
import { adminHref } from "../admin/adminHref";
import { useVexConfig } from "../config/VexConfigContext";
import { useVexMutation } from "../hooks";

/** Props for {@link useDuplicateCollectionDocument}. */
export interface UseDuplicateCollectionDocumentProps {
  /** The collection `document` belongs to — supplies `fields` for the clone and `versions.drafts` for the forced-draft call. */
  collection: CollectionConfig;
  /** The currently-loaded document to duplicate. */
  document: VexDocument;
}

/** The all-fields fallback dialog's state, returned by {@link useDuplicateCollectionDocument}. */
export interface DuplicateFallbackState {
  /** Whether the fallback dialog is open. */
  open: boolean;
  /** The clone to prefill the fallback form with — only set while `open`. */
  initialValues: Record<string, unknown> | undefined;
  /** Closes the fallback dialog. */
  close: () => void;
}

/** Return value of {@link useDuplicateCollectionDocument}. */
export interface UseDuplicateCollectionDocumentResult {
  /** Starts a duplicate attempt. Never throws — a rejection opens `fallback` instead. */
  duplicate: () => void;
  /** Whether the first (clone-and-create) attempt is in flight. */
  isPending: boolean;
  /** The all-fields fallback dialog's state and close handler. */
  fallback: DuplicateFallbackState;
}

/**
 * Drives decision 6/7/9's two-step duplicate flow: clone the loaded document,
 * try a server `create` with it, and navigate to the new document on success.
 * On a rejected create (a unique-field conflict, most commonly), opens the
 * all-fields fallback dialog prefilled with the same clone instead of
 * surfacing a toast — `CollectionDuplicateAction` renders that dialog around
 * `CreateDocumentForm` with `fieldsMode: "all"`, `initialValues: clone`, and
 * `submitOnOpen: true`, so the SAME failing create re-runs there and
 * `AppForm`'s `focusFirstFieldError` lands the user on the exact input.
 *
 * @param props - The collection and document being duplicated.
 * @returns `{ duplicate, isPending, fallback }` — see {@link UseDuplicateCollectionDocumentResult}.
 * @throws Never — `duplicate()` itself never throws; a create rejection is
 *   routed to `fallback`, not re-thrown.
 */
export function useDuplicateCollectionDocument(
  props: UseDuplicateCollectionDocumentProps,
): UseDuplicateCollectionDocumentResult {
  // TODO: implement
  // 1. const config = useVexConfig() — for `adminHref`'s basePath.
  // 2. const [fallbackClone, setFallbackClone] = useState<Record<string, unknown> | undefined>(undefined)
  //    → undefined means the fallback dialog is closed; a defined clone means it is open.
  // 3. const { mutateAsync, isPending } = useVexMutation({
  //      collection: props.collection.slug,
  //      mutationFn: vexConvexApi.create,
  //      operation: "create",
  //      getChanges: ({ args, result }) => [{ after: { ...args.data, _id: result } }],
  //      // No `errorToast` — a rejection opens the fallback dialog instead of a toast.
  //    })
  // 4. function duplicate():
  //    a. const clone = cloneDocumentForDuplicate({ fields: props.collection.fields, document: props.document })
  //    b. const isVersioned = props.collection.versions.drafts
  //       → decision 9: a duplicate in a versioned collection is always a draft, regardless
  //         of `collection.versions.defaultStatus` — passed as `create`'s `status` override
  //         (Step 5), not baked into `clone` itself (`cloneDocumentForDuplicate` has no
  //         `versions` config to decide this from).
  //    c. void mutateAsync({
  //         collection: props.collection.slug,
  //         data: clone,
  //         ...(isVersioned ? { status: VERSION_STATUSES.draft.key } : {}),
  //       })
  //       .then((id) => { window.location.assign(adminHref({ type: "document", slug: props.collection.slug, id }, config.basePath)); })
  //       .catch(() => { setFallbackClone(clone); })
  //       → success: hard navigation to the new document's edit page (decision 6 — "one click").
  //       → rejection: never toasted; `setFallbackClone` opens the fallback dialog instead.
  // 5. return {
  //      duplicate,
  //      isPending,
  //      fallback: {
  //        open: fallbackClone !== undefined,
  //        initialValues: fallbackClone,
  //        close: () => setFallbackClone(undefined),
  //      },
  //    }
  // Edge cases:
  // - A second `duplicate()` click while the first is still pending: `isPending` already
  //   disables `CollectionDuplicateAction`'s button (mirrors `CreateDocumentForm`'s own in-flight guard),
  //   so this hook does not need its own re-entrancy guard.
  // - The fallback dialog's own create (inside `CreateDocumentForm`, via `submitOnOpen`) is a
  //   SEPARATE `useVexMutation` instance owned by `CreateDocumentForm` itself — this hook's
  //   `mutateAsync`/`isPending` cover only the FIRST attempt.
  throw new Error("Not implemented");
}
```

#### packages/react/src/collections/CollectionDuplicateAction.tsx

New file.

```tsx
"use client";

import { useState } from "react";
import { BUILTIN_CONTRIBUTION_IDS, CRUD_ACTIONS, type ComponentContributionInput } from "@vexcms/core";
import type { ReactHKT } from "../adapter";
import { usePermission } from "../access";
import { useVexConfig } from "../config/VexConfigContext";
import { useVexDocument } from "../documents/VexDocumentContext";
import { Button, Dialog, DialogContent, DialogHeader } from "../ui";
import { ModalSurfaceProvider } from "../modals";
import { CreateDocumentForm } from "./CreateDocumentForm";
import { useDuplicateCollectionDocument } from "./useDuplicateCollectionDocument";
import type { EditSlotProps } from "@vexcms/core";

/**
 * `vex.duplicate` built-in — `edit.header.actions` (collections only; appended directly by
 * `CollectionEditView.tsx` to the builtins it passes into `DocumentEditSlotOutlet`, never through
 * `documentEditBuiltinContributions`). Clones the loaded document and
 * either creates it outright or falls back to an all-fields create dialog
 * (decisions 6/7) prefilled with the clone and auto-submitted, so the
 * conflicting field is the one `AppForm`'s `focusFirstFieldError` lands on.
 *
 * @param props - `EditSlotProps` — `{ kind: "collection", slug }`.
 * @returns The Duplicate button, or `null` while `useVexDocument().saved` is
 *   not yet loaded or the caller lacks `create` on this collection.
 * @throws Never — a failed duplicate opens the fallback dialog, it does not throw.
 */
export function CollectionDuplicateAction(props: EditSlotProps) {
  // TODO: implement
  // 1. const config = useVexConfig(); const collection = config.collections.find((c) => c.slug === props.slug)
  //    → collection is always resolved here: this component only mounts inside a
  //      `CollectionEditView` for `props.slug`, which already required the same lookup
  //      to render at all. No `if (!collection) return null` needed — contrast
  //      `CreateDocumentModal`, which resolves a slug from the URL and CAN miss.
  // 2. const { saved, canEdit: _canEdit } = useVexDocument() — `saved` is the loaded document
  //    to clone; `undefined` on first paint before the query resolves → return null.
  // 3. const canCreate = usePermission({ resource: props.slug, action: CRUD_ACTIONS.create })
  //    → false: return null. Decision from spec-tasks step 6: "gated on create permission".
  // 4. const { duplicate, isPending, fallback } = useDuplicateCollectionDocument({ collection: collection!, document: saved! })
  // 5. Render:
  //    <>
  //      <Button type="button" variant="outline" icon="Copy" isPending={isPending} onClick={duplicate}>
  //        Duplicate
  //      </Button>
  //      <Dialog open={fallback.open} onOpenChange={(open) => { if (!open) fallback.close(); }}>
  //        <ModalSurfaceProvider>
  //          <DialogContent className="flex h-[80svh] w-full flex-col sm:h-[50svh] sm:w-[50svw]">
  //            <DialogHeader>Duplicate {collection!.labels.singular} — resolve the conflict</DialogHeader>
  //            {fallback.open && (
  //              <CreateDocumentForm
  //                collection={collection!}
  //                fieldsMode="all"
  //                initialValues={fallback.initialValues}
  //                submitOnOpen
  //                onCreated={() => fallback.close()}
  //                onCancel={fallback.close}
  //              />
  //            )}
  //          </DialogContent>
  //        </ModalSurfaceProvider>
  //      </Dialog>
  //    </>
  //    → `fallback.open && (...)` (not just `fallback.initialValues`) remounts
  //      `CreateDocumentForm` fresh each time the dialog opens, so `submitOnOpen`'s
  //      mount-effect fires again on a second duplicate attempt.
  // Edge cases:
  // - `saved` belongs to `useVexDocument()`, which Step 3 defines as throwing outside its
  //   provider — this component only mounts where Step 4 already wraps the edit view in it.
  throw new Error("Not implemented");
}

/** `edit.header.actions` contribution wrapping {@link CollectionDuplicateAction}. */
export const duplicateContribution: ComponentContributionInput<ReactHKT, EditSlotProps> = {
  id: BUILTIN_CONTRIBUTION_IDS.edit.duplicate,
  component: CollectionDuplicateAction,
};
```

#### packages/react/src/collections/index.ts

1 edit; everything not shown is unchanged (`CollectionDeleteAction`'s export was added by Step 4). Beside it:

```ts
export * from "./CollectionDuplicateAction";
export * from "./useDuplicateCollectionDocument";
```

#### packages/react/src/collections/CollectionEditView.tsx

1 edit; everything not shown is unchanged — Step 4's `edit.header.actions` outlet, anchored
beside `CollectionDeleteAction` in its `builtins` array:

```tsx
import { duplicateContribution } from "./CollectionDuplicateAction";

// `CollectionEditForm`'s `edit.header.actions` outlet — appended only here, non-media
// collections only (decision 12; `MediaCollectionEditView` never mounts this outlet at all):
builtins={[
  ...documentEditBuiltinContributions(),
  { id: BUILTIN_CONTRIBUTION_IDS.edit.delete, component: CollectionDeleteAction },
  duplicateContribution,
]}
```

#### packages/react/src/collections/CreateDocumentForm.tsx

5 edits; everything not shown is unchanged.

**1 — three new optional props,** anchored in `CreateDocumentFormProps` right after
`onSubmittingChange`:

```tsx
  /**
   * Which fields to render. `"required"` (default) is the quick-create form's
   * existing behavior. `"all"` is the duplicate fallback's all-fields mode
   * (decision 7) — every field the caller can read, not just the required ones.
   */
  fieldsMode?: "required" | "all";
  /**
   * Pre-fills the form's default values, overlaid on the fields' own declared
   * defaults — the same `document` overlay `useFieldsForm` already applies in
   * edit mode. The duplicate fallback passes the clone here.
   */
  initialValues?: Record<string, unknown>;
  /**
   * Submits once, on mount, instead of waiting for a user click — the
   * duplicate fallback's "submits immediately" behavior (decision 7). Ignored
   * on every later render; a dialog that stays open across a failed
   * `submitOnOpen` attempt waits for the user from then on.
   */
  submitOnOpen?: boolean;
```

**2 — read the new props,** anchored in the destructured parameter list:

```tsx
export function CreateDocumentForm({
  collection,
  onCreated,
  onCancel,
  onSubmittingChange,
  fieldsMode = "required",
  initialValues,
  submitOnOpen = false,
}: CreateDocumentFormProps) {
```

**3 — `fieldKeys` honors `fieldsMode`,** replacing the existing `.filter(…required…)` chain:

```tsx
  const dataFields = getDataFields({ fields: collection.fields });
  const fieldKeys =
    fieldsMode === "all"
      ? Object.keys(dataFields)
      : Object.entries(dataFields)
          .filter(([, fieldDef]) => fieldDef.required)
          .map(([fieldKey]) => fieldKey);
```

**4 — `useFieldsForm` takes `document: initialValues`, and a failed create applies its
field error instead of only toasting,** anchored at the existing `useFieldsForm({ … })` call
(`CreateDocumentForm.tsx:72-85`):

```tsx
  const form = useFieldsForm({
    fields: collection.fields,
    document: initialValues,
    readableFieldKeys: fieldKeys,
    onSubmit: async ({ value }) => {
      let id: string;
      try {
        id = await mutateAsync({ collection: collection.slug, data: value });
      } catch (error) {
        applyVexFieldErrors(form, error);
        return;
      } finally {
        endSubmit();
      }
      onCreated(id);
    },
    onSubmitInvalid: endSubmit,
  });
```

> `applyVexFieldErrors` recognizes exactly the two `ConvexError` shapes a rejected `create`
> can throw (`utils/errors.ts:65-74`) — a named-field validation failure (e.g. a unique-slug
> conflict) or a Zod schema failure — and sets the matching field's `errorMap.onSubmit`,
> which is what `AppForm`'s `focusFirstFieldError` effect (`AppForm.tsx:74-92`) scrolls to and
> focuses once `submissionAttempts` ticks past this failed attempt.

**5 — `submitOnOpen` fires once, after `form` exists,** anchored after the `useFieldsForm`
call, before the `return`:

```tsx
  const submitOnOpenRef = useRef(submitOnOpen);
  useEffect(() => {
    if (!submitOnOpenRef.current) return;
    submitOnOpenRef.current = false;
    void form.handleSubmit();
  }, [form]);
```

**6 — new imports,** anchored beside the existing `useRef, useState` and `../forms`/`../hooks`
imports:

```tsx
import { useEffect, useRef, useState } from "react";
import { applyVexFieldErrors } from "../utils/errors";
```

#### packages/react/src/collections/CreateDocumentModal.tsx

2 edits; everything not shown is unchanged.

**1 — forward the three new props,** anchored on the `CreateDocumentModal` props parameter:

```tsx
export function CreateDocumentModal(props: {
  collection: CollectionSlug;
  fieldsMode?: "required" | "all";
  initialValues?: Record<string, unknown>;
  submitOnOpen?: boolean;
}) {
```

**2 — pass them through to `CreateDocumentForm`,** anchored on the existing
`<CreateDocumentForm …>` element:

```tsx
        <CreateDocumentForm
          collection={collection}
          fieldsMode={props.fieldsMode}
          initialValues={props.initialValues}
          submitOnOpen={props.submitOnOpen}
          onCreated={() => setOpen(null)}
          onCancel={() => setOpen(null)}
          onSubmittingChange={setIsSubmitting}
        />
```


#### packages/react/src/collections/CollectionEditView.test.tsx

2 edits; everything not shown is unchanged.

**1 — two new imports,** anchored beside the existing `@vexcms/core` and `convex/values`-adjacent
imports:

```tsx
import { defineAccess, defineCollection, defineConfig, text, VERSION_STATUSES } from "@vexcms/core";
import { ConvexError } from "convex/values";
```

**2 — a new `describe` block,** appended after the file's last block (`CollectionEditView —
document appearing after a missing prefetch`, closing `});` at end of file). Reuses this
file's own module-level `convexMutationMock` (`CollectionEditView.test.tsx:15-20`) — every
`useVexMutation` call in the tree, including `CollectionDuplicateAction`'s own `create` attempt and
the fallback `CreateDocumentForm`'s, goes through it.

```tsx
describe("CollectionEditView — duplicate", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset();
  });

  it("navigates to the new document on a successful duplicate", async () => {
    const assignSpy = vi.spyOn(window.location, "assign").mockImplementation(() => undefined);
    convexMutationMock.mockResolvedValueOnce("newDoc1");
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "a", title: "Original" }));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "Duplicate" }));

    await waitFor(() => expect(assignSpy).toHaveBeenCalledWith("/admin/collections/posts/newDoc1"));
    assignSpy.mockRestore();
  });

  it("opens the all-fields fallback and focuses the conflicting field when the create is rejected", async () => {
    convexMutationMock.mockRejectedValueOnce(
      new ConvexError({ message: "status already taken", field: "status" }),
    );
    const doc = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "taken", title: "Original" }),
    );
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "Duplicate" }));

    // The fallback dialog opens prefilled with the clone, fields: "all" (both `status` and
    // `title`, not just the required `status`), and auto-submits via `submitOnOpen`.
    const dialog = await waitFor(() => utils.getByRole("dialog"));
    const statusInput = await waitFor(() => {
      const input = dialog.querySelector("#status") as HTMLInputElement | null;
      expect(input).not.toBeNull();
      return input!;
    });
    expect(dialog.querySelector("#title")).not.toBeNull();
    expect(statusInput.value).toBe("taken");

    // `submitOnOpen` re-ran the same create, which rejected the same way — `applyVexFieldErrors`
    // put the server's message on `status`, and `AppForm`'s `focusFirstFieldError` focused it.
    await waitFor(() => expect(statusInput).toHaveFocus());
    expect(dialog).toHaveTextContent("status already taken");
  });

  it("forces a draft on a versioned collection even when defaultStatus is published", async () => {
    convexMutationMock.mockResolvedValueOnce("newDoc2");
    const assignSpy = vi.spyOn(window.location, "assign").mockImplementation(() => undefined);
    const versionedCollection = {
      ...testCollection,
      // Spread the resolved `versions` (autosave, cascadeDelete defaults) and override only
      // `drafts`/`defaultStatus` — a resolved config never lacks the rest.
      versions: { ...testCollection.versions, drafts: true, defaultStatus: VERSION_STATUSES.published.key },
    } as unknown as typeof testCollection;
    const config = defineConfig({ collections: [versionedCollection] });
    const doc = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "a", title: "Original", vex_status: "published" }),
    );
    const utils = renderView(
      createElement(CollectionEditView, { collection: versionedCollection.slug, documentId: doc }),
      { convex: t, config },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "Duplicate" }));

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]).toMatchObject({
      status: VERSION_STATUSES.draft.key,
    });
    assignSpy.mockRestore();
  });
});
```

Verify: pnpm --filter @vexcms/react test -- CollectionEditView CreateDocumentForm CreateDocumentModal; in the browser, duplicate a post and land on the new id; duplicate with a unique-slug conflict, the modal opens and focuses the slug

### Step 7 — Navigation-guard adapter contract + React guard + `useVexNavigate` [dev]

> Note: `packages/react/src/versions/useAutosave.tsx`'s `AutosaveStatus` is
> `"idle" | "saving" | "saved" | "error"`. During the debounce window
> `status` stays `"idle"`/`"saved"` — it only flips to `"saving"` once
> `runSave` actually starts, after the debounce elapses — and unmounting
> mid-debounce clears the pending timer without ever reaching `"saving"`.
> So the guard cannot key on `status` alone for an autosaved document: a
> fresh keystroke sitting in the debounce window is unsaved work, but
> `status` still reads `"saved"` from the previous save. This step adds
> `hasUnsavedChanges` to `UseAutosaveResult` (true for that debounce window
> too) and the guard blocks on THAT, not `status`.

> Note: `useVexDocument`/`VexDocumentProvider` (Step 3) and `EditSlotProps` (Step 2) keep their
> fixed shapes — neither carries a release function or navigation guard. Built-ins run inside
> `SlotOutlet` with no custom props, so this step adds one small, additional context — now named
> `UnsavedChangesGuardContext`, co-located in `useUnsavedChangesGuard.ts`, the same file that owns
> `release` — carrying BOTH `release` and `attemptNavigation` (spec decision 2: `useVexNavigate` consults
> the same blocking state and the same mounted `UnsavedChangesDialog` as in-app link clicks and
> back/forward, instead of a second dialog instance). It is wired for real here (the `Provider`
> wraps both edit views); the consumers are Step 4's `vex.save`/`vex.delete` and Step 6's
> `vex.duplicate` built-ins, which call `useReleaseUnsavedChangesGuard()` in their mutation success
> handler, right before calling `useVexNavigate()`'s returned function — named here, not fabricated,
> since those files don't exist yet.

- [ ] `packages/react/src/config/useFrameworkComponents.ts`: add the `navigationBlocker` and
      `useNavigate` capabilities to the adapter contract (spec decision 2)
- [ ] `packages/react/src/versions/useAutosave.tsx` + tests: add `hasUnsavedChanges` to
      `UseAutosaveResult` (spec decision 5) — true during the debounce window and while `status` is
      `"saving"`/`"error"`, false once a successful save's reset drops the diff to empty
- [ ] `packages/react/src/forms/useUnsavedChangesGuard.ts` + `UnsavedChangesDialog.tsx` + tests:
      dirty = `!isDefaultValue`; autosave docs block only while `useAutosave().hasUnsavedChanges`;
      `beforeunload` registered while blocking; `UnsavedChangesGuardContext` carries `release` and
      `attemptNavigation`
- [ ] `packages/react/src/config/useVexNavigate.ts` + tests: client-side programmatic navigation
      for built-ins' post-mutation redirects, falling back to `window.location.assign`, guarded by
      the active `UnsavedChangesGuardContext`
- [ ] Wire into both edit views: pass `hasUnsavedChanges` to the guard; release the guard after a
      successful save, delete or duplicate navigation
- [ ] `packages/react/src/collections/CollectionDeleteAction.tsx`: swap `window.location.assign` for `useVexNavigate`, calling `release()` first
- [ ] `packages/react/src/collections/useDuplicateCollectionDocument.ts`: same swap on the create-success path

#### packages/react/src/config/useFrameworkComponents.ts

3 edits; everything not shown is unchanged.

**1 — new adapter capability, beside the existing `VexImageProps` interface (before `FrameworkComponents`).**

```ts
/**
 * Framework adapter capability for intercepting navigation away from a
 * dirty edit view (decisions 1–2). `@vexcms/react` never imports a router —
 * `useUnsavedChangesGuard` calls `useBlocker` unconditionally and the
 * adapter decides how to intercept in-app link clicks and back/forward for
 * its framework (unload is NOT this adapter's job — `useUnsavedChangesGuard`
 * registers `beforeunload` itself). `@vexcms/next` is the only
 * implementation shipped in 0.1.0 (Step 8); a TanStack Start adapter would
 * implement the same contract without touching `@vexcms/react`.
 */
export interface NavigationBlockerAdapter {
  /**
   * Registers interception for the lifetime of the calling component,
   * re-registering whenever `when` changes. A Rules-of-Hooks-safe hook:
   * called every render regardless of `when`'s value.
   *
   * @param props - Blocker props.
   * @param props.when - Whether navigation should currently be intercepted.
   * @param props.onBlock - Called with a `proceed` callback instead of
   *   letting a blocked navigation through; calling `proceed()` lets that
   *   ONE navigation complete (a Leave click, or a released guard).
   */
  useBlocker(props: { when: boolean; onBlock: (proceed: () => void) => void }): void;
}
```

**2 — `navigationBlocker` and `useNavigate` fields, end of the `FrameworkComponents` interface (after the existing `Image` field).**

```ts
  /**
   * Intercepts in-app navigation away from a dirty edit view so
   * `useUnsavedChangesGuard` can show the Stay/Leave dialog. Next.js:
   * `useNextNavigationBlocker` from `@vexcms/next` (Step 8). Omitted →
   * in-app navigation is never intercepted; the `beforeunload` native
   * prompt still fires on tab close / hard reload.
   */
  navigationBlocker?: NavigationBlockerAdapter;
  /**
   * Client-side programmatic navigation (spec decision 2) — consumed ONLY by
   * `useVexNavigate`, for a built-in's post-mutation redirect (after
   * delete, after a duplicate's create resolves). Everything clickable
   * keeps using `VexLink`/`Link`, never this. Next.js:
   * `@vexcms/next`'s wrapper around `useRouter().push` from
   * `next/navigation` (Step 8). Omitted → `useVexNavigate` falls back to
   * `window.location.assign`, a full page navigation.
   *
   * @returns A hook — called unconditionally, like any other hook, at the
   *   top of `useVexNavigate` — returning the actual
   *   `(href: string) => void` navigate function.
   */
  useNavigate?: () => (href: string) => void;
```

#### packages/react/src/config/index.ts

2 edits; everything not shown is unchanged.

**1 — re-export the new type, beside the existing `FrameworkComponents` type export.**

```ts
export type {
  VexLinkProps,
  VexImageProps,
  FrameworkComponents,
  NavigationBlockerAdapter,
} from "./useFrameworkComponents";
```

**2 — re-export the new hook, beside the existing `useFrameworkComponents` export.**

```ts
export { useVexNavigate } from "./useVexNavigate";
```

#### packages/react/src/index.ts

2 edits; everything not shown is unchanged.

**1 — public type export, beside the existing config re-export block (`VexConfigContext, VexConfigProvider, useVexConfig, useVexAccess, useStorageAdapterMap`).**

```ts
export type { NavigationBlockerAdapter } from "./config";
```

**2 — public hook export, right after it.**

```ts
export { useVexNavigate } from "./config";
```

#### packages/react/src/versions/useAutosave.tsx

2 edits; everything not shown is unchanged.

**1 — `hasUnsavedChanges` field, beside the existing `error` field on `UseAutosaveResult`.**

```ts
  /**
   * `true` whenever there is work not yet durably saved: a change still
   * sitting in the debounce window (`status` is still `"idle"` or
   * `"saved"` there — see {@link AutosaveStatus}), a save currently in
   * flight (`status === "saving"`), or the last save attempt failed
   * (`status === "error"`). `false` once a save succeeds AND the caller's
   * `onSave` has reset its form to match, dropping `props.values` back to
   * an empty diff (spec decision 5) — use this, not `status` alone, to decide
   * whether navigating away would lose work.
   */
  hasUnsavedChanges: boolean;
```

**2 — compute it and add it to the return, replacing `return { status, lastSavedAt, error };`.**

```ts
  // Mirrors the skip conditions in the effect above: a non-empty diff that
  // doesn't yet match the last successful save is unsaved work, regardless
  // of `status` (the debounce window keeps `status` at `"idle"`/`"saved"`).
  // The empty-diff check matters right after a successful save: the
  // caller's `onSave` resets its form so `props.values` drops to `{}`,
  // which differs from the non-empty `lastSavedValuesRef.current` by
  // `valuesEqual` but means "nothing unsaved", not "save `{}`".
  const hasUnsavedChanges =
    status === "saving" ||
    status === "error" ||
    (Object.keys(props.values).length > 0 &&
      !valuesEqual(props.values, lastSavedValuesRef.current));

  return { status, lastSavedAt, error, hasUnsavedChanges };
```

#### packages/react/src/versions/useAutosave.test.tsx

1 edit; everything not shown is unchanged.

**1 — three new cases, added after the existing `"never saves an empty change set…"` test, before the closing `});` of the `describe("useAutosave", …)` block.**

```tsx
  it("hasUnsavedChanges is true during the debounce window, before status ever reaches saving", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(999);
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it("hasUnsavedChanges is false once a successful save's reset drops the diff to empty", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await flushPromises();
    });
    expect(result.current.status).toBe("saved");

    // The edit view resets its form after the save: the diff drops to `{}`.
    rerender({ values: {} });

    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it("hasUnsavedChanges stays true after a failed save", async () => {
    const onSave = vi.fn().mockRejectedValueOnce(new Error("boom"));
    const { rerender, result } = renderHook(
      ({ values }) => useAutosave({ values, onSave, debounceMs: 1000 }),
      { initialProps: { values: { title: "A" } } },
    );

    rerender({ values: { title: "B" } });
    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.hasUnsavedChanges).toBe(true);
  });
```

#### packages/react/src/forms/useUnsavedChangesGuard.ts

New file.

```ts
"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * What {@link useUnsavedChangesGuard} shares with the rest of the edit view
 * tree via {@link UnsavedChangesGuardContext}.
 */
export interface UnsavedChangesGuardContextValue {
  /**
   * One-shot bypass: call right before an app-initiated navigation (a
   * successful save, delete or duplicate) so it isn't itself intercepted.
   * Re-arms automatically the next time the computed dirty/autosave state
   * goes back to blocking.
   */
  release: () => void;
  /**
   * Routes a programmatic navigation attempt through the SAME blocking
   * state and the SAME mounted `UnsavedChangesDialog` as an in-app link
   * click or back/forward (spec decision 2) — `useVexNavigate`'s only way to
   * consult the guard, since it has no access to the guard's internal
   * `proceedRef`/`open` state otherwise.
   *
   * @param proceed - Performs the actual navigation. Called synchronously,
   *   right away, when the guard isn't currently blocking; otherwise held
   *   until — and only called if — the user clicks Leave.
   */
  attemptNavigation: (proceed: () => void) => void;
}

/**
 * Carries the active edit view's guard so a built-in that triggers its own
 * post-success navigation — `vex.save`, `vex.delete` (Step 4) and
 * `vex.duplicate` (Step 6), via `useVexNavigate` — can bypass or consult it
 * for that one navigation. `undefined` outside an edit view (e.g. a
 * `viewSuite` harness that doesn't mount the guard) — consumers treat that
 * as "never blocking".
 */
export const UnsavedChangesGuardContext = createContext<
  UnsavedChangesGuardContextValue | undefined
>(undefined);

/**
 * @returns The nearest edit view's `release()`, or a no-op outside one.
 */
export function useReleaseUnsavedChangesGuard(): () => void {
  return useContext(UnsavedChangesGuardContext)?.release ?? (() => {});
}

/** Result of {@link useUnsavedChangesGuard}. */
export interface UseUnsavedChangesGuardResult {
  /** Mount once in the edit view's returned tree; renders nothing while not blocking. */
  dialog: ReactNode;
  /** See {@link UnsavedChangesGuardContextValue.release}. */
  release: () => void;
  /** See {@link UnsavedChangesGuardContextValue.attemptNavigation}. */
  attemptNavigation: (proceed: () => void) => void;
}

/**
 * Blocks in-app navigation away from an edit view with unsaved work
 * (decisions 1–4, A): in-app links, router pushes and back/forward show the
 * styled `UnsavedChangesDialog` (Stay / Leave); closing the tab or a hard
 * reload shows the browser's own native prompt, which cannot carry custom
 * UI, via `beforeunload`.
 *
 * "Dirty" (decision 4, B): when `props.autosaveEnabled` is `false`,
 * blocking follows `props.isDirty` alone (the edit view's
 * `!form.state.isDefaultValue`). When `true`, blocking follows ONLY
 * `props.hasUnsavedChanges` — regardless of `props.isDirty` — since every
 * other edit on an autosaved document is already persisted, and `status`
 * alone under-reports: `useAutosave().hasUnsavedChanges` stays `true`
 * through the debounce window, where `status` is still `"idle"`/`"saved"`.
 *
 * @param props - Hook props.
 * @param props.isDirty - `!form.state.isDefaultValue` from the edit view's
 *   own `form.Subscribe`/`useStore`.
 * @param props.hasUnsavedChanges - The edit view's
 *   `useAutosave().hasUnsavedChanges`. Ignored when `props.autosaveEnabled`
 *   is `false`.
 * @param props.autosaveEnabled - Whether THIS document has autosave on —
 *   the SAME expression the edit view passes to `useAutosave({ enabled })`
 *   (`isVersioned && collection.versions.autosave.enabled && canEdit`).
 * @returns {@link UseUnsavedChangesGuardResult}.
 */
export function useUnsavedChangesGuard(props: {
  isDirty: boolean;
  hasUnsavedChanges?: boolean;
  autosaveEnabled: boolean;
}): UseUnsavedChangesGuardResult {
  // 1. Read `navigationBlocker` off `useFrameworkComponents()` — may be
  //    `undefined` (no adapter configured, e.g. an unimplemented framework
  //    adapter or a test harness with no `FrameworkComponentsContext`).
  // 2. Compute `blocking`:
  //    a. `props.autosaveEnabled` → `!!props.hasUnsavedChanges`
  //    b. else → `props.isDirty`
  // 3. `releasedRef` (`useRef(false)`) tracks a one-shot bypass from
  //    `release()`. Re-arm it (`releasedRef.current = false`) whenever
  //    `blocking` is currently `false`, so a LATER dirty/unsaved-change
  //    state is guarded again → `when = blocking && !releasedRef.current`.
  // 4. `proceedRef` (`useRef<(() => void) | null>(null)`) holds the
  //    `proceed` for whichever navigation is currently blocked; `open`
  //    (`useState(false)`) drives the dialog.
  // 5. `attemptNavigation(proceed)`: the ONE function behind both
  //    `navigationBlocker`'s interception AND `useVexNavigate`'s guard
  //    consultation (spec decision 2) →
  //    `if (!when) { proceed(); return; } proceedRef.current = proceed; setOpen(true);`
  //    — called synchronously, no dialog, when not currently blocking.
  // 6. `navigationBlocker?.useBlocker({ when, onBlock: attemptNavigation })`
  //    → called unconditionally (Rules of Hooks) even when
  //    `navigationBlocker` is `undefined`; the adapter being absent means
  //    in-app navigation is simply never intercepted (`useVexNavigate` and
  //    `beforeunload` below still fire) — this is the only
  //    framework-specific call in this hook, the interception mechanics
  //    live in `@vexcms/next` (Step 8).
  // 7. `useEffect` keyed on `when`: while `when` is true,
  //    `window.addEventListener("beforeunload", handler)` where `handler`
  //    calls `event.preventDefault()` and sets `event.returnValue = ""`
  //    (both needed across current browsers) → the browser shows its OWN
  //    native prompt, never `UnsavedChangesDialog`. Removed on cleanup /
  //    once `when` goes `false`.
  // 8. `release()`: synchronously sets `releasedRef.current = true`, clears
  //    `proceedRef.current`, and closes the dialog (`setOpen(false)`) → the
  //    NEXT render's `when` is already `false`, before the caller's own
  //    follow-up navigation (direct, or via `useVexNavigate`) runs.
  // 9. `dialog`: `<UnsavedChangesDialog open={open} onOpenChange={(next) => { if (!next) { proceedRef.current = null; setOpen(false); } }} onLeave={() => { const proceed = proceedRef.current; proceedRef.current = null; setOpen(false); proceed?.(); }} />`
  //    — Leave reads `proceedRef.current`, clears it, closes, then calls
  //    it; Stay (`onOpenChange(false)` with no Leave) just clears
  //    `proceedRef.current` and closes, leaving `blocking`/`when` true so
  //    the NEXT attempt is blocked again.
  //
  // Edge cases:
  // - A second `attemptNavigation` call fires while the dialog is already
  //   open (two rapid sidebar clicks, or a click immediately followed by a
  //   `useVexNavigate` call) → the new `proceed` REPLACES
  //   `proceedRef.current`; Leave always resolves the MOST RECENT blocked
  //   attempt.
  // - `release()` called while the dialog is open (a built-in's success
  //   handler racing an in-flight blocked navigation) → must close the
  //   dialog and drop `proceedRef.current`, not just flip `when`, or a
  //   stale Leave click later fires a `proceed` from before the release.
  // - `props.autosaveEnabled` true with `props.hasUnsavedChanges`
  //   `undefined` (hook not wired yet) → not blocking (`!!undefined === false`).
  // - `attemptNavigation` called when `when` is already `false` (not
  //   blocking, or just `release()`d) → `proceed()` runs in the SAME tick,
  //   no dialog flash — this is what lets `useVexNavigate` navigate
  //   immediately right after a built-in's `release()`.
  throw new Error("Not implemented");
}
```

#### packages/react/src/forms/UnsavedChangesDialog.tsx

New file.

```tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

/** Props for {@link UnsavedChangesDialog}. */
export interface UnsavedChangesDialogProps {
  /** Whether the dialog is open — mirrors a currently blocked in-app navigation. */
  open: boolean;
  /** Fires with `false` on Stay, Escape, or an overlay click. */
  onOpenChange: (open: boolean) => void;
  /** Lets the blocked navigation continue. */
  onLeave: () => void;
}

/**
 * Stay / Leave confirmation (decision 3) shown when the navigation-blocker
 * adapter intercepts an in-app link or router navigation, or `useVexNavigate`
 * consults the guard, while the edit view is dirty. The unload case (closing
 * the tab, a hard reload) is handled separately by the browser's native
 * `beforeunload` prompt, which forbids custom UI — this dialog never renders
 * for that path.
 */
export function UnsavedChangesDialog(props: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. If you leave this page, they will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={props.onLeave}>
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

#### packages/react/src/forms/useUnsavedChangesGuard.test.tsx

New file.

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  FrameworkComponentsContext,
  type FrameworkComponents,
  type NavigationBlockerAdapter,
} from "../config/useFrameworkComponents";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

/**
 * A `NavigationBlockerAdapter` double: records the latest `when`/`onBlock`
 * passed to `useBlocker` on every render — no interception mechanics of its
 * own, that's `@vexcms/next`'s job (Step 8) — and exposes `block` so a test
 * can simulate the framework intercepting a navigation attempt.
 */
function createFakeNavigationBlocker() {
  const state: { when: boolean; onBlock: ((proceed: () => void) => void) | null } = {
    when: false,
    onBlock: null,
  };
  const adapter: NavigationBlockerAdapter = {
    useBlocker(blockerProps) {
      state.when = blockerProps.when;
      state.onBlock = blockerProps.onBlock;
    },
  };
  return {
    adapter,
    isBlocking: () => state.when,
    block(proceed: () => void) {
      state.onBlock?.(proceed);
    },
  };
}

interface HarnessProps {
  isDirty: boolean;
  hasUnsavedChanges?: boolean;
  autosaveEnabled: boolean;
}

function renderHarness(initial: HarnessProps, components: FrameworkComponents) {
  const releaseRef: { current: (() => void) | undefined } = { current: undefined };
  const attemptNavigationRef: { current: ((proceed: () => void) => void) | undefined } = {
    current: undefined,
  };

  function Harness(harnessProps: HarnessProps) {
    const { dialog, release, attemptNavigation } = useUnsavedChangesGuard(harnessProps);
    releaseRef.current = release;
    attemptNavigationRef.current = attemptNavigation;
    return <>{dialog}</>;
  }

  const utils = render(
    <FrameworkComponentsContext.Provider value={components}>
      <Harness {...initial} />
    </FrameworkComponentsContext.Provider>,
  );
  return {
    ...utils,
    releaseRef,
    attemptNavigationRef,
    rerender: (next: HarnessProps) =>
      utils.rerender(
        <FrameworkComponentsContext.Provider value={components}>
          <Harness {...next} />
        </FrameworkComponentsContext.Provider>,
      ),
  };
}

describe("useUnsavedChangesGuard", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, "addEventListener");
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("blocks when isDirty and autosave is off", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });
    expect(fake.isBlocking()).toBe(true);
  });

  it("does not block when not dirty and autosave is off", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: false, autosaveEnabled: false }, { navigationBlocker: fake.adapter });
    expect(fake.isBlocking()).toBe(false);
  });

  it.each([
    [false, false],
    [true, true],
  ] as const)(
    "autosave-enabled document, hasUnsavedChanges %s → blocking %s",
    (hasUnsavedChanges, expectedBlocking) => {
      const fake = createFakeNavigationBlocker();
      renderHarness(
        { isDirty: false, autosaveEnabled: true, hasUnsavedChanges },
        { navigationBlocker: fake.adapter },
      );
      expect(fake.isBlocking()).toBe(expectedBlocking);
    },
  );

  it("ignores isDirty entirely on an autosave-enabled document", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness(
      { isDirty: true, autosaveEnabled: true, hasUnsavedChanges: false },
      { navigationBlocker: fake.adapter },
    );
    expect(fake.isBlocking()).toBe(false);
  });

  it("registers beforeunload only while blocking, and removes it once clear", () => {
    const fake = createFakeNavigationBlocker();
    const { rerender } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    rerender({ isDirty: false, autosaveEnabled: false });
    expect(removeEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("calls preventDefault on the beforeunload event while blocking", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });
    const handler = addEventListenerSpy.mock.calls.find(
      ([type]) => type === "beforeunload",
    )?.[1] as ((event: BeforeUnloadEvent) => void) | undefined;
    const event = new Event("beforeunload") as BeforeUnloadEvent;
    const preventDefault = vi.spyOn(event, "preventDefault");
    handler?.(event);
    expect(preventDefault).toHaveBeenCalled();
  });

  it("opens the Stay/Leave dialog when the adapter blocks a navigation, and Leave resolves it", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });

    let proceeded = false;
    act(() => {
      fake.block(() => {
        proceeded = true;
      });
    });
    expect(screen.getByText("Leave without saving?")).toBeInTheDocument();
    expect(proceeded).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(proceeded).toBe(true);
    expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument();
  });

  it("Stay dismisses the dialog without resolving the blocked navigation", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });

    let proceeded = false;
    act(() => {
      fake.block(() => {
        proceeded = true;
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Stay" }));
    expect(proceeded).toBe(false);
    expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument();
    expect(fake.isBlocking()).toBe(true);
  });

  it("a second blocked navigation replaces the pending one — Leave resolves the latest", () => {
    const fake = createFakeNavigationBlocker();
    renderHarness({ isDirty: true, autosaveEnabled: false }, { navigationBlocker: fake.adapter });

    let firstProceeded = false;
    let secondProceeded = false;
    act(() => {
      fake.block(() => {
        firstProceeded = true;
      });
    });
    act(() => {
      fake.block(() => {
        secondProceeded = true;
      });
    });
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(firstProceeded).toBe(false);
    expect(secondProceeded).toBe(true);
  });

  it("release() stops blocking immediately, and re-arms once dirty again", () => {
    const fake = createFakeNavigationBlocker();
    const { releaseRef, rerender } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );
    expect(fake.isBlocking()).toBe(true);

    act(() => releaseRef.current?.());
    expect(fake.isBlocking()).toBe(false);

    rerender({ isDirty: false, autosaveEnabled: false });
    rerender({ isDirty: true, autosaveEnabled: false });
    expect(fake.isBlocking()).toBe(true);
  });

  it("release() closes an already-open dialog and drops the stale proceed", () => {
    const fake = createFakeNavigationBlocker();
    const { releaseRef } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );
    act(() => {
      fake.block(() => {});
    });
    expect(screen.getByText("Leave without saving?")).toBeInTheDocument();

    act(() => releaseRef.current?.());
    expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument();
  });

  it("without a navigationBlocker adapter, beforeunload still attaches while dirty", () => {
    renderHarness({ isDirty: true, autosaveEnabled: false }, {});
    expect(addEventListenerSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));
  });

  it("attemptNavigation runs proceed immediately when not blocking", () => {
    const fake = createFakeNavigationBlocker();
    const { attemptNavigationRef } = renderHarness(
      { isDirty: false, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );

    let proceeded = false;
    act(() => attemptNavigationRef.current?.(() => (proceeded = true)));
    expect(proceeded).toBe(true);
    expect(screen.queryByText("Leave without saving?")).not.toBeInTheDocument();
  });

  it("attemptNavigation opens the dialog when blocking, and Leave resolves it", () => {
    const fake = createFakeNavigationBlocker();
    const { attemptNavigationRef } = renderHarness(
      { isDirty: true, autosaveEnabled: false },
      { navigationBlocker: fake.adapter },
    );

    let proceeded = false;
    act(() => attemptNavigationRef.current?.(() => (proceeded = true)));
    expect(screen.getByText("Leave without saving?")).toBeInTheDocument();
    expect(proceeded).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(proceeded).toBe(true);
  });
});
```

#### packages/react/src/config/useVexNavigate.ts

New file.

```ts
"use client";

import { useCallback, useContext } from "react";
import { UnsavedChangesGuardContext } from "../forms/useUnsavedChangesGuard";
import { useFrameworkComponents } from "./useFrameworkComponents";

/**
 * Client-side programmatic navigation (spec decision 2), for a built-in's
 * post-mutation redirect ONLY — after `vex.delete` resolves (Step 4), after
 * `vex.duplicate`'s create resolves (Step 6). Everything clickable keeps
 * using `VexLink`; a raw `next/navigation` `useRouter().push` from
 * third-party code is NOT guarded by `UnsavedChangesGuardContext` — only
 * this hook is.
 *
 * Reads `useFrameworkComponents().useNavigate` — called unconditionally,
 * like `navigationBlocker?.useBlocker` in `useUnsavedChangesGuard`, since an
 * adapter's presence doesn't change render to render — and falls back to
 * `window.location.assign` (a full page navigation) when the adapter has
 * none.
 *
 * Before navigating, consults the active `UnsavedChangesGuardContext` (the
 * nearest edit view's `useUnsavedChangesGuard()`, provided by
 * `CollectionEditView`/`GlobalEditView`): if the guard is currently
 * blocking, it opens the SAME `UnsavedChangesDialog` already mounted by
 * that guard and navigates only on Leave. A built-in that just
 * saved/deleted/duplicated calls `useReleaseUnsavedChangesGuard()()` first,
 * so no prompt appears for ITS OWN navigation.
 *
 * @returns A stable `(href: string) => void`. Call it with an internal
 *   admin route, e.g. `/admin/posts`.
 */
export function useVexNavigate(): (href: string) => void {
  // 1. `components = useFrameworkComponents()`.
  // 2. `navigateFromAdapter = components.useNavigate?.()` — the adapter's
  //    hook, called unconditionally per #1's Rules-of-Hooks note; `undefined`
  //    when no `useNavigate` is configured.
  // 3. `guard = useContext(UnsavedChangesGuardContext)` — `undefined`
  //    outside an edit view (no guard mounted) → step 5 below just navigates.
  // 4. `navigate = useCallback((href) => { (navigateFromAdapter ?? ((target) => { window.location.assign(target); }))(href); }, [navigateFromAdapter])`
  //    — resolved INSIDE the callback (not hoisted to a bare variable) so a
  //    later adapter change is honored without needing `attemptNavigation`
  //    to know about `navigateFromAdapter` at all.
  // 5. Return `useCallback((href) => { if (guard) { guard.attemptNavigation(() => navigate(href)); } else { navigate(href); } }, [guard, navigate])`.
  //    → no guard mounted, or the guard isn't currently blocking (including
  //    right after `release()`) → `navigate(href)` runs in the SAME tick;
  //    guard is blocking → `UnsavedChangesDialog` opens and `navigate(href)`
  //    runs only if the user clicks Leave.
  //
  // Edge cases:
  // - Called from OUTSIDE any edit view (`guard` is `undefined`) → never
  //   blocked, matches a page with no unsaved work to lose.
  // - The adapter's `useNavigate` field flips from defined to `undefined`
  //   between renders (a framework adapter misconfiguration, not a normal
  //   case) → `navigate` recomputes `navigateFromAdapter ?? fallback` fresh
  //   on every call, so the NEXT call to the returned function uses the
  //   fallback; no stale closure over a since-removed adapter function.
  throw new Error("Not implemented");
}
```

#### packages/react/src/config/useVexNavigate.test.tsx

New file.

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FrameworkComponentsContext, type FrameworkComponents } from "./useFrameworkComponents";
import {
  UnsavedChangesGuardContext,
  type UnsavedChangesGuardContextValue,
} from "../forms/useUnsavedChangesGuard";
import { useVexNavigate } from "./useVexNavigate";

function NavigateButton(props: { href: string }) {
  const navigate = useVexNavigate();
  return <button onClick={() => navigate(props.href)}>Go</button>;
}

function renderHarness(
  components: FrameworkComponents,
  guard: UnsavedChangesGuardContextValue | undefined,
) {
  return render(
    <FrameworkComponentsContext.Provider value={components}>
      {guard ? (
        <UnsavedChangesGuardContext.Provider value={guard}>
          <NavigateButton href="/admin/posts" />
        </UnsavedChangesGuardContext.Provider>
      ) : (
        <NavigateButton href="/admin/posts" />
      )}
    </FrameworkComponentsContext.Provider>,
  );
}

describe("useVexNavigate", () => {
  let assignSpy: ReturnType<typeof vi.fn>;
  let originalLocation: Location;

  beforeEach(() => {
    assignSpy = vi.fn();
    originalLocation = window.location;
    // jsdom's `window.location` doesn't allow spying `assign` directly.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign: assignSpy },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("with no adapter useNavigate, falls back to window.location.assign", () => {
    renderHarness({}, undefined);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(assignSpy).toHaveBeenCalledWith("/admin/posts");
  });

  it("uses the adapter's useNavigate when provided, not window.location.assign", () => {
    const adapterNavigate = vi.fn();
    renderHarness({ useNavigate: () => adapterNavigate }, undefined);
    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(adapterNavigate).toHaveBeenCalledWith("/admin/posts");
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("while the guard is blocking, opens the Stay/Leave dialog and navigates only on Leave", () => {
    const attemptNavigation = vi.fn((proceed: () => void) => {
      // Simulates the guard: holds `proceed`, doesn't call it — a real
      // guard would also render `UnsavedChangesDialog` here; this double
      // asserts `useVexNavigate` routed through `attemptNavigation` rather
      // than navigating directly.
      pendingProceed = proceed;
    });
    let pendingProceed: (() => void) | undefined;
    renderHarness({}, { release: vi.fn(), attemptNavigation });

    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(attemptNavigation).toHaveBeenCalledTimes(1);
    expect(assignSpy).not.toHaveBeenCalled();

    act(() => pendingProceed?.());
    expect(assignSpy).toHaveBeenCalledWith("/admin/posts");
  });

  it("after the guard isn't blocking (e.g. released), navigates immediately", () => {
    const attemptNavigation = vi.fn((proceed: () => void) => proceed());
    renderHarness({}, { release: vi.fn(), attemptNavigation });

    fireEvent.click(screen.getByRole("button", { name: "Go" }));
    expect(attemptNavigation).toHaveBeenCalledTimes(1);
    expect(assignSpy).toHaveBeenCalledWith("/admin/posts");
  });
});
```

#### packages/react/src/collections/CollectionEditView.tsx

4 edits; everything not shown is unchanged.

**1 — import, beside the existing `DraftToolbar, VersionHistoryDropdown, type ViewedVersion` import from `../versions`.**

```ts
import {
  UnsavedChangesGuardContext,
  useUnsavedChangesGuard,
} from "../forms/useUnsavedChangesGuard";
```

**2 — replace the `useAutosave({...})` call with autosave-result capture, the top-level dirty subscription, and the guard, anchored right after the `lastViewedVersionRef` reset effect.**

```tsx
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const autosaveEnabled = isVersioned && collection.versions.autosave.enabled && canEdit;

  const { hasUnsavedChanges: autosaveHasUnsavedChanges } = useAutosave({
    values: changedValues(form),
    onSave: async (changes) => {
      const draftId = await saveDraftMutation({
        collection: collection.slug,
        id: activeDocumentId,
        data: changes,
        ...restoredFrom,
      });
      setActiveDocumentId(draftId);
      setViewedVersion(null);
      // Keystrokes typed during the save stay dirty for autosave's follow-up save.
      resetWhenSaved(changes);
    },
    enabled: autosaveEnabled,
  });

  const {
    dialog: unsavedChangesDialog,
    release: releaseUnsavedChangesGuard,
    attemptNavigation: attemptUnsavedChangesNavigation,
  } = useUnsavedChangesGuard({
    isDirty: !isDefaultValue,
    hasUnsavedChanges: autosaveHasUnsavedChanges,
    autosaveEnabled,
  });
```

**3 — wrap the return's root, replacing the opening `return (` / `<AppForm ...>` pair.**

```tsx
  return (
    <UnsavedChangesGuardContext.Provider
      value={{ release: releaseUnsavedChangesGuard, attemptNavigation: attemptUnsavedChangesNavigation }}
    >
      <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
```

**4 — close the wrap, replacing the trailing `</AlertDialog>` / `</AppForm>` / `);` / `}`.**

```tsx
      </AlertDialog>
      {unsavedChangesDialog}
      </AppForm>
    </UnsavedChangesGuardContext.Provider>
  );
}
```

#### packages/react/src/globals/GlobalEditView.tsx

4 edits; everything not shown is unchanged.

**1 — import, beside the existing `DraftToolbar, VersionHistoryDropdown, type ViewedVersion` import from `../versions`.**

```ts
import {
  UnsavedChangesGuardContext,
  useUnsavedChangesGuard,
} from "../forms/useUnsavedChangesGuard";
```

**2 — replace the `useAutosave({...})` call with autosave-result capture, the top-level dirty subscription, and the guard, anchored right after the `lastViewedVersionRef` reset effect (and before `formValues`).**

```tsx
  const isDefaultValue = useStore(form.store, (state) => state.isDefaultValue);
  const autosaveEnabled = isVersioned && global.versions.autosave.enabled && canEdit;

  const { hasUnsavedChanges: autosaveHasUnsavedChanges } = useAutosave({
    values: globalDoc ? changedValues(form) : (form.state.values as Record<string, unknown>),
    onSave: async (changes) => {
      await saveDraftMutation({ global: global.slug, data: changes, ...restoredFrom });
      setViewedVersion(null);
      // Keystrokes typed during the save stay dirty for autosave's follow-up save.
      resetWhenSaved(changes);
    },
    enabled: autosaveEnabled,
  });

  const {
    dialog: unsavedChangesDialog,
    release: releaseUnsavedChangesGuard,
    attemptNavigation: attemptUnsavedChangesNavigation,
  } = useUnsavedChangesGuard({
    isDirty: !isDefaultValue,
    hasUnsavedChanges: autosaveHasUnsavedChanges,
    autosaveEnabled,
  });
```

**3 — wrap the return's root, replacing the opening `return (` / `<AppForm ...>` pair.**

```tsx
  return (
    <UnsavedChangesGuardContext.Provider
      value={{ release: releaseUnsavedChangesGuard, attemptNavigation: attemptUnsavedChangesNavigation }}
    >
      <AppForm form={form} className="relative -mb-6 flex h-[calc(100%+1.5rem)] flex-col">
```

**4 — close the wrap, replacing the trailing `</AlertDialog>` / `</AppForm>` / `);` / `}`.**

```tsx
      </AlertDialog>
      {unsavedChangesDialog}
      </AppForm>
    </UnsavedChangesGuardContext.Provider>
  );
}
```

#### packages/react/src/collections/CollectionDeleteAction.tsx

2 edits; everything not shown is unchanged.

**1 — imports.** Beside the existing `import { adminHref } from "../../admin/adminHref";`, add:

```tsx
import { useVexNavigate } from "../../config/useVexNavigate";
```

**2 — body.** In `CollectionDeleteAction`, beside `const [confirming, setConfirming] = useState(false);`,
add:

```tsx
const navigate = useVexNavigate();
```

Replace the TODO's step 3 navigation line — old:

```
// 3. On confirm: `mutateAsync({ ids: [document.id!], collection: props.slug })`; on success,
//    navigate to the collection list — `window.location.assign(adminHref({ type: "collection",
//    slug: props.slug }, config.basePath))` (no in-package router exists before Step 8; a full
//    navigation is correct here since nothing on the deleted document's edit view should survive).
```

new:

```
// 3. On confirm: `mutateAsync({ ids: [document.id!], collection: props.slug })`; on success,
//    call the active unsaved-changes guard's `release()` (no-op if none is registered), then
//    `navigate(adminHref({ type: "collection", slug: props.slug }, config.basePath))` —
//    `useVexNavigate` is client-side, replacing the old full-page `window.location.assign`.
```


#### packages/react/src/collections/useDuplicateCollectionDocument.ts

1 edit; everything not shown is unchanged.

**1 — replace the hard navigation with `useVexNavigate`, releasing the guard first,**
anchored on the success branch of `duplicate()`'s `mutateAsync(...).then(...)` and the
hook's import list.

```tsx
import { useVexNavigate } from "../../config/useVexNavigate";
import { useReleaseUnsavedChangesGuard } from "../../forms/useUnsavedChangesGuard";
```

```tsx
export function useDuplicateCollectionDocument(
  props: UseDuplicateCollectionDocumentProps,
): UseDuplicateCollectionDocumentResult {
  const config = useVexConfig();
  const navigate = useVexNavigate();
  const release = useReleaseUnsavedChangesGuard();
  // … fallbackClone state and useVexMutation unchanged …

  function duplicate() {
    const clone = cloneDocumentForDuplicate({ fields: props.collection.fields, document: props.document });
    const isVersioned = props.collection.versions.drafts;
    void mutateAsync({
      collection: props.collection.slug,
      data: clone,
      ...(isVersioned ? { status: VERSION_STATUSES.draft.key } : {}),
    })
      .then((id) => {
        release();
        navigate(adminHref({ type: "document", slug: props.collection.slug, id }, config.basePath));
      })
      .catch(() => {
        setFallbackClone(clone);
      });
  }
  // … return unchanged …
}
```

> `release()` runs before `navigate(...)` so the guard's `releasedRef` is already `true`
> when `useVexNavigate` checks it — the duplicate's own navigation never shows the
> Stay/Leave dialog it would otherwise trigger for a dirty source document. A rejected
> create still falls through to `setFallbackClone`, same as before; the guard is only
> consulted on the success path, since the fallback dialog does not navigate.


Verify: pnpm --filter @vexcms/react test -- useUnsavedChangesGuard useVexNavigate useAutosave

### Step 8 — Next.js navigation-guard implementation [dev]

- [ ] `packages/next/src/navigation/useNextNavigationBlocker.ts` + `useNextNavigationBlocker.test.ts` (new)
- [ ] `packages/next/src/navigation/useNextNavigate.ts` (new)
- [ ] `packages/next/src/navigation/index.ts` (new)
- [ ] `packages/next/src/NextAdminLayoutClient.tsx` — provide both adapters
- [ ] `packages/next/package.json` — test-only devDependencies for the new DOM test

> Note: `packages/next` is Next 16.3.3 (catalog, peer range `>=15.0.0`) on the App Router. The App
> Router ships no `routeChangeStart`-style event (that was Pages Router-only and was removed), so
> there is no single hook point. Verified directly in
> `node_modules/.pnpm/next@16.3.3*/node_modules/next/dist/client/components/app-router.js`:
> `HistoryUpdater`'s `useInsertionEffect` (lines ~39-64) calls `window.history.pushState` AFTER the
> new route has already committed — the outgoing page (and this hook's form) is unmounted by the
> time `pushState` runs. Next also patches `pushState`/`replaceState` itself (~252), so a second,
> outer patch installed by this hook would both race Next's own patch and fire too late to prevent
> anything: the form is already gone. Patching history methods to intercept programmatic navigation
> is therefore not viable here (superseding an earlier draft of this step that attempted it).
>
> The only interception points that fire BEFORE a route change commits are:
> 1. **Same-origin `<a>` clicks** — a capture-phase `click` listener in front of Next's own handler,
>    `preventDefault()` + replay via `router.push()` on "Leave". Cheap and precise, but only catches
>    real anchors — a `<button onClick={() => router.push(...)}>` is invisible to it.
> 2. **Back/forward (`popstate`)** — the browser has already applied the navigation (updated
>    `location`, fired `popstate`) before any JS runs, and Next's own internal `popstate` listener
>    reacts to it in the same tick. This step cannot *prevent* a back-press, only *correct* it: it
>    re-pushes the current URL immediately on `popstate` (the "duplicate history entry" trap used by
>    `next-navigation-guard`, `next-stay`, and the patterns discussed in vercel/next.js discussion
>    #47020), which can paint one intermediate frame of the target page before the correction lands,
>    then replays with `history.go(-1)` on "Leave".
>
> Programmatic navigation (a raw `router.push`/`router.replace`, a `redirect()` resolved from a
> Server Action, or any other code that ends up calling `history.pushState`/`replaceState` directly)
> is a real gap: `useNextNavigationBlocker` cannot see it without the patch spec decision 3 rules out.
> This is closed a different way — `@vexcms/react`'s `useVexNavigate` (Step 7,
> `packages/react/src/config/useVexNavigate.ts`) is the one supported path for programmatic
> navigation inside the admin: it consults `useUnsavedChangesGuard`'s blocking state itself before
> calling the adapter's `useNavigate`, so every built-in that navigates after a mutation (delete,
> duplicate's create) is guarded without this hook's involvement. Everything clickable stays
> `VexLink`, which the click interception below already covers. A raw `next/navigation`
> `useRouter().push` called from third-party code is NOT guarded — only `useVexNavigate` is; this is
> called out in the public docs, not papered over here.
>
> `beforeunload` itself is **not** handled here — Decision 2/Step 7 put it in `@vexcms/react`'s
> `useUnsavedChangesGuard`, framework-independent, since `window.addEventListener("beforeunload", …)`
> needs no adapter.
>
> `useNextNavigationBlocker`'s props are typed as `Parameters<NavigationBlockerAdapter["useBlocker"]>[0]`,
> importing `NavigationBlockerAdapter` from `@vexcms/react` (Step 7 adds it beside
> `FrameworkComponents` in `packages/react/src/config/useFrameworkComponents.ts` and re-exports it
> from the package's `./index.ts` barrel) rather than redeclaring an equivalent shape locally.

#### packages/next/src/navigation/useNextNavigationBlocker.ts

```ts
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { NavigationBlockerAdapter } from "@vexcms/react";

/**
 * Next.js App Router implementation of `NavigationBlockerAdapter["useBlocker"]`.
 *
 * The App Router has no `routeChangeStart`-equivalent event and (spec decision 3)
 * programmatic navigation cannot be intercepted by patching
 * `history.pushState`/`replaceState` — Next's own `HistoryUpdater` calls
 * `pushState` from a `useInsertionEffect` AFTER the route has already
 * committed, and patches those methods itself. This hook therefore covers
 * only the two surfaces that fire BEFORE a route change commits: same-origin
 * `<a>` clicks (capture-phase `click` listener) and browser back/forward (a
 * `popstate` listener plus a duplicate-history-entry trap). Programmatic
 * navigation is guarded separately by `@vexcms/react`'s `useVexNavigate`,
 * which consults the guard itself before calling this adapter's
 * `useNavigate` (`useNextNavigate`, this package). `beforeunload` (tab close
 * / hard reload) is also NOT handled here — `@vexcms/react`'s
 * `useUnsavedChangesGuard` registers it directly, framework-independent.
 *
 * Provide the resulting adapter from `NextAdminLayoutClient`:
 * `components={{ …, navigationBlocker: { useBlocker: useNextNavigationBlocker } }}`.
 * `useUnsavedChangesGuard` then calls it once per mounted edit view with the
 * live dirty/autosave state.
 *
 * @param props - See `NavigationBlockerAdapter["useBlocker"]` in
 *   `@vexcms/react` (`packages/react/src/config/useFrameworkComponents.ts`).
 * @returns Nothing — every intercepted navigation surfaces through
 *   `props.onBlock`, never a return value.
 * @throws Never under normal operation; a blocked navigation reports through
 *   `onBlock`, not a throw.
 */
export function useNextNavigationBlocker(
  props: Parameters<NavigationBlockerAdapter["useBlocker"]>[0],
): void {
  const router = useRouter();
  // TODO: implement
  // 1. `routerRef`/`whenRef`/`onBlockRef` — three refs updated on every
  //    render with `router`/`props.when`/`props.onBlock`. The effect below
  //    installs its listeners ONCE per mount and every handler reads these
  //    refs, so `when` flipping dirty↔clean never tears down and
  //    reinstalls the click/popstate listeners, and the router's method
  //    identity (not guaranteed stable across renders) never matters.
  // 2. `popstateReplayRef` (`useRef(false)`) — set just before
  //    `history.go(-1)` on a blocked back/forward's Leave, so step 3.b's
  //    own `popstate` listener (which fires synchronously as a result of
  //    `history.go`) treats that ONE event as the replay instead of
  //    re-blocking it.
  // 3. `useEffect(() => { … }, [])`, installing on mount and returning a
  //    cleanup:
  //    a. Click interception — `document.addEventListener("click", onClick, true)`:
  //       i.   `(event.target as Element).closest("a")` → bail (let the
  //            click proceed untouched) if null, `event.defaultPrevented`,
  //            a modifier key (`metaKey`/`ctrlKey`/`shiftKey`/`altKey`),
  //            `anchor.target` truthy (opens a new tab), or
  //            `anchor.hasAttribute("download")`.
  //       ii.  `const url = new URL(anchor.href, window.location.href)` →
  //            bail if `url.origin !== window.location.origin` (external
  //            link; let the browser handle it).
  //       iii. Bail if `url.pathname + url.search === window.location.pathname + window.location.search`
  //            (a same-page `#hash` anchor — not a route change).
  //       iv.  Bail if `!whenRef.current`.
  //       v.   Otherwise `event.preventDefault()`, then call
  //            `onBlockRef.current(() => routerRef.current.push(url.pathname + url.search))`
  //            → "Leave" replays the navigation through the real router.
  //            Nothing needs flagging: spec decision 3 means no `pushState`
  //            patch exists to re-intercept this call.
  //    b. Back/forward — the duplicate-history-entry trap:
  //       i.   On mount, if `whenRef.current`,
  //            `window.history.pushState(null, "", window.location.href)` —
  //            a same-URL sentinel so the FIRST back press lands on it, not
  //            off the guarded page.
  //       ii.  `window.addEventListener("popstate", onPopState)`. `popstate`
  //            fires AFTER the browser has already applied the navigation
  //            (and after Next's own internal `popstate` listener has
  //            already reacted to it — see this step's design note).
  //       iii. If `popstateReplayRef.current` is set, clear it and do
  //            nothing further (this `popstate` is the replay's own).
  //       iv.  Else if `!whenRef.current`, do nothing.
  //       v.   Else re-assert the current URL —
  //            `window.history.pushState(null, "", window.location.href)` —
  //            to visually undo the back-nav (the design note covers the
  //            one-frame caveat), then call
  //            `onBlockRef.current(() => { popstateReplayRef.current = true; window.history.go(-1); })`
  //            → "Leave" goes back once more, past the just-re-pushed
  //            entry, landing where the original back press intended.
  //    c. Cleanup: remove the click and `popstate` listeners; if the
  //       sentinel from 3.b.i is still the top-of-stack entry and the
  //       effect is tearing down WITHOUT a "Leave" having fired (plain
  //       unmount, not a replayed back-nav), `window.history.back()` once
  //       to pop it, so history length matches what it would be with no
  //       guard mounted.
  // Edge cases:
  // - Next.js prefetch-on-hover is unaffected — only the `click` is
  //   intercepted, never `<Link>`'s background prefetch.
  // - A `<Link replace>` or raw `router.push`/`router.replace` NOT
  //   triggered by an intercepted anchor click (a `<button>` handler,
  //   `redirect()` from a Server Action, third-party code) is NOT
  //   intercepted by this hook (spec decision 3) — only `useVexNavigate`
  //   (`@vexcms/react`) guards programmatic navigation; see this step's
  //   design note.
  // - A second blocked attempt while a dialog is already open (e.g. a click
  //   immediately followed by Back) overwrites the pending `proceed` rather
  //   than queuing both — `onBlockRef.current` fires at most once
  //   outstanding; `useUnsavedChangesGuard` owns de-duping the dialog.
  throw new Error("Not implemented");
}
```

#### packages/next/src/navigation/useNextNavigationBlocker.test.ts

```ts
// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

import { useNextNavigationBlocker } from "./useNextNavigationBlocker";

function clickAnchor(props: {
  href: string;
  target?: string;
  download?: boolean;
  ctrlKey?: boolean;
}): MouseEvent {
  const anchor = document.createElement("a");
  anchor.href = props.href;
  if (props.target) anchor.target = props.target;
  if (props.download) anchor.setAttribute("download", "");
  document.body.appendChild(anchor);
  const event = new MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    ctrlKey: props.ctrlKey ?? false,
  });
  act(() => {
    anchor.dispatchEvent(event);
  });
  anchor.remove();
  return event;
}

beforeEach(() => {
  pushMock.mockReset();
  window.history.replaceState(null, "", "/admin/posts/123");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useNextNavigationBlocker", () => {
  it("lets a same-origin anchor click through when `when` is false", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: false, onBlock }));
    const event = clickAnchor({ href: "/admin/pages" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("intercepts a same-origin anchor click when blocking, and Leave replays it through router.push", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages" });
    expect(event.defaultPrevented).toBe(true);
    expect(onBlock).toHaveBeenCalledTimes(1);
    const proceed = onBlock.mock.calls[0]?.[0] as () => void;
    act(() => proceed());
    expect(pushMock).toHaveBeenCalledWith("/admin/pages");
  });

  it("ignores a click with a modifier key held", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages", ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a click on an anchor with target set", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages", target: "_blank" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a click on an anchor with the download attribute", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/pages", download: true });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a click on a cross-origin anchor", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "https://example.com/elsewhere" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("ignores a same-page hash anchor", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    const event = clickAnchor({ href: "/admin/posts/123#section" });
    expect(event.defaultPrevented).toBe(false);
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("blocks a back/forward (popstate) navigation while blocking", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(onBlock).toHaveBeenCalledTimes(1);
  });

  it("does not block a popstate when `when` is false", () => {
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: false, onBlock }));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    expect(onBlock).not.toHaveBeenCalled();
  });

  it("releases a blocked back/forward with exactly one history.go(-1) on Leave", () => {
    const goSpy = vi.spyOn(window.history, "go").mockImplementation(() => {});
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    const proceed = onBlock.mock.calls[0]?.[0] as () => void;
    act(() => proceed());
    expect(goSpy).toHaveBeenCalledTimes(1);
    expect(goSpy).toHaveBeenCalledWith(-1);
  });

  it("does not re-block the popstate fired by its own Leave replay", () => {
    const goSpy = vi
      .spyOn(window.history, "go")
      .mockImplementation(() => window.dispatchEvent(new PopStateEvent("popstate")));
    const onBlock = vi.fn();
    renderHook(() => useNextNavigationBlocker({ when: true, onBlock }));
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    const proceed = onBlock.mock.calls[0]?.[0] as () => void;
    act(() => proceed());
    expect(goSpy).toHaveBeenCalledTimes(1);
    expect(onBlock).toHaveBeenCalledTimes(1);
  });
});
```

#### packages/next/src/navigation/useNextNavigate.ts

```ts
"use client";

import { useRouter } from "next/navigation";

/**
 * Next.js App Router implementation of `FrameworkComponents["useNavigate"]`
 * (`packages/react/src/config/useFrameworkComponents.ts`, Step 7).
 *
 * Returns the App Router's own `router.push`, unwrapped — guarding is not
 * this hook's job. `@vexcms/react`'s `useVexNavigate`
 * (`packages/react/src/config/useVexNavigate.ts`) is the only caller: it
 * consults `useUnsavedChangesGuard`'s blocking state itself before invoking
 * the function this hook returns, so every built-in post-mutation
 * navigation (after delete, after a duplicate's create resolves) is guarded
 * without this hook knowing anything about dirty state.
 *
 * Provide it from `NextAdminLayoutClient`:
 * `components={{ …, useNavigate: useNextNavigate }}`.
 *
 * @returns A function that navigates to `href` via the App Router.
 */
export function useNextNavigate(): (href: string) => void {
  const router = useRouter();
  return router.push;
}
```

#### packages/next/src/navigation/index.ts

```ts
export { useNextNavigationBlocker } from "./useNextNavigationBlocker";
export { useNextNavigate } from "./useNextNavigate";
```

#### packages/next/src/NextAdminLayoutClient.tsx

2 edits; everything not shown is unchanged.

**1 — imports, beside the existing `NuqsAdapter` import.**

```tsx
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useNextNavigationBlocker } from "./navigation/useNextNavigationBlocker";
import { useNextNavigate } from "./navigation/useNextNavigate";
```

**2 — the `components` prop passed to `AdminLayout`, adding `navigationBlocker` and `useNavigate`.**

```tsx
components={{
  Link: NextLink,
  Image: NextImage,
  navigationBlocker: { useBlocker: useNextNavigationBlocker },
  useNavigate: useNextNavigate,
}}
```

#### packages/next/package.json

1 edit; everything not shown is unchanged.

**1 — `devDependencies`, alongside the existing `vitest` entry, for the new jsdom-environment test.**

```json
"@testing-library/react": "catalog:",
"jsdom": "catalog:",
```

Verify: pnpm --filter @vexcms/next test; browser smoke on a dirty form: sidebar link → dialog; Back → dialog, Stay keeps the URL; reload → native prompt; saved autosave doc → no prompt; delete a dirty-but-saved autosave doc → no prompt on the post-delete redirect

### Step 9 — Dogfood, docs, bookkeeping [dev]

Why: proves the acceptance criteria end-to-end and documents the new public surface.
Verify: pnpm build && pnpm test; manual smoke of every acceptance bullet in `apps/test`

- [ ] `apps/test/src/vex.config.ts`: root-level `edit.header.after` contribution
- [ ] `apps/test/src/vexcms/components/EnvironmentBadge.tsx`: new root contribution component
- [ ] `apps/test/src/vexcms/collections/posts.ts`: collection-level `edit.beforeFields` contribution + `vex.save` wrapped via `header.overrides`
- [ ] `apps/test/src/vexcms/components/EditorialChecklist.tsx`: new collection contribution component
- [ ] `apps/test/src/vexcms/components/SaveWithAnalytics.tsx`: new `vex.save` wrapper component
- [ ] `apps/test/src/vexcms/collections/users.ts`: hide the built-in `vex.duplicate` header action
- [ ] `apps/test/src/vexcms/globals/siteSettings.ts`: global-level `edit.sidebar.after` contribution
- [ ] `apps/test/src/vexcms/components/CachePurgeNote.tsx`: new global contribution component
- [ ] `apps/docs/src/content/docs/guides/admin-customization.mdx`: edit-view slots, built-in ids, `useVexDocument`
- [ ] `apps/docs/src/content/docs/guides/framework-adapters.md`: the navigation-blocker contract
- [ ] `.changeset/edit-view-slots.md`
- [ ] `.changeset/duplicate-document.md`
- [ ] `.changeset/unsaved-changes-guard.md`
- [ ] `.agent/docs/product/v0.1.0-launch-plan.md`: mark G done, H done, note the dropped error summary

> Note: `apps/docs/src/content/docs/guides/framework-adapters.md` is a `.md` file, not
> `.mdx` as a plain reading of "docs guides … framework-adapters.md" might suggest reformatting
> to — it is correctly referenced as `.md` here and in `spec-tasks.md`; no path correction
> needed.

#### apps/test/src/vexcms/components/EnvironmentBadge.tsx

A root-level `edit.header.after` contribution — renders on every collection and global edit
view, proving a root contribution resolves ahead of (or alongside) collection/global ones.
Reads `useVexDocument()` only for `kind`/`slug`, so it stays generic across every resource.

```tsx
import { useVexDocument } from "@vexcms/react";

/**
 * Small pill after the edit-view header actions, naming the resource being
 * edited and the Convex deployment it is talking to. Exists to dogfood a
 * root-level `admin.components.edit.header.after` contribution — it is not
 * itself gated by kind or slug, unlike the collection/global examples below.
 */
export function EnvironmentBadge() {
  const document = useVexDocument();
  const deployment = process.env.NEXT_PUBLIC_CONVEX_URL ?? "unknown";

  return (
    <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
      {document.kind}:{document.slug} · {deployment}
    </span>
  );
}
```

#### apps/test/src/vex.config.ts

1 edit; everything not shown is unchanged.

**1 — root `admin.components.edit` contribution, beside the existing `admin.livePreview` block.**
Add the import and the `components` key to the existing `admin` object.

```ts
import { EnvironmentBadge } from "~/vexcms/components/EnvironmentBadge";
```

```ts
  admin: {
    sidebar: {
      side: "right",
    },
    components: {
      edit: {
        header: {
          after: [{ id: "test.env-badge", component: EnvironmentBadge }],
        },
      },
    },
    livePreview: {
      // … unchanged …
```

#### apps/test/src/vexcms/components/EditorialChecklist.tsx

A collection-level `edit.beforeFields` contribution for `posts`, exercising a plain additive
list entry that reads form state via `useVexDocument()`'s `status`/`isDirty` rather than the
live field values `useVexForm` would expose.

```tsx
import { useVexDocument } from "@vexcms/react";

/**
 * Reminder card above the post's fields: posts are a draft/publish collection
 * (`versions.drafts`, `versions.autosave`), so this exists to dogfood a
 * collection-level `admin.components.edit.beforeFields` contribution that
 * reads document status rather than field values.
 */
export function EditorialChecklist() {
  const document = useVexDocument();

  if (document.status !== "draft") return null;

  return (
    <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
      Draft — confirm the slug and related posts before publishing.
    </div>
  );
}
```

#### apps/test/src/vexcms/components/SaveWithAnalytics.tsx

Wraps the built-in `vex.save` action on `posts` to dogfood the `overrides` map (decision 15):
calls `renderDefault` to render the real Save button unchanged, firing a side effect around it.

```tsx
import type { EditSlotProps } from "@vexcms/core";
import { useVexDocument } from "@vexcms/react";
import type { ComponentType } from "react";

interface SaveWithAnalyticsProps extends EditSlotProps {
  renderDefault: ComponentType<EditSlotProps>;
}

/**
 * Wraps `vex.save` in `edit.header.overrides` on `posts` — logs a
 * console event naming the document before delegating to the real Save
 * button via `renderDefault`. Exists to dogfood decision 15's per-built-in
 * `overrides` map, not as a real analytics integration.
 */
export function SaveWithAnalytics(props: SaveWithAnalyticsProps) {
  const document = useVexDocument();
  const RenderDefault = props.renderDefault;

  return (
    <span
      onClickCapture={() => {
        console.info(`[test] saving ${document.kind}:${document.slug}${document.id ? `/${document.id}` : ""}`);
      }}
    >
      <RenderDefault {...props} />
    </span>
  );
}
```

#### apps/test/src/vexcms/collections/posts.ts

2 edits; everything not shown is unchanged.

**1 — imports**, beside the existing `defineCollection` import.

```ts
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";

import { EditorialChecklist } from "~/vexcms/components/EditorialChecklist";
import { SaveWithAnalytics } from "~/vexcms/components/SaveWithAnalytics";
```

**2 — `admin.components.edit`**, added to the existing `admin` object alongside `useAsTitle`/`icon`/`livePreview`.

    components: {
      edit: {
        beforeFields: [{ id: "editorial.checklist", component: EditorialChecklist }],
        header: {
          overrides: {
            [BUILTIN_CONTRIBUTION_IDS.edit.save]: [
              { id: "editorial.saveAnalytics", component: SaveWithAnalytics },
            ],
          },
        },
      },
    },

#### apps/test/src/vexcms/collections/users.ts

1 edit; everything not shown is unchanged.

**1 — hide `vex.duplicate`**, added to the existing `admin` object. A user account duplicated
through the generic clone path would collide with the auth adapter's own account-creation
flow, so this collection hides the built-in instead of overriding it — dogfoods the hide
directive (same shape G already uses for `blocks`/`array` actions) for an `edit.*` slot.

```ts
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core";
```

```ts
  admin: {
    useAsTitle: "name",
    icon: "Users",
    components: {
      edit: {
        header: {
          actions: [{ id: BUILTIN_CONTRIBUTION_IDS.edit.duplicate, hidden: true }],
        },
      },
    },
  },
```

#### apps/test/src/vexcms/components/CachePurgeNote.tsx

A global-level `edit.sidebar.after` contribution for `siteSettings`.

```tsx
/**
 * Sidebar note on `siteSettings`'s edit view, after the built-in sidebar
 * fields — exists to dogfood a global-level
 * `admin.components.edit.sidebar.after` contribution.
 */
export function CachePurgeNote() {
  return (
    <p className="text-xs text-muted-foreground">
      Saving re-resolves `livePreview.url` for every page on next load; no manual cache purge
      needed.
    </p>
  );
}
```

#### apps/test/src/vexcms/globals/siteSettings.ts

1 edit; everything not shown is unchanged.

**1 — `admin.components.edit`**, added to the existing `admin` object alongside `icon`/`description`.

```ts
import { CachePurgeNote } from "~/vexcms/components/CachePurgeNote";
```

```ts
  admin: {
    icon: "Settings",
    description: "Site name, SEO defaults, and the themes applied to the site and the admin panel.",
    components: {
      edit: {
        sidebar: {
          after: [{ id: "editorial.cachePurgeNote", component: CachePurgeNote }],
        },
      },
    },
  },
```

#### apps/docs/src/content/docs/guides/admin-customization.mdx

Existing guide covers field-level override chains and `blocks`/`array` additive lists only.
Append a new `## Edit-view slots` section after the existing `## Slot ids` section (before
`## Rendering, in @vexcms/react`, which gets one more paragraph) — same prose/code style as
the rest of the guide, no new caution banner (the top-of-file `:::caution[Experimental]`
already covers the whole page).

````md
## Edit-view slots

Collection and global edit views expose seven slots under
`admin.components.edit`, set at the root of `defineConfig()` for every
resource or on one collection/global's own `admin.components.edit`:

```ts
import { defineConfig } from "@vexcms/core"

export default defineConfig({
  admin: {
    components: {
      edit: {
        header: {
          actions: [{ id: "acme.exportPdf", component: ExportPdfAction }],
          before: [],
          after: [{ id: "acme.envBadge", component: EnvBadge }],
        },
        beforeFields: [],
        afterFields: [],
        sidebar: {
          before: [],
          after: [{ id: "acme.cacheNote", component: CacheNote }],
        },
      },
    },
  },
})
```

`SLOT_IDS.edit` names them: `edit.header.actions`, `edit.header.before`,
`edit.header.after`, `edit.beforeFields`, `edit.afterFields`,
`edit.sidebar.before`, `edit.sidebar.after`. All seven are additive
contribution lists — the same `ComponentContributionInput` shape as
`blocks.item.actions` — merged root → collection/global level with the same
`order`/`before`/`after`/`hidden`/`access`/`condition` resolution as every
other slot in this guide. Every entry's `component` receives
`EditSlotProps`: `{ kind: "collection" | "global"; slug: string }`.

### Built-in edit actions

Save, Publish, Unpublish, Delete, Duplicate, version history and the
live-preview toggle render through `edit.header.actions` as `vex.*`
contributions, under `BUILTIN_CONTRIBUTION_IDS.edit`:

```ts
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core"

BUILTIN_CONTRIBUTION_IDS.edit.save            // "vex.save"
BUILTIN_CONTRIBUTION_IDS.edit.publish         // "vex.publish"
BUILTIN_CONTRIBUTION_IDS.edit.unpublish       // "vex.unpublish"
BUILTIN_CONTRIBUTION_IDS.edit.delete          // "vex.delete"
BUILTIN_CONTRIBUTION_IDS.edit.duplicate       // "vex.duplicate" — collections only, not media
BUILTIN_CONTRIBUTION_IDS.edit.versionHistory  // "vex.versionHistory"
BUILTIN_CONTRIBUTION_IDS.edit.livePreview     // "vex.livePreview"
```

Hide one the same way as a block action — a hide directive naming the id:

```ts
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core"

admin: {
  components: {
    edit: {
      header: {
        actions: [{ id: BUILTIN_CONTRIBUTION_IDS.edit.duplicate, hidden: true }],
      },
    },
  },
}
```

### Wrapping a built-in edit action

Unlike `blocks`/`array` actions, each `edit.*` slot that carries built-ins also
takes an `overrides` map keyed by the built-in's id — the key names what is
wrapped, each entry's own `id` names the wrapper, and array order is
composition order (first = outermost):

```ts
import { BUILTIN_CONTRIBUTION_IDS } from "@vexcms/core"

admin: {
  components: {
    edit: {
      header: {
        overrides: {
          [BUILTIN_CONTRIBUTION_IDS.edit.save]: [
            { id: "acme.save.confirm", component: ConfirmBeforeSave },
          ],
        },
      },
    },
  },
}
```

`ConfirmBeforeSave` receives `renderDefault` — the built-in Save button (or
the next wrapper in, if more than one targets `vex.save`) — the same
override-chain contract as `Input`/`Cell`. An override keyed to an id that
isn't in that slot's resolved list throws `VexComponentConfigError`, same as
a duplicate id within one resolved list.

## `useVexDocument`

Built-in and third-party edit-view contributions read document-level state
through `useVexDocument()` (`@vexcms/react`), not through form state:

```tsx
import { useVexDocument } from "@vexcms/react"

function PublishedSince() {
  const document = useVexDocument()
  if (document.status !== "published") return null
  return <span>Published</span>
}
```

```ts
type VexDocumentState = {
  kind: "collection" | "global"
  slug: string
  id?: string          // absent on a new, unsaved document
  saved: Record<string, unknown> | undefined // last saved values, not live form state
  isDirty: boolean
  status?: "draft" | "published" // versioned resources only
  canEdit: boolean
}
```

It deliberately excludes live field values — `useVexForm` already exposes
those, and re-exporting them here would re-render every `useVexDocument()`
consumer on every keystroke. It throws outside `VexDocumentProvider`, which
both edit views mount.

## `useVexNavigate`

A contribution that navigates after its own mutation — not a click, which `VexLink` already
covers — calls `useVexNavigate()` (`@vexcms/react`) instead of its framework's own
`useRouter().push`: it returns `(href) => void` guarded by the same unsaved-changes check as
an in-app link click, falling back to a full page navigation when the current adapter has no
`useNavigate` capability. A raw framework `router.push` bypasses that guard entirely.

```tsx
import { useVexNavigate } from "@vexcms/react"

function ArchiveAndLeave() {
  const navigate = useVexNavigate()
  return <button onClick={() => navigate("/admin/collections/posts")}>Archive</button>
}
```
````

A short addition to the end of the existing `## Rendering, in @vexcms/react`
section (after its last paragraph, same section, no new heading) documents
where edit slots fit in the rendering story:

```md

Edit-view slots render through the same `SlotOutlet` via
`DocumentEditSlotOutlet` (`packages/react/src/documents/DocumentEditSlotOutlet.tsx`), which also
resolves each slot's `overrides` map and wraps every override layer — like
every other override chain in this guide — in its own `ComponentErrorBoundary`
keyed by the override id.
```

#### apps/docs/src/content/docs/guides/framework-adapters.md

Insert a new section after `## Step 8 — Implement the framework layout component` and before
`## Wiring it into an app`, matching the doc's existing `## Step N` numbering.

````md

---

## Step 9 — Implement the navigation-blocker and navigate capabilities (both optional)

`@vexcms/react` defines an unsaved-changes navigation guard framework-neutrally and asks the
adapter for two independent, optional capabilities: intercepting in-app navigation
(`navigationBlocker`) and performing a post-mutation programmatic navigation
(`useNavigate`). An adapter that skips both still works — `beforeunload` still prompts on tab
close / hard reload, but in-app navigation and a built-in's post-mutation redirect are
unguarded.

```ts
interface NavigationBlockerAdapter {
  useBlocker(props: {
    when: boolean;
    onBlock: (proceed: () => void) => void;
  }): void;
}
```

`useBlocker` is a hook: while `when` is `true`, the adapter intercepts in-app navigation and
calls `onBlock(proceed)` instead of letting it through. Calling `proceed()` lets the
navigation that triggered the block continue; not calling it cancels that navigation attempt.
`@vexcms/react`'s `useUnsavedChangesGuard`
(`packages/react/src/forms/useUnsavedChangesGuard.ts`) is the only caller — it supplies
`onBlock` and owns the Stay/Leave dialog; the adapter owns nothing about *why* navigation is
blocked, only *how* to intercept it. `beforeunload` is handled by `@vexcms/react` directly
(every framework runs in a browser), so the adapter contract has no unload hook. Without
`navigationBlocker`, in-app navigation is unguarded but `beforeunload` still works.

There is no `pushState`/`replaceState` patching, and no patching of a framework router's own
`push`/`replace`, in this contract. `@vexcms/next`'s implementation
(`useNextNavigationBlocker`, `packages/next/src/navigation/`) intercepts only the two surfaces
that fire BEFORE a route change commits: same-origin anchor clicks, in the capture phase
(skipping modifier-key clicks, clicks on an anchor with a `target`, and clicks on a
cross-origin or same-page-hash `href`), and browser back/forward, via a same-URL `popstate`
sentinel pushed on mount that lets the hook catch and correct the first back-press. Next
itself calls `pushState` only AFTER the new route has already committed (from
`HistoryUpdater`'s `useInsertionEffect`), and patches `pushState`/`replaceState` itself — by
the time either fires, the outgoing page is already unmounted, so intercepting there is too
late to prevent anything. A raw `<button onClick={() => router.push(...)}>` or any other
programmatic navigation is therefore invisible to `navigationBlocker` by design.

```ts
useNavigate?: () => (href: string) => void;
```

`useNavigate` closes that gap a different way: it is consumed only by `@vexcms/react`'s
`useVexNavigate()`, the supported path for programmatic navigation inside the admin — used by
built-ins for a post-mutation redirect (after delete, after a duplicate's create resolves).
`useVexNavigate` consults the same blocking state as `navigationBlocker` itself before calling
through, so every built-in that navigates after a mutation stays guarded without
`navigationBlocker`'s involvement. Everything clickable keeps using `VexLink`/`Link`, covered
by `navigationBlocker` above — a raw framework `router.push` called from third-party code is
NOT guarded, only `useVexNavigate` is. Omitting `useNavigate` falls back to
`window.location.assign`, a full page navigation.

Provide both capabilities through the same framework-components mechanism as `Link`/`Image`
(Step 6, above) — `@vexcms/next` supplies `navigationBlocker: { useBlocker:
useNextNavigationBlocker }` and `useNavigate: useNextNavigate` (wrapping `useRouter().push`
from `next/navigation`) from `NextAdminLayoutClient.tsx`, mounted once above the admin route
tree alongside `Link`/`Image`.

**For non-React or server-rendered frameworks:** implement `useBlocker` against your router's
own navigation-interception primitive, and `useNavigate` against its programmatic-navigation
API. A framework with no client-side router (full page loads only) has no in-app navigation to
intercept and no programmatic navigation to wrap — omit both; `beforeunload` alone still
covers it, since that is handled outside the adapter.
````

#### .changeset/edit-view-slots.md

```md
---
"@vexcms/core": minor
"@vexcms/react": minor
---

Edit-view extension points. Seven new slots under `admin.components.edit` — `header.actions`,
`header.before`, `header.after`, `beforeFields`, `afterFields`, `sidebar.before`,
`sidebar.after` — for collections and globals, resolved root → resource level with the same
`order`/`before`/`after`/`hidden`/`access`/`condition` model as every other slot. Save,
Publish, Unpublish, Delete, version history and the live-preview toggle are now `vex.*`
built-in contributions in `edit.header.actions`, from `BUILTIN_CONTRIBUTION_IDS.edit` —
hideable, reorderable, and wrappable through a new per-slot `overrides` map keyed by built-in
id (`overrides: { "vex.save": [...] }`). An override keyed to an id outside that slot's
resolved list throws `VexComponentConfigError`.

New `useVexDocument()` hook (`@vexcms/react`) exposes document-level state — `kind`, `slug`,
`id`, `saved`, `isDirty`, `status`, `canEdit` — to built-in and third-party edit-view
contributions; it throws outside its provider, which both edit views now mount.

Every override layer — in field `Input`/`Cell` chains and in the new edit-slot `overrides` —
now renders inside its own `ComponentErrorBoundary` keyed by the override id; a throwing
wrapper renders the layer beneath it plus an inline error instead of breaking the view. This
changes the field-override error behavior shipped in the field-input-consistency-pass
changeset.
```

#### .changeset/duplicate-document.md

```md
---
"@vexcms/core": minor
"@vexcms/react": minor
---

Duplicate document. A `vex.duplicate` built-in action in `edit.header.actions` on every
non-media collection (not globals, not media; gated on the `create` permission) clones the
current document — stripping `_id`, `_creationTime`, `_status`, `_version` and timestamps and
regenerating array/block item ids — and creates it. On success it navigates to the new
document; on a unique-value conflict it opens a create modal prefilled with every field
(`CreateDocumentForm`/`CreateDocumentModal` gain `fields: "all"`, `initialValues`, and
`submitOnOpen`) and submits immediately, so the existing failed-submit focus/reveal behavior
lands on the conflicting field. A duplicated document in a versioned collection always
creates as a draft.
```

#### .changeset/unsaved-changes-guard.md

```md
---
"@vexcms/react": minor
"@vexcms/next": minor
---

Unsaved-changes navigation guard. Both edit views now block navigating away from a dirty form
— in-app links and back/forward prompt with a styled Stay/Leave dialog; `beforeunload`
prompts with the browser's native dialog. A form is dirty when its values differ from their
default (`!isDefaultValue`); `useAutosave`'s new `hasUnsavedChanges` result field drives this
on an autosave-enabled document — true during the debounce window, while a save is in flight,
or after a failed save, false once a successful save's reset settles the diff to empty —
already-persisted autosaved work never prompts. The guard releases automatically after a
successful save, delete, or duplicate navigation.

New `useVexNavigate()` hook (`@vexcms/react`) is the supported path for a built-in's
post-mutation redirect (after delete, after a duplicate's create resolves) — it consults the
same blocking state and shows the same dialog as an in-app click or back/forward, falling back
to `window.location.assign` when the adapter has no `useNavigate`.

The interception itself is a framework-adapter capability (`NavigationBlockerAdapter`), not a
`@vexcms/react` dependency on `next/navigation` — `@vexcms/next` is the only adapter that
implements it today, intercepting same-origin anchor clicks in the capture phase and trapping
back/forward via `popstate`; no `pushState`/`replaceState` patching.
```

#### .agent/docs/product/v0.1.0-launch-plan.md

3 edits; everything not shown is unchanged.

**1 — mark every remaining G implementation step done**, replacing steps 6–18's `[ ]`
checkboxes under `## G — Field input consistency pass ⏳` with `[x]`, and the section heading
loses its `⏳` (all tasks, including `- [ ] Implement`, are now checked).

```md
## G — Field input consistency pass ✅

### Tasks
- [x] Spec (`2026-10-16-field-input-consistency-pass`, 18 steps)
- [x] Implement
  - [x] Step 1 — `min`/`max` tuple limits everywhere
  - [x] Step 2 — `email()` field
  - [x] Step 3 — `textarea()` field
  - [x] Step 4 — `json()` field
  - [x] Step 5 — `updatedAt` as `date()`; date cell shows time
  - [x] Step 6 — Core layout model: `width`, `admin.layout`, `admin.condition`, `tabs()` / `collapsible()` / `row()`
  - [x] Step 7 — Core extension-point model: slot IDs, contribution types, resolution
  - [x] Step 8 — React slot primitives + single field registry
  - [x] Step 9 — Server-side condition enforcement; stored array-item ids
  - [x] Step 10 — Input masks
  - [x] Step 11 — React layout renderer `RenderFields` with field slots
  - [x] Step 12 — React conditions + condition-aware client validation
  - [x] Step 13 — `usePaginatedSearch` + upload picker fixes
  - [x] Step 14 — Relationship field overhaul
  - [x] Step 15 — Blocks + array editing actions
  - [x] Step 16 — Block clipboard
  - [x] Step 17 — Per-input polish + state sweep; `adminHref`
  - [x] Step 18 — Dogfood in `apps/test` + plan bookkeeping
```

**2 — mark H done and record the dropped error summary**, replacing `## H — Edit-view
overhaul`'s `### Tasks` checkboxes and adding a note after `### Scope`.

```md
## H — Edit-view overhaul ✅

### Tasks
- [x] Write spec (`2026-10-26-edit-view-overhaul`)
- [x] Implement
  - [x] Unsaved-changes navigation guard through the framework adapter
  - [x] Collections move to `/admin/collections/<slug>`
  - [x] Duplicate document
  - [x] Edit-view slots, built-in actions as `vex.*` contributions
  - [x] Complete the S5 context hooks (`useVexDocument`, `useVexPermissions`)

> **Dropped during spec interview (2026-10-26):** the document-level error
> summary banner. Jump-to-first-error already shipped (`forms/AppForm.tsx`
> `focusFirstFieldError`, the tab/collapsible reveal) and the duplicate
> fallback reuses it — the brief's item is covered without a new banner.
```

**3 — drop the error-summary acceptance bullet**, in `### Scope`'s bullet list (the
`Validation error summary at document level, jump-to-field.` line is removed; see edit 2's
note instead) and in the `**Acceptance:**` paragraph, which no longer lists it.

```md
**Acceptance:** navigating away from a dirty form prompts; duplicating a document works
and is covered by `viewSuite`; collection URLs live under `/admin/collections/<slug>`; a contribution configured at root,
collection, and global level renders in each edit-view slot in `order` / `before` / `after`
order; a built-in action can be hidden, reordered, and wrapped by ID; a throwing
contribution shows an inline error without breaking the view.
```

Verify: pnpm build && pnpm test; manual smoke of every acceptance bullet in `apps/test`


### Step 10 — Regression review against origin/dev [agent]

Why: H moves the edit views' controls (Save/Publish/Unpublish/Delete/Duplicate/version
history/live-preview toggle, the `DraftToolbar` row, and every override/error-boundary layer)
into built-ins spread across `documents/`, `versions/`, `livePreview/` and `collections/`. Prove
nothing was lost in the move — no test, no Tailwind class, no exported API — only additions (new
files, new slots, new contributions).

1. **Diff against origin/dev.**

```sh
git fetch origin dev
git diff --stat origin/dev...HEAD
```

2. **Tests: no coverage lost.**

```sh
# No deleted test files; renames (R) must be listed, not silently dropped.
git diff --name-status origin/dev...HEAD -- '*.test.*' | grep -E '^D' && echo "FAIL: deleted test file(s) above" || echo "OK: no deleted test files"
git diff --name-status origin/dev...HEAD -- '*.test.*' | grep -E '^R'
```

For every test file that survives on both sides (same path, or the renamed-to path), the
`it(`/`test(` count on HEAD must be `>=` the count on `origin/dev`:

```sh
for f in $(git diff --name-status origin/dev...HEAD -- '*.test.*' | awk '$1 !~ /^D/ {print $NF}'); do
  old=$(git show "origin/dev:$f" 2>/dev/null | grep -cE '\b(it|test)\(')
  new=$(grep -cE '\b(it|test)\(' "$f" 2>/dev/null || echo 0)
  if [ -n "$old" ] && [ "$new" -lt "$old" ]; then
    echo "FAIL: $f dropped from $old to $new cases"
  fi
done
echo "done"
```

The only allowed count drops are cases that covered the retired `DraftToolbar.tsx` — list each
one here, paired with the new built-in test that replaces it (decision 16):

| Old case (origin/dev) | File | Replaced by |
|---|---|---|
| *(fill in during review)* | | |

3. **Tailwind: no class lost off a moved surface.** For every changed `.tsx` under
   `packages/react/src`, extract its `className`/`cn(...)`/`cva(...)` string literals and tokenize
   on whitespace, on both `origin/dev` and `HEAD`. This script is for review only — run it, read
   the output, never commit it:

```js
// scripts/_tailwind-diff.mjs — throwaway, do not commit
import { execSync } from "node:child_process";

function tokensFor(ref, file) {
  let text;
  try {
    text = execSync(`git show ${ref}:${file}`, { encoding: "utf8" });
  } catch {
    return new Set(); // file doesn't exist on this ref
  }
  const tokens = new Set();
  const literalRe = /(?:className\s*=\s*|cn\(|cva\(\s*)["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = literalRe.exec(text))) {
    for (const t of m[1].split(/\s+/).filter(Boolean)) tokens.add(t);
  }
  return tokens;
}

const files = execSync(
  "git diff --name-only origin/dev...HEAD -- 'packages/react/src/**/*.tsx'",
  { encoding: "utf8" },
).trim().split("\n").filter(Boolean);

for (const file of files) {
  const before = tokensFor("origin/dev", file);
  const after = tokensFor("HEAD", file);
  const removed = [...before].filter((t) => !after.has(t));
  if (removed.length > 0) {
    console.log(`${file}: removed ${removed.length} token(s)`);
    console.log(`  ${removed.join(", ")}`);
  }
}
```

Every token this reports as removed from `CollectionEditView.tsx`, `GlobalEditView.tsx` or
`versions/DraftToolbar.tsx` must reappear in the built-in that took over that markup. Map each
removal explicitly:

| Removed token(s) | Was on | Must now appear in |
|---|---|---|
| sticky header layout (`z-10 -mx-6 flex min-h-16 shrink-0 flex-wrap items-center justify-between gap-y-2 border-b bg-background px-6`) | `CollectionEditView.tsx`/`GlobalEditView.tsx`/`DraftToolbar.tsx` | `CollectionEditView.tsx`/`GlobalEditView.tsx` (header div is NOT a built-in — confirm it stayed inline) |
| button variants (`variant="outline"` plus any `cva` classes) | `DraftToolbar.tsx` | `DocumentSaveAction.tsx`, `versions/VersionPublishAction.tsx`, `versions/VersionUnpublishAction.tsx`, `livePreview/LivePreviewToggleAction.tsx` |
| responsive classes (`@3xl/form:*`, `sm:*`) | `CollectionEditView.tsx`/`GlobalEditView.tsx` | same files — confirm unchanged, not dropped by the rewrite |

Report every leftover (a removed token with no destination) as a finding.

4. **Features/API: no silent removal.** Diff the export lists of every package's root barrel and
   every changed component's exported props type against `origin/dev`:

```sh
for pkg in core react next; do
  echo "=== @vexcms/$pkg ==="
  diff <(git show origin/dev:packages/$pkg/src/index.ts | grep -oE '\b[A-Za-z_][A-Za-z0-9_]*\b' | sort -u) \
       <(grep -oE '\b[A-Za-z_][A-Za-z0-9_]*\b' packages/$pkg/src/index.ts | sort -u) \
    | grep '^<' || echo "no removed identifiers"
done
```

For each changed component (`CollectionEditView.tsx`, `GlobalEditView.tsx`, and every file under
`documents/`, `versions/`, `livePreview/`, `collections/` touched by this spec), diff its exported
`*Props` interface against `origin/dev`'s equivalent (same component, even if the file moved —
use `git show origin/dev:<old path>` against the renamed file). Every removed prop/field must be
justified by a numbered spec decision (e.g. decision 15 moving actions into built-ins); anything
else is a finding.

5. **Full gate.**

```sh
pnpm typecheck && pnpm test && pnpm build
```

6. **Record findings, fix, repeat.** Record every finding from steps 2–5 in this table (empty
   when clean):

#### Findings

| # | Step | File | Finding | Fix |
|---|---|---|---|---|

Fixes are restorations only — add back the missing test/class/export in its new home. No
refactors, no new features, no scope beyond what origin/dev already had. Repeat steps 2–5 until
the table is empty.

Verify: the Findings table above is empty, and `pnpm typecheck && pnpm test && pnpm build` is green.

## Verification

- [ ] `pnpm typecheck && pnpm test && pnpm build` green
- [ ] Browser smoke in `apps/test` covering every acceptance bullet (step 9)
- [ ] Step 10's Findings table is empty — no test, Tailwind class or export was lost in the built-in move
