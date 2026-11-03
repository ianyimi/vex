import { createElement } from "react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, waitFor, within } from "@testing-library/react";
import { convexTest } from "convex-test";
import {
  buildListViewFindQueryArgs,
  defineAccess,
  defineCollection,
  defineConfig,
  parseListViewUrlState,
  resolveListViewQueryState,
  select,
  text,
  ui,
  vexConvexApi,
  VERSION_SYSTEM_FIELDS,
  type PaginationResult,
  type VexAccessConfig,
  type VexDocument,
  type VexMediaDocument,
} from "@vexcms/core";
import { getFunctionName } from "convex/server";
import schema, { testModules, type TestDoc } from "./convex/schema";
import type { ConvexTestInstance } from "./convex/bridge";
import { renderWithVexProviders, testAccess, testCollection } from "./harness/accessFixtures";
import { renderView, testClientConfig, wrapWithViewProviders } from "./harness/viewHarness";
import { runRbacStateSuite } from "./rbacState";
import { ThemeProvider } from "../ui/ThemeProvider";
import { SidebarProvider } from "../ui/sidebar";
import {
  FrameworkComponentsContext,
  useFrameworkComponents,
  type FrameworkComponents,
  type VexLinkProps,
} from "../config/useFrameworkComponents";
import { AdminLayout } from "../admin/AdminLayout";
import { AppSidebar } from "../admin/AdminSidebar";
import AdminTopNav from "../admin/AdminTopNav";
import { CollectionListView, CollectionEditView } from "../collections";
import { GlobalEditView, GlobalsListView } from "../globals";
import { DashboardView, CollectionsIndexView, UnauthorizedView } from "../admin";
import { MediaCollectionListView, MediaCollectionEditView } from "../media";

/**
 * One entry per `runRbacStateSuite` default scenario name, resolved for a given
 * resource/action/scope combination. Three distinct matrices cover every
 * `usePermission`/`hasPermission` call site this suite exercises — see the derivation
 * comment above each constant.
 */
type RbacMatrix = Record<"none" | "anonymous" | "denied" | "allowed" | "scoped", boolean>;

/**
 * A fake user carrying the given role — the same shape `usePermission.test.tsx`'s
 * own `asUser` helper returns, reused here for the field-map/column-filtering
 * scenarios that need a role outside `testAccess`'s shared matrix.
 *
 * @param role - The role the caller holds.
 * @param _id - The caller's document id.
 * @returns A user document shaped for `VexAuthProvider`.
 */
const asUser = (role: string, _id = "u1"): Record<string, unknown> => ({ _id, roles: role });

/**
 * `testAccess`'s shared matrix (`harness/accessFixtures.ts`) grants role "allowed" a
 * resource-level wildcard (`{ posts: { "*": true } }`) and role "scoped" only a `read`
 * constraint on `posts` — nothing for `create`/`update`/`delete`. Verified directly against
 * `packages/core/src/access/hasPermission.ts`: an undeclared action on a DECLARED resource
 * falls through `resolveActionCheck` to `defaultPermissionMode` (`false`, P-007), independent
 * of `scope`. Applies to every `create`/`update`/`delete` check against `testCollection`
 * ("posts") — identical to `runRbacStateSuite`'s own default probe (`action: "read"`, scope
 * "all"), because `scoped`'s `read` constraint with no `data` and scope "all" also resolves
 * to `false` (`resolveConstrainedCheck`).
 */
const MATRIX_POSTS: RbacMatrix = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: true,
  scoped: false,
};

/**
 * Same "posts" resource, but for a `read` + `scope: "any"` check (the sidebar/dashboard's
 * nav-gating shape). `scoped`'s `read` key IS a constraint, and `resolveConstrainedCheck`
 * answers an "any document" quantified question with no `data` as `true` for scope "any" —
 * the opposite of scope "all" above. Verified against `hasPermission.ts`'s
 * `resolveConstrainedCheck`.
 */
const MATRIX_POSTS_READ_ANY: RbacMatrix = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: true,
  scoped: true,
};

/**
 * `testAccess`'s roles declare permissions ONLY under the `posts` key — "images" and
 * "settings" (this suite's media collection and global) are undeclared resources for every
 * role. `hasPermission` resolves an undeclared resource via the ROLE-level wildcard
 * (`role["*"]`), not the per-resource one, and no role in `testAccess` sets one — so
 * `denied`/`allowed`/`scoped` all fall through to `defaultPermissionMode` (`false`),
 * regardless of action or scope. Verified against `hasPermission.ts` lines 108-127.
 */
const MATRIX_UNDECLARED: RbacMatrix = {
  none: true,
  anonymous: false,
  denied: false,
  allowed: false,
  scoped: false,
};

/**
 * Wraps a seeded document array as the `PaginationResult` `usePaginatedQuery` expects.
 *
 * @param docs - The seeded convex-test rows to expose as a single, complete page.
 * @returns A one-page, already-done `PaginationResult`.
 */
function toPage<TDoc extends VexDocument = VexDocument>(
  docs: TestDoc<"documents">[],
): PaginationResult<TDoc> {
  // convex-test's schema-derived doc type has no index signature; `VexDocument` requires one,
  // and `VexMediaDocument` (the media list view's TDoc) requires media-specific fields none of
  // this suite's seeded rows carry (they only exercise the "no src" fallback rendering path).
  return { page: docs as unknown as TDoc[], continueCursor: "", isDone: true };
}

/**
 * Builds a {@link ViewHarnessOptions.seedQueryData} entry for `CollectionListView`'s own
 * `findPaginated` seed query, against a collection's DEFAULT (no URL params) view state —
 * the exact `queryKey` shape `convexQuery(vexConvexApi.findPaginated, ...)` builds at
 * render time, computed via the SAME `resolveListViewQueryState`/`buildListViewFindQueryArgs` calls
 * the real component uses, so this is guaranteed to match regardless of a collection's own
 * `admin.view` defaults (never hand-duplicated/hardcoded here).
 *
 * Use for a fixture the fake backend's own `"vex:find"` handler can't reproduce — e.g. a
 * draft/published pair already merged server-side by `mergeDraftCounterparts`, which the
 * fake handler's own `config` has no `versions` info for (`collectionConfig?.versions
 * ?.drafts === true` never passes there, so the real merge logic never runs against seeded
 * convex-test rows).
 *
 * @param props.collection - The collection the seeded page belongs to (its own `admin.view`
 *   defaults resolve `numItems`/`sort`).
 * @param props.page - The already-resolved page content (e.g. a hand-merged draft pair).
 * @returns One `seedQueryData` entry.
 */
function seedFindPaginatedQueryData(props: {
  collection: typeof testCollection;
  page: PaginationResult<VexDocument>;
}): { queryKey: unknown[]; data: unknown } {
  const params = parseListViewUrlState({ searchParams: new URLSearchParams(""), collection: props.collection });
  const resolved = resolveListViewQueryState({ collection: props.collection, params });
  const numItems = Math.max(props.collection.admin.view.state.serverPageSize, resolved.pageSize);
  const args = buildListViewFindQueryArgs({
    collection: props.collection,
    where: resolved.where,
    sort: resolved.sort,
    drafts: true,
    depth: 1,
    numItems,
  });
  return { queryKey: ["convexQuery", getFunctionName(vexConvexApi.findPaginated), args], data: props.page };
}

/**
 * The visible `<thead>` column header labels, in column order. `DataTable`
 * does not emit a `data-column-id` attribute, so header text is the stable
 * way to assert which columns render — the select column's header is a
 * `Checkbox` with no text, so it reads as an empty string here.
 *
 * @param container - The rendered view's root element.
 * @returns One entry per `<th>`, in DOM order.
 */
function columnHeaderTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll("thead th")).map((th) => th.textContent ?? "");
}

/**
 * Inserts one "documents" row per title and returns the seeded rows, in insertion order.
 *
 * @param t - The `convexTest()` instance to seed.
 * @param titles - One title per row to insert.
 * @returns The seeded rows, in insertion order.
 */
async function seedDocuments(
  t: ConvexTestInstance,
  titles: string[],
): Promise<TestDoc<"documents">[]> {
  return t.run(async (ctx) => {
    const ids = await Promise.all(titles.map((title) => ctx.db.insert("documents", { title })));
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs.filter((doc): doc is TestDoc<"documents"> => doc !== null);
  });
}

/**
 * Full-mount `CollectionListView` — the SSR-preview stack transitively rendered here is
 * `DataTable` + `ListViewCreateDocumentModal` + `RevalidateButton`, exactly what an admin visits.
 *
 * `canDelete` gates the row-selection checkbox column (`enableRowSelection={canDelete}`),
 * so its observable consequence is whether a header checkbox exists at all — asserted in
 * the two dedicated delete-permission tests below. `canCreate` (the "+ New" button) and
 * `RevalidateButton` (the same "posts" resource, `update` action) are what the RBAC matrix
 * suite gates on.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeCollectionListView(options: { access?: VexAccessConfig }): void {
  describe("CollectionListView", () => {
    // `beforeEach`, not a describe-scoped `const t` + `beforeAll`: convex-test's syscall
    // dispatch goes through a single `global.Convex` reference
    // (`convex-test/dist/index.js`'s `setConvexGlobal`/`getConvexGlobal`) that every
    // `convexTest()` call overwrites — a later instance (`emptyT`/`t2` in the tests below)
    // silently redirects every subsequent call made THROUGH an earlier instance's own `t`
    // handle to the later instance's database instead, with no error. A describe-scoped `t`
    // shared via `beforeAll` depended on no sibling test ever constructing its own
    // `convexTest()` instance after it ran — true only by accident of declaration order
    // (2026-10-31 investigation: `t.run(ctx => ctx.db.query("documents").collect())` read 3
    // rows immediately before a sibling test's own `convexTest()` call and 0 immediately
    // after, with nothing else in between). A fresh `t` + fresh seed before every single
    // test removes the ordering dependency entirely — each test's own `convexTest()` call is
    // the LAST one made before its own assertions run, so it always owns the global.
    let t: ConvexTestInstance;
    beforeEach(async () => {
      t = convexTest(schema, testModules);
      await seedDocuments(t, ["First", "Second", "Third"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", async () => {
        const { container, unmount, findAllByRole } = renderView(
          createElement(CollectionListView, {
            collection: testCollection.slug,
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        // No `initialData` (polish fixes, Decision 11) — the fake Convex client's own
        // `query` is genuinely async (`testing/convex/bridge.ts`), so every assertion here
        // waits for the live query to settle instead of asserting synchronously right after
        // `render()`.
        await findAllByRole("row");
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders rows from seeded data", async () => {
      const utils = renderView(
        createElement(CollectionListView, {
          collection: testCollection.slug,
        }),
        { convex: t },
      );
      // Step 12: `ListViewLayout`'s own static "N documents" subtitle was
      // replaced by `SavedListViewTabs`'s heading (plain collection name, or the
      // active view's name) — the row count now reads from `DataTable`'s
      // own "Showing N" footer instead (Decision 35). With `initialData`
      // gone (polish fixes, Decision 11), `pagination.totalCount` now
      // resolves to a REAL number from the live query (it used to be
      // `undefined` via the old `toPage()` helper, which never set a
      // `totalDocs`-equivalent) — the footer reads "Showing 3 of 3", not
      // bare "Showing 3", split across sibling text nodes inside the same
      // `<p>` (` of ` is its own JSX fragment child) — an exact
      // `findByText("Showing 3")` can never match a single text node for
      // that shape, hence the function matcher below instead.
      expect(
        await utils.findByText(
          (_content, element) => element?.tagName === "P" && (element.textContent?.startsWith("Showing 3") ?? false),
        ),
      ).toBeInTheDocument();
      utils.unmount();
    });

    it("renders the empty state with zero documents", async () => {
      const emptyT = convexTest(schema, testModules);
      const utils = renderView(
        createElement(CollectionListView, {
          collection: testCollection.slug,
        }),
        { convex: emptyT },
      );
      // Step 10: a done, zero-row query renders `ListViewEmptyState` in place of
      // the table body, not a bare header row. `DataTable`'s "Showing N"
      // footer renders only for `data.length > 0` (Step 12: no equivalent
      // "0 documents" text exists elsewhere once a view is active).
      expect(await utils.findByText("No posts yet")).toBeInTheDocument();
      expect(utils.queryAllByRole("row")).toHaveLength(0);
      utils.unmount();
    });

    it("shows selection checkboxes for every role, but no bulk-delete button for a role without delete permission", async () => {
      // `DataTable`'s checkbox column is unconditional now — `ListViewRowDeleteAction`/
      // `ListViewBulkDeleteAction` self-gate on delete access instead (Decision 37's review:
      // a role without delete may still have a `list.bulkActions` contribution beyond
      // delete, e.g. a bulk-export plugin, so the checkbox column itself is not a delete
      // affordance).
      const noDeleteAccess = defineAccess({
        roles: ["reader"] as const,
        resources: [testCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          reader: { posts: { read: true, delete: false } },
        },
      });
      const utils = renderView(
        createElement(CollectionListView, {
          collection: testCollection.slug,
        }),
        { convex: t, access: noDeleteAccess, auth: { user: asUser("reader") } },
      );
      await utils.findAllByRole("row");
      expect(utils.container.querySelector('thead [data-slot="checkbox"]')).not.toBeNull();
      const hiddenInputs = utils.container.querySelectorAll<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      fireEvent.click(hiddenInputs[1]!);
      expect(utils.queryByRole("button", { name: /delete/i })).toBeNull();
      utils.unmount();
    });

    it("shows selection checkboxes for a role with delete permission", async () => {
      const deleterAccess = defineAccess({
        roles: ["deleter"] as const,
        resources: [testCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          deleter: { posts: { read: true, delete: true } },
        },
      });
      const utils = renderView(
        createElement(CollectionListView, {
          collection: testCollection.slug,
        }),
        { convex: t, access: deleterAccess, auth: { user: asUser("deleter") } },
      );
      await utils.findAllByRole("row");
      expect(utils.container.querySelector('thead [data-slot="checkbox"]')).not.toBeNull();
      utils.unmount();
    });

    it("renders without crashing when useAsTitle points at a non-text field", async () => {
      // `useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>` (core/collections/types.ts:170)
      // accepts ANY field key, including a select/date/number column, not just a text one.
      // `getCollectionColumnDefs` (components/fields/index.tsx:220) marks whichever field's
      // key equals `useAsTitle` as `isTitleField` regardless of its type — the same shared
      // logic that makes Step 5's CELL-1 (9 of 12 Cell components silently ignore
      // `isTitleField`) reachable in the first place. This proves the full-mount list view
      // survives a non-text title column; whether that column ends up clickable is Step 5's
      // own contract, not asserted here.
      const priorityTitleCollection = defineCollection({
        slug: "posts",
        fields: {
          status: text({ index: "by_status" }),
          title: text({ required: false }),
          priority: select({
            label: "Priority",
            options: [
              { label: "Low", value: "low" },
              { label: "High", value: "high" },
            ],
          }),
        },
        admin: { useAsTitle: "priority" },
        // `useAsTitle` is typed against `testCollection`'s own generated field-key union
        // ("status"), which doesn't include this test-local "priority" key — a real
        // collection's own `TFieldSlug` would. Cast at this boundary rather than widen the
        // shared fixture's type.
      }) as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [priorityTitleCollection] };
      const utils = renderView(
        createElement(CollectionListView, {
          collection: priorityTitleCollection.slug,
        }),
        { convex: t, config },
      );
      await waitFor(() => expect(utils.getAllByRole("row")).toHaveLength(4)); // 1 header row + 3 data rows
    });

    it("filters columns by the caller's read field permissions", async () => {
      // `posts` gets a second real field here (`title`, backed by the schema's
      // own column) so a map can deny one field while leaving another
      // visible. `viewer` denies `status`; `plain` declares no map at all;
      // `perDoc`'s check reads `data`, which a whole-table column can't
      // answer, so `scope: "any"` must keep it rather than hide it.
      const postsWithTitle = {
        ...testCollection,
        fields: { ...testCollection.fields, title: text({ required: false }) },
      } as unknown as typeof testCollection;
      const fieldMapAccess = defineAccess({
        roles: ["viewer", "plain", "perDoc"] as const,
        resources: [postsWithTitle],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          // `delete: true` keeps the selection column mounted, so the assertion below
          // proves read-field filtering leaves it alone rather than that it never existed.
          viewer: { posts: { read: () => ({ "*": true, status: false }), delete: true } },
          plain: { posts: { read: true } },
          perDoc: {
            posts: {
              read: ({ data }) => {
                // The suite runs against the unaugmented registry, so `data`
                // arrives as `unknown` rather than the fixture's document.
                const doc = data as { title?: string } | undefined;
                return { "*": true, status: doc?.title === "First" };
              },
            },
          },
        },
      });
      // CollectionListView resolves its collection from `useVexConfig()` by slug — the
      // context config must carry the extended `postsWithTitle` fixture, or the view
      // resolves `testClientConfig`'s plain two-field `testCollection` instead.
      const config = { ...testClientConfig, collections: [postsWithTitle] };

      const denied = renderView(
        createElement(CollectionListView, {
          collection: postsWithTitle.slug,
        }),
        { convex: t, config, access: fieldMapAccess, auth: { user: asUser("viewer") } },
      );
      await denied.findAllByRole("row");
      expect(columnHeaderTexts(denied.container)).toContain("title");
      expect(columnHeaderTexts(denied.container)).not.toContain("status");
      // The select column has no field key and must never be filtered out.
      expect(denied.container.querySelector('thead [data-slot="checkbox"]')).not.toBeNull();
      denied.unmount();

      const undeclaredMap = renderView(
        createElement(CollectionListView, {
          collection: postsWithTitle.slug,
        }),
        { convex: t, config, access: fieldMapAccess, auth: { user: asUser("plain") } },
      );
      await undeclaredMap.findAllByRole("row");
      expect(columnHeaderTexts(undeclaredMap.container)).toEqual(
        expect.arrayContaining(["title", "status"]),
      );
      undeclaredMap.unmount();

      const perDoc = renderView(
        createElement(CollectionListView, {
          collection: postsWithTitle.slug,
        }),
        { convex: t, config, access: fieldMapAccess, auth: { user: asUser("perDoc") } },
      );
      await perDoc.findAllByRole("row");
      expect(columnHeaderTexts(perDoc.container)).toContain("status");
    });

    it("hides the Status column when vex_status is unreadable, shows it when readable (access-system-fields.md decision 2a)", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        versions: { ...testCollection.versions, drafts: true },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const id = await ctx.db.insert("documents", { title: "Launch post", vex_status: "published" });
        const doc = await ctx.db.get(id);
        return doc ? [doc] : [];
      });
      const seedQueryData = [seedFindPaginatedQueryData({ collection: versionedCollection, page: toPage(seeded) })];
      const statusDeniedAccess = defineAccess({
        roles: ["viewer"] as const,
        resources: [versionedCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          viewer: { posts: { read: () => ({ "*": true, [VERSION_SYSTEM_FIELDS.status.slug]: false }) } },
        },
      });
      const denied = renderView(
        createElement(CollectionListView, { collection: versionedCollection.slug }),
        { convex: t2, config, access: statusDeniedAccess, auth: { user: asUser("viewer") }, seedQueryData },
      );
      await denied.findAllByRole("row");
      expect(columnHeaderTexts(denied.container)).not.toContain("Status");
      fireEvent.click(denied.getByRole("button", { name: /columns/i }));
      const deniedDialog = await denied.findByRole("dialog");
      expect(within(deniedDialog).queryByText("Status")).toBeNull();
      denied.unmount();

      const statusAllowedAccess = defineAccess({
        roles: ["viewer"] as const,
        resources: [versionedCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          viewer: { posts: { read: () => ({ "*": true }) } },
        },
      });
      const allowed = renderView(
        createElement(CollectionListView, { collection: versionedCollection.slug }),
        { convex: t2, config, access: statusAllowedAccess, auth: { user: asUser("viewer") }, seedQueryData },
      );
      await allowed.findAllByRole("row");
      expect(columnHeaderTexts(allowed.container)).toContain("Status");
      allowed.unmount();
    });

    it("hides a ui() field's column when its field-permission map denies it (access-system-fields.md decision 2a)", async () => {
      const postsWithWordCount = {
        ...testCollection,
        fields: {
          ...testCollection.fields,
          wordCount: ui({
            label: "Word Count",
            admin: { components: { Field: () => null, Cell: () => null } },
          }),
        },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [postsWithWordCount] };
      const wordCountDeniedAccess = defineAccess({
        roles: ["viewer"] as const,
        resources: [postsWithWordCount],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          viewer: { posts: { read: () => ({ "*": true, wordCount: false }) } },
        },
      });
      const denied = renderView(
        createElement(CollectionListView, { collection: postsWithWordCount.slug }),
        { convex: t, config, access: wordCountDeniedAccess, auth: { user: asUser("viewer") } },
      );
      await denied.findAllByRole("row");
      expect(columnHeaderTexts(denied.container)).not.toContain("Word Count");
      fireEvent.click(denied.getByRole("button", { name: /columns/i }));
      const deniedDialog = await denied.findByRole("dialog");
      expect(within(deniedDialog).queryByText("Word Count")).toBeNull();
      denied.unmount();

      const wordCountAllowedAccess = defineAccess({
        roles: ["viewer"] as const,
        resources: [postsWithWordCount],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          viewer: { posts: { read: () => ({ "*": true }) } },
        },
      });
      const allowed = renderView(
        createElement(CollectionListView, { collection: postsWithWordCount.slug }),
        { convex: t, config, access: wordCountAllowedAccess, auth: { user: asUser("viewer") } },
      );
      await allowed.findAllByRole("row");
      expect(columnHeaderTexts(allowed.container)).toContain("Word Count");
      allowed.unmount();
    });

    it("shows the New button for a role whose create check returns a field map", async () => {
      // `create` is a quantified check here (no `data`) — under the default
      // `scope: "all"` a map would deny it outright and hide the button even
      // though creating is permitted; `scope: "any"` is what CollectionListView
      // now passes.
      const createMapAccess = defineAccess({
        roles: ["mapCreator"] as const,
        resources: [testCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          mapCreator: { posts: { create: () => ({ "*": false, status: true }) } },
        },
      });
      const utils = renderView(
        createElement(CollectionListView, {
          collection: testCollection.slug,
        }),
        { convex: t, access: createMapAccess, auth: { user: asUser("mapCreator") } },
      );
      await utils.findAllByRole("row");
      const newLink = utils.container.querySelector('a[href="/admin/collections/posts?createNew=true"]');
      expect(newLink).not.toHaveAttribute("aria-disabled");
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(CollectionListView, {
            collection: testCollection.slug,
          }),
          { convex: t },
        ),
      assert: async (utils, scenario) => {
        const expected = MATRIX_POSTS[scenario.name as keyof RbacMatrix];
        await utils.findAllByRole("row");
        const newLink = utils.container.querySelector('a[href="/admin/collections/posts?createNew=true"]');
        expect(newLink).not.toBeNull();
        if (expected) {
          expect(newLink).not.toHaveAttribute("aria-disabled");
        } else {
          expect(newLink).toHaveAttribute("aria-disabled", "true");
        }
        const revalidateButton = utils.getByRole("button", { name: "Revalidate all" });
        if (expected) {
          expect(revalidateButton).not.toBeDisabled();
        } else {
          expect(revalidateButton).toBeDisabled();
        }
      },
    });

    it("collapses a published/draft pair into one row — Published status plus an 'Unpublished changes' indicator", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        // Spread the resolved `versions` (autosave, cascadeDelete defaults) and
        // override only `drafts` — a resolved config never lacks the rest.
        versions: { ...testCollection.versions, drafts: true },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const publishedId = await ctx.db.insert("documents", {
          title: "Launch post",
          vex_status: "published",
        });
        const draftId = await ctx.db.insert("documents", {
          title: "Launch post (edited)",
          vex_status: "draft",
          vex_publishedId: publishedId,
        });
        // Draft-pair pagination fix: `find` merges a linked draft onto its published row
        // server-side (`mergeDraftCounterparts`, `@vexcms/core`) — the fake `"vex:find"`
        // handler (`testing/convex/bridge.ts`) doesn't run that merge (its own `config` has
        // no `versions` info for `mergeDraftCounterparts`'s gate to pass), so this seeds the
        // ALREADY-merged shape directly into the query cache (`seedFindPaginatedQueryData`,
        // polish fixes Decision 11 — replacing the removed `CollectionListViewProps
        // .initialData`), matching what a real SSR prefetch returns, rather than the two raw
        // rows `CollectionListView` used to collapse itself.
        const draftRow = await ctx.db.get(draftId);
        if (draftRow === null) throw new Error("draft row missing");
        return [{ ...draftRow, hasUnpublishedChanges: true } as unknown as TestDoc<"documents">];
      });

      const utils = renderView(
        createElement(CollectionListView, {
          collection: versionedCollection.slug,
        }),
        {
          convex: t2,
          config,
          seedQueryData: [seedFindPaginatedQueryData({ collection: versionedCollection, page: toPage(seeded) })],
        },
      );

      await waitFor(() => expect(utils.getAllByRole("row")).toHaveLength(2)); // header + 1 collapsed row
      expect(utils.getByText("Published")).toBeInTheDocument();
      expect(utils.getByText("Unpublished changes")).toBeInTheDocument();
      expect(utils.getByText("Launch post (edited)")).toBeInTheDocument();
    });

    it("keeps a standalone published document showing Published status without the indicator", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        // Spread the resolved `versions` (autosave, cascadeDelete defaults) and
        // override only `drafts` — a resolved config never lacks the rest.
        versions: { ...testCollection.versions, drafts: true },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const id = await ctx.db.insert("documents", { title: "Solo post", vex_status: "published" });
        const solo = await ctx.db.get(id);
        return solo ? [solo] : [];
      });

      const utils = renderView(
        createElement(CollectionListView, {
          collection: versionedCollection.slug,
        }),
        {
          convex: t2,
          config,
          seedQueryData: [seedFindPaginatedQueryData({ collection: versionedCollection, page: toPage(seeded) })],
        },
      );

      await waitFor(() => expect(utils.getAllByRole("row")).toHaveLength(2)); // header + 1 row
      expect(utils.getByText("Published")).toBeInTheDocument();
      expect(utils.queryByText("Unpublished changes")).toBeNull();
    });

    it("renders a never-published draft-only row as its own single row showing Draft status", async () => {
      const t2 = convexTest(schema, testModules);
      const versionedCollection = {
        ...testCollection,
        // Spread the resolved `versions` (autosave, cascadeDelete defaults) and
        // override only `drafts` — a resolved config never lacks the rest.
        versions: { ...testCollection.versions, drafts: true },
      } as unknown as typeof testCollection;
      const config = { ...testClientConfig, collections: [versionedCollection] };
      const seeded = await t2.run(async (ctx) => {
        const id = await ctx.db.insert("documents", {
          title: "Never published",
          vex_status: "draft",
          // No vex_publishedId — this row is not anyone's counterpart, so it
          // is never suppressed by the collapsing helper's grouping key.
        });
        const draftOnly = await ctx.db.get(id);
        return draftOnly ? [draftOnly] : [];
      });

      const utils = renderView(
        createElement(CollectionListView, {
          collection: versionedCollection.slug,
        }),
        {
          convex: t2,
          config,
          seedQueryData: [seedFindPaginatedQueryData({ collection: versionedCollection, page: toPage(seeded) })],
        },
      );

      await waitFor(() => expect(utils.getAllByRole("row")).toHaveLength(2)); // header + exactly 1 row
      expect(utils.getByText("Draft")).toBeInTheDocument();
      expect(utils.queryByText("Unpublished changes")).toBeNull();
      expect(utils.getByText("Never published")).toBeInTheDocument();
    });
  });
}

/**
 * Full-mount `CollectionEditView`. `canEdit` gates the field input's `disabled` state
 * directly (`readOnly={!canEdit || field.admin.readOnly}` — text/Cell's own `disabled` prop);
 * it does NOT independently gate Save/Cancel, whose `disabled={!canEdit || isDefaultValue}`
 * is dominated by `isDefaultValue`, which is always `true` on first mount (the form has not
 * yet diverged from its own loaded defaults) regardless of `canEdit` — asserted explicitly
 * below rather than silently assumed.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeCollectionEditView(options: { access?: VexAccessConfig }): void {
  describe("CollectionEditView", () => {
    const t = convexTest(schema, testModules);
    let doc: TestDoc<"documents">;

    beforeAll(async () => {
      [doc] = await seedDocuments(t, ["Existing Post"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(CollectionEditView, {
            collection: testCollection.slug,
            documentId: doc._id,
            initialData: doc,
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("shows the not-found message when the document does not resolve", () => {
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection.slug,
          documentId: doc._id,
          initialData: null,
        }),
        { convex: t },
      );
      expect(utils.getByText("Document not found.")).toBeInTheDocument();
    });

    it("renders an optional field that is entirely absent from the seeded document", () => {
      // `status` is `text({ index: "by_status" })` — `required: false` (text/config.ts:58) —
      // and `seedDocuments` only ever inserts `title` (the convex-test schema's one real
      // column), so `doc.status` is `undefined`, a genuinely MISSING key, not an empty
      // string. Proves the form mounts on the field's own default value instead of crashing
      // on the missing key.
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection.slug,
          documentId: doc._id,
          initialData: doc,
        }),
        { convex: t },
      );
      const statusInput = utils.container.querySelector("#status") as HTMLInputElement;
      expect(statusInput).not.toBeNull();
      expect(statusInput.value).toBe("");
    });

    /**
     * Read-gating: `useVisibleFields` hides a read-denied field's input entirely
     * (not merely disables it, which is `update`'s own job below) — mirrors
     * `describeCollectionListView`'s own field-map tests.
     */
    it("hides a read-denied field's input while keeping the allowed one visible", async () => {
      const id = await t.run((ctx) =>
        ctx.db.insert("documents", { status: "sentinel-denied", title: "visible" }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { posts: { read: () => ({ "*": false, title: true }) } },
        },
      });
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection.slug,
          documentId: id,
          initialData: stored,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("gated") } },
      );
      expect(utils.container.querySelector("#status")).toBeNull();
      expect(utils.container.querySelector("#title")).not.toBeNull();
    });

    it("does not render a read-denied field's stored value anywhere in the form", async () => {
      // Hidden, not disabled: a disabled input would still carry the value in
      // its `value` attribute, so this proves the value is unreachable at all.
      const id = await t.run((ctx) =>
        ctx.db.insert("documents", { status: "sentinel-denied", title: "visible" }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { posts: { read: () => ({ "*": false, title: true }) } },
        },
      });
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection.slug,
          documentId: id,
          initialData: stored,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("gated") } },
      );
      expect(utils.container.innerHTML).not.toContain("sentinel-denied");
    });

    it("renders every field when no read map narrows them", async () => {
      const id = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "a" }));
      const stored = await t.run((ctx) => ctx.db.get(id));
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection.slug,
          documentId: id,
          initialData: stored,
        }),
        { convex: t },
      );
      expect(utils.container.querySelector("#status")).not.toBeNull();
      expect(utils.container.querySelector("#title")).not.toBeNull();
    });

    it("keeps a field visible but read-only when only update denies it", async () => {
      // Read and update are separate actions: `read: true` must not fall back
      // to update's own map, or this would wrongly hide `status` too.
      const id = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "a" }));
      const stored = await t.run((ctx) => ctx.db.get(id));
      const updateGatedAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { posts: { read: true, update: () => ({ "*": false, title: true }) } },
        },
      });
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection.slug,
          documentId: id,
          initialData: stored,
        }),
        { convex: t, access: updateGatedAccess, auth: { user: asUser("gated") } },
      );
      const statusInput = utils.container.querySelector("#status");
      const titleInput = utils.container.querySelector("#title");
      expect(statusInput).not.toBeNull();
      expect(titleInput).not.toBeNull();
      expect(statusInput).toBeDisabled();
      expect(titleInput).not.toBeDisabled();
    });

    it("still renders every field when the caller has no known role", async () => {
      const id = await t.run((ctx) =>
        ctx.db.insert("documents", { status: "sentinel-denied", title: "visible" }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testCollection],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { posts: { read: () => ({ "*": false, title: true }) } },
        },
      });
      const utils = renderView(
        createElement(CollectionEditView, {
          collection: testCollection.slug,
          documentId: id,
          initialData: stored,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("stranger") } },
      );
      expect(utils.container.querySelector("#status")).not.toBeNull();
      expect(utils.container.querySelector("#title")).not.toBeNull();
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(CollectionEditView, {
            collection: testCollection.slug,
            documentId: doc._id,
            initialData: doc,
          }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_POSTS[scenario.name as keyof RbacMatrix];
        const statusInput = utils.container.querySelector("#status");
        expect(statusInput).not.toBeNull();
        if (expected) {
          expect(statusInput).not.toBeDisabled();
        } else {
          expect(statusInput).toBeDisabled();
        }
        fireEvent.click(utils.getByRole("button", { name: "More actions" }));
        const revalidateItem = utils.getByRole("menuitem", { name: "Revalidate" });
        if (expected) {
          expect(revalidateItem).not.toHaveAttribute("aria-disabled", "true");
        } else {
          expect(revalidateItem).toHaveAttribute("aria-disabled", "true");
        }
        // isDefaultValue dominance (see doc comment above): Save/Cancel start disabled on
        // every scenario, including "allowed" — this is NOT canEdit's doing.
        expect(utils.getByRole("button", { name: "Save" })).toBeDisabled();
        expect(utils.getByRole("button", { name: "Cancel" })).toBeDisabled();
      },
    });
  });
}

/**
 * Full-mount `GlobalEditView`. `global` is always a resolved config object (never falsy in
 * practice), so its "not found" branch is unreachable from this suite — a global's OWN
 * document is optional-by-design (a global can be edited before it is ever saved), which is
 * exactly the state exercised here: no seeded convex-test data, no `initialData`.
 * `vexConvexApi.globals.get` resolves to function name `"vex/globals:get"`, which has no
 * `QUERY_HANDLERS` entry — the live background query errors harmlessly (TanStack Query
 * stores it as `isError`, it never throws into render), which is why no data ever needing
 * that handler is asserted here. `canEdit` checks the "settings" global, an UNDECLARED
 * resource in `testAccess` — see `MATRIX_UNDECLARED`'s derivation comment.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeGlobalEditView(options: { access?: VexAccessConfig }): void {
  describe("GlobalEditView", () => {
    const t = convexTest(schema, testModules);

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(GlobalEditView, { global: testClientConfig.globals[0].slug }),
          {
            convex: t,
            access: options.access,
            auth: { user: null },
          },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders the default field values when no document has ever been saved", async () => {
      const utils = renderView(
        createElement(GlobalEditView, { global: testClientConfig.globals[0].slug }),
        { convex: t },
      );
      // `GlobalEditView`'s document fetch now suspends (shell-streaming follow-up, Part 3) —
      // the heading/form only exist once the query settles, even for "no document yet".
      await waitFor(() => expect(utils.getByRole("heading", { level: 1 })).toBeInTheDocument());
      const heading = utils.getByRole("heading", { level: 1 });
      expect(heading.textContent).toBe("Edit Global - Settings");
      expect(utils.container.querySelector("#siteName")).not.toBeNull();
    });

    /**
     * Read-gating: mirrors `describeCollectionEditView`'s own block above.
     * Driven through `initialData` — see this suite's doc comment for why.
     */
    it("hides a read-denied field's input while keeping the allowed one visible", () => {
      const stored = {
        _creationTime: 1,
        _id: "g1",
        siteName: "sentinel-denied",
        tagline: "visible",
      };
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.globals[0] as never],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { settings: { read: () => ({ "*": false, tagline: true }) } },
        } as never,
      });
      const utils = renderView(
        createElement(GlobalEditView, {
          global: testClientConfig.globals[0].slug,
          initialData: stored as never,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("gated") } },
      );
      expect(utils.container.querySelector("#siteName")).toBeNull();
      expect(utils.container.querySelector("#tagline")).not.toBeNull();
    });

    it("does not render a read-denied field's stored value anywhere in the form", () => {
      const stored = {
        _creationTime: 1,
        _id: "g1",
        siteName: "sentinel-denied",
        tagline: "visible",
      };
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.globals[0] as never],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { settings: { read: () => ({ "*": false, tagline: true }) } },
        } as never,
      });
      const utils = renderView(
        createElement(GlobalEditView, {
          global: testClientConfig.globals[0].slug,
          initialData: stored as never,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("gated") } },
      );
      expect(utils.container.innerHTML).not.toContain("sentinel-denied");
    });

    it("renders every field when no read map narrows them", () => {
      const stored = { _creationTime: 1, _id: "g1", siteName: "a", tagline: "b" };
      const utils = renderView(
        createElement(GlobalEditView, {
          global: testClientConfig.globals[0].slug,
          initialData: stored as never,
        }),
        { convex: t },
      );
      expect(utils.container.querySelector("#siteName")).not.toBeNull();
      expect(utils.container.querySelector("#tagline")).not.toBeNull();
    });

    it("keeps a field visible but read-only when only update denies it", () => {
      const stored = { _creationTime: 1, _id: "g1", siteName: "a", tagline: "b" };
      const updateGatedAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.globals[0] as never],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { settings: { read: true, update: () => ({ "*": false, tagline: true }) } },
        } as never,
      });
      const utils = renderView(
        createElement(GlobalEditView, {
          global: testClientConfig.globals[0].slug,
          initialData: stored as never,
        }),
        { convex: t, access: updateGatedAccess, auth: { user: asUser("gated") } },
      );
      const siteNameInput = utils.container.querySelector("#siteName");
      const taglineInput = utils.container.querySelector("#tagline");
      expect(siteNameInput).not.toBeNull();
      expect(taglineInput).not.toBeNull();
      expect(siteNameInput).toBeDisabled();
      expect(taglineInput).not.toBeDisabled();
    });

    it("still renders every field when the caller has no known role", () => {
      const stored = {
        _creationTime: 1,
        _id: "g1",
        siteName: "sentinel-denied",
        tagline: "visible",
      };
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.globals[0] as never],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { settings: { read: () => ({ "*": false, tagline: true }) } },
        } as never,
      });
      const utils = renderView(
        createElement(GlobalEditView, {
          global: testClientConfig.globals[0].slug,
          initialData: stored as never,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("stranger") } },
      );
      expect(utils.container.querySelector("#siteName")).not.toBeNull();
      expect(utils.container.querySelector("#tagline")).not.toBeNull();
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(GlobalEditView, { global: testClientConfig.globals[0].slug }),
          { convex: t },
        ),
      assert: async (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
        // `GlobalEditView`'s document fetch now suspends (shell-streaming follow-up, Part 3) —
        // no `initialData` here (this scenario is specifically "no document saved yet"), so
        // the form only exists once the query settles.
        await waitFor(() => expect(utils.container.querySelector("#siteName")).not.toBeNull());
        const siteNameInput = utils.container.querySelector("#siteName");
        expect(siteNameInput).not.toBeNull();
        if (expected) {
          expect(siteNameInput).not.toBeDisabled();
        } else {
          expect(siteNameInput).toBeDisabled();
        }
        // isDefaultValue dominance, same as CollectionEditView: Save/Cancel start disabled
        // regardless of canEdit.
        expect(utils.getByRole("button", { name: "Save" })).toBeDisabled();
        expect(utils.getByRole("button", { name: "Cancel" })).toBeDisabled();
      },
    });
  });
}

/**
 * `GlobalsListView` now filters via `hasPermission` DIRECTLY (`read`, `scope: "any"`) —
 * developer-reported: it used to render every configured global unconditionally, relying
 * entirely on the sidebar/dashboard never linking to one the caller couldn't read, which
 * is not a real boundary since `/admin/globals` is reachable directly by URL. Same
 * `MATRIX_UNDECLARED` fixture `DashboardView`'s own Globals section already uses — the
 * fixture's sole configured global resolves to the undeclared `"settings"` resource.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeGlobalsListView(options: { access?: VexAccessConfig }): void {
  describe("GlobalsListView", () => {
    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderWithVexProviders(createElement(GlobalsListView, {}), {
          access: options.access,
          auth: { user: null },
        });
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      config: testClientConfig,
      render: () => createElement(GlobalsListView, {}),
      assert: (utils, scenario) => {
        const name = scenario.name as keyof RbacMatrix;
        const link = utils.container.querySelector('a[href="/admin/globals/settings"]');
        if (MATRIX_UNDECLARED[name]) {
          expect(utils.getByText("Settings")).toBeVisible();
          expect(utils.getByText("Edit Global")).toBeVisible();
          expect(link).not.toBeNull();
        } else {
          expect(utils.queryByText("Settings")).toBeNull();
          expect(link).toBeNull();
          expect(utils.getByText("No globals available")).toBeVisible();
        }
      },
    });
  });
}

/**
 * `DashboardView` filters each section via `hasPermission` DIRECTLY (not `usePermission`),
 * reading `useVexAccess`/`useVexAuth` from context — the same providers
 * `renderWithVexProviders` supplies, so the real resolution path is exercised. The
 * "collections" filter is `read`+`scope:"any"` on "posts" (`MATRIX_POSTS_READ_ANY`); the
 * "media"/"globals" filters use the same shape against the undeclared "images"/"settings"
 * resources (`MATRIX_UNDECLARED`). Each section's heading and its cards live inside the SAME
 * `<Activity mode="hidden">`, which sets `style="display:none"` directly on that child
 * (verified empirically) rather than removing it from the DOM — so the heading is always
 * present and `toBeVisible()`/`not.toBeVisible()` is the correct assertion, not
 * `queryByText`.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeDashboardView(options: { access?: VexAccessConfig }): void {
  describe("DashboardView", () => {
    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderWithVexProviders(createElement(DashboardView, {}), {
          access: options.access,
          auth: { user: null },
        });
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      config: testClientConfig,
      render: () => createElement(DashboardView, {}),
      assert: (utils, scenario) => {
        const name = scenario.name as keyof RbacMatrix;
        // `getByText`, not `getByRole`: the heading is always present in the DOM — only its
        // ancestor `Activity`'s `display:none` toggles — but a hidden element's ACCESSIBLE
        // NAME computes to "" (verified empirically), so `getByRole("heading", { name, hidden:
        // true })` still fails to match even with `hidden: true` bypassing the role-inclusion
        // filter. Plain text content is unaffected by that computation.
        const collectionsHeading = utils.getByText("Collections");
        const mediaHeading = utils.getByText("Media");
        const globalsHeading = utils.getByText("Globals");
        if (MATRIX_POSTS_READ_ANY[name]) {
          expect(collectionsHeading).toBeVisible();
        } else {
          expect(collectionsHeading).not.toBeVisible();
        }
        if (MATRIX_UNDECLARED[name]) {
          expect(mediaHeading).toBeVisible();
          expect(globalsHeading).toBeVisible();
        } else {
          expect(mediaHeading).not.toBeVisible();
          expect(globalsHeading).not.toBeVisible();
        }
      },
    });
  });
}

/**
 * `CollectionsIndexView` (`/admin/collections`, no slug) mirrors `DashboardView`'s own
 * Collections/Media sections exactly (same `AdminCardSection`, same `hasPermission`
 * filters) but renders no Globals section at all. Its own `<h1>Collections</h1>` title
 * collides, as plain text, with `AdminCardSection`'s own `<h2>Collections</h2>` section
 * heading — unlike `DashboardView` (whose `<h1>` says "Dashboard", never colliding with
 * its own section headings) — so assertions target the `<h2>` tag directly via
 * `querySelector`, not `getByText`, to disambiguate.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeCollectionsIndexView(options: { access?: VexAccessConfig }): void {
  describe("CollectionsIndexView", () => {
    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderWithVexProviders(
          createElement(CollectionsIndexView, {}),
          { access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      config: testClientConfig,
      render: () => createElement(CollectionsIndexView, {}),
      assert: (utils, scenario) => {
        const name = scenario.name as keyof RbacMatrix;
        const headings = Array.from(utils.container.querySelectorAll("h2"));
        const collectionsHeading = headings.find((h) => h.textContent === "Collections");
        const mediaHeading = headings.find((h) => h.textContent === "Media");
        if (!MATRIX_POSTS_READ_ANY[name] && !MATRIX_UNDECLARED[name]) {
          // Nothing readable at all — the empty state replaces both sections outright,
          // not merely hiding them via Activity (there is nothing left to toggle).
          expect(collectionsHeading).toBeUndefined();
          expect(mediaHeading).toBeUndefined();
          expect(utils.getByText("No collections available")).toBeVisible();
          return;
        }
        expect(collectionsHeading).toBeDefined();
        expect(mediaHeading).toBeDefined();
        if (MATRIX_POSTS_READ_ANY[name]) {
          expect(collectionsHeading).toBeVisible();
        } else {
          expect(collectionsHeading).not.toBeVisible();
        }
        if (MATRIX_UNDECLARED[name]) {
          expect(mediaHeading).toBeVisible();
        } else {
          expect(mediaHeading).not.toBeVisible();
        }
        // No Globals section at all — unlike DashboardView, not even a hidden one.
        expect(headings.find((h) => h.textContent === "Globals")).toBeUndefined();
      },
    });

    // Developer-reported: must match the sidebar's own Collections group EXACTLY (same
    // filter, same order, including whatever "hidden"/auth-table resources the real
    // `config.collections` array carries — both components iterate that SAME array with
    // an identical `hasPermission` filter, so set/order parity is a structural guarantee,
    // not independently re-derived logic that could silently drift apart). `testAccess.none`
    // (RBAC entirely off) is the one default scenario where BOTH collections and the media
    // collection resolve visible (`MATRIX_POSTS_READ_ANY.none`/`MATRIX_UNDECLARED.none`
    // are both `true`), so this is the scenario that actually exercises every category.
    it("shows the EXACT SAME set of collection/media links, same order, as AppSidebar's Collections/Media groups", () => {
      const sidebarUtils = renderWithVexProviders(
        createElement(
          ThemeProvider,
          null,
          createElement(SidebarProvider, null, createElement(AppSidebar, {})),
        ),
        { config: testClientConfig, access: testAccess.none, auth: { user: null } },
      );
      const sidebarHrefs = Array.from(
        sidebarUtils.container.querySelectorAll('a[href^="/admin/collections/"]'),
      ).map((a) => a.getAttribute("href"));
      sidebarUtils.unmount();

      const indexUtils = renderWithVexProviders(createElement(CollectionsIndexView, {}), {
        config: testClientConfig,
        access: testAccess.none,
        auth: { user: null },
      });
      const indexHrefs = Array.from(
        indexUtils.container.querySelectorAll('a[href^="/admin/collections/"]'),
      ).map((a) => a.getAttribute("href"));
      indexUtils.unmount();

      expect(indexHrefs.length).toBeGreaterThan(0);
      expect(indexHrefs).toEqual(sidebarHrefs);
    });
  });
}

/**
 * `UnauthorizedView` reads no context and calls no permission hook — it is the destination a
 * failed `usePermission`/access check redirects to, not a component that performs one. A
 * plain render covers the default copy, the override props, and the optional action slot.
 *
 * @param _options - Unused; this view has no RBAC surface to downgrade.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeUnauthorizedView(_options: { access?: VexAccessConfig }): void {
  describe("UnauthorizedView", () => {
    it("renders the default title and description with no children", () => {
      const utils = renderWithVexProviders(createElement(UnauthorizedView, null));
      expect(utils.getByText("Access denied")).toBeInTheDocument();
      expect(
        utils.getByText("You do not have permission to access the admin panel."),
      ).toBeInTheDocument();
    });

    it("renders overridden title/description and an action slot", () => {
      const utils = renderWithVexProviders(
        createElement(
          UnauthorizedView,
          { title: "Nope", description: "Ask an admin." },
          createElement("a", { href: "/" }, "Return to site"),
        ),
      );
      expect(utils.getByText("Nope")).toBeInTheDocument();
      expect(utils.getByText("Ask an admin.")).toBeInTheDocument();
      expect(utils.getByText("Return to site")).toBeInTheDocument();
    });
  });
}

/**
 * Full-mount `MediaCollectionListView` against `testClientConfig`'s `images` media
 * collection. Seeded rows carry no `src`, so the preview column takes the "no src" fallback
 * branch (a 📄 placeholder tile) rather than mounting `FilePreview` — `FilePreview` itself
 * requires a real `mimeType`, which this suite's convex-test schema (one `documents` table,
 * `title` only) does not carry.
 *
 * Unlike `CollectionListView`'s "+ New" button (`disabled={!canCreate}`), the "+ Upload"
 * button here carries no `disabled` prop at all — this component never calls `usePermission`
 * for the create action (RBAC-2 in BUGS-REPORT.md). The RBAC suite below asserts the
 * INTENDED contract — Upload gated on create permission, the same as `CollectionListView`'s
 * New button — and fails on every scenario where that gate is missing; see the `assert`
 * callback. `canDelete` has the same dead-code gap as `CollectionListView`'s own (`DataTable`'s
 * bulk-delete bar is commented out); see the dedicated "no reachable destructive control"
 * test below rather than a fabricated `canDelete`-gated assertion here.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeMediaCollectionListView(options: { access?: VexAccessConfig }): void {
  describe("MediaCollectionListView", () => {
    const t = convexTest(schema, testModules);
    let docs: TestDoc<"documents">[] = [];

    beforeAll(async () => {
      docs = await seedDocuments(t, ["photo-one", "photo-two"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(MediaCollectionListView, {
            collection: testClientConfig.mediaCollections[0].slug,
            initialData: toPage<VexMediaDocument>(docs),
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders rows from seeded data", () => {
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0].slug,
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t },
      );
      expect(utils.getByText("2 items")).toBeInTheDocument();
      expect(utils.getAllByRole("row")).toHaveLength(3); // 1 header row + 2 data rows
    });

    it("renders the empty state with zero items", () => {
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0].slug,
          initialData: toPage<VexMediaDocument>([]),
        }),
        { convex: t },
      );
      expect(utils.getByText(/No images yet/)).toBeInTheDocument();
      expect(utils.getByText("Upload one.")).toBeInTheDocument();
      expect(utils.queryAllByRole("row")).toHaveLength(0);
    });

    it("shows no selection checkboxes for a role without delete permission", () => {
      const noDeleteAccess = defineAccess({
        roles: ["reader"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          reader: { images: { read: true, delete: false } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0].slug,
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t, access: noDeleteAccess, auth: { user: asUser("reader") } },
      );
      expect(utils.container.querySelector('thead [data-slot="checkbox"]')).toBeNull();
      expect(utils.queryByRole("button", { name: /delete/i })).toBeNull();
    });

    it("shows selection checkboxes for a role with delete permission", () => {
      const deleterAccess = defineAccess({
        roles: ["deleter"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          deleter: { images: { read: true, delete: true } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0].slug,
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t, access: deleterAccess, auth: { user: asUser("deleter") } },
      );
      expect(utils.container.querySelector('thead [data-slot="checkbox"]')).not.toBeNull();
    });

    it("filters columns by the caller's read field permissions", () => {
      const fieldMapAccess = defineAccess({
        roles: ["viewer"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          // `delete: true` keeps the selection column mounted — see the posts twin above.
          viewer: { images: { read: () => ({ "*": true, alt: false }), delete: true } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0].slug,
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("viewer") } },
      );
      expect(columnHeaderTexts(utils.container)).not.toContain("alt");
      // The preview column (no field key) and the select column stay.
      expect(utils.container.querySelector('thead [data-slot="checkbox"]')).not.toBeNull();
    });

    it("shows the Upload button for a role whose create check returns a field map", () => {
      const createMapAccess = defineAccess({
        roles: ["mapCreator"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          mapCreator: { images: { create: () => ({ "*": false, alt: true }) } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0].slug,
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t, access: createMapAccess, auth: { user: asUser("mapCreator") } },
      );
      const uploadLink = utils.container.querySelector('a[href="/admin/collections/images?upload=true"]');
      expect(uploadLink).not.toHaveAttribute("aria-disabled");
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(MediaCollectionListView, {
            collection: testClientConfig.mediaCollections[0].slug,
            initialData: toPage<VexMediaDocument>(docs),
          }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
        expect(utils.getByText("2 items")).toBeInTheDocument();
        const uploadLink = utils.container.querySelector('a[href="/admin/collections/images?upload=true"]');
        expect(uploadLink).not.toBeNull();
        if (expected) {
          expect(uploadLink).not.toHaveAttribute("aria-disabled");
        } else {
          // Regression guard (RBAC-2): MediaCollectionListView resolves
          // create-action usePermission and wires it to Upload button's
          // disabled prop, matching CollectionListView's "+ New".
          expect(uploadLink).toHaveAttribute("aria-disabled", "true");
        }
      },
    });
  });
}

/**
 * Full-mount `MediaCollectionEditView` against the `images` media collection. `canEdit`
 * gates the `alt` field's `disabled` state (same mechanism as `CollectionEditView`), but —
 * UNLIKE `CollectionEditView`/`GlobalEditView` — Save/Cancel's `disabled={isDefaultValue}`
 * (MediaCollectionEditView.tsx:139,147) never references `canEdit`, unlike its siblings'
 * `disabled={!canEdit || isDefaultValue}` (RBAC-1 in BUGS-REPORT.md). The RBAC suite below
 * asserts the INTENDED contract — Save/Cancel gate on `canEdit`, matching the sibling views
 * — and fails where it doesn't hold. On first mount `isDefaultValue` is always `true`
 * regardless of `canEdit`, which would make any assertion here pass vacuously, so the
 * `assert` callback forces the form dirty first via `fireEvent.change` directly on the
 * `#alt` DOM node — verified to fire even through a `disabled` attribute, the same bypass an
 * attacker's devtools console or a scripted client has available, exactly why a client-only
 * `disabled` is not a security boundary. **Not currently exploitable through the rendered
 * UI**: the `alt` field itself is `readOnly`/`disabled` whenever `canEdit` is false
 * (`readOnly={field.admin.readOnly || !canEdit}`, line 172), so a real user cannot diverge
 * the form through normal interaction — this is a defense-in-depth gap, not a live
 * privilege-escalation path; server-side enforcement is the actual gate.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeMediaCollectionEditView(options: { access?: VexAccessConfig }): void {
  describe("MediaCollectionEditView", () => {
    const t = convexTest(schema, testModules);
    let doc: TestDoc<"documents">;

    beforeAll(async () => {
      [doc] = await seedDocuments(t, ["existing-photo"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(MediaCollectionEditView, {
            collection: testClientConfig.mediaCollections[0].slug,
            documentId: doc._id,
            // convex-test's seeded doc has no VexMediaDocument fields (mimeType/src/filename);
            // the view only reads `_id` (admin.useAsTitle) and `alt` (its one field) from it.
            initialData: doc as unknown as VexMediaDocument,
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    /** Read-gating: mirrors `describeCollectionEditView`'s own block above. */
    it("hides a read-denied field's input while keeping the allowed one visible", async () => {
      const id = await t.run((ctx) =>
        ctx.db.insert("media", {
          adapter: "convex",
          alt: "sentinel-denied",
          collectionSlug: "images",
          deleted: false,
          filename: "visible.png",
          mimeType: "image/png",
          size: 100,
          storageId: "s1",
        }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { images: { read: () => ({ "*": false, filename: true }) } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionEditView, {
          collection: testClientConfig.mediaCollections[0].slug,
          documentId: id,
          initialData: stored as unknown as VexMediaDocument,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("gated") } },
      );
      expect(utils.container.querySelector("#alt")).toBeNull();
      expect(utils.container.querySelector("#filename")).not.toBeNull();
    });

    it("does not render a read-denied field's stored value anywhere in the form", async () => {
      const id = await t.run((ctx) =>
        ctx.db.insert("media", {
          adapter: "convex",
          alt: "sentinel-denied",
          collectionSlug: "images",
          deleted: false,
          filename: "visible.png",
          mimeType: "image/png",
          size: 100,
          storageId: "s1",
        }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { images: { read: () => ({ "*": false, filename: true }) } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionEditView, {
          collection: testClientConfig.mediaCollections[0].slug,
          documentId: id,
          initialData: stored as unknown as VexMediaDocument,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("gated") } },
      );
      expect(utils.container.innerHTML).not.toContain("sentinel-denied");
    });

    it("renders every field when no read map narrows them", async () => {
      const id = await t.run((ctx) =>
        ctx.db.insert("media", {
          adapter: "convex",
          alt: "a",
          collectionSlug: "images",
          deleted: false,
          filename: "b.png",
          mimeType: "image/png",
          size: 100,
          storageId: "s1",
        }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const utils = renderView(
        createElement(MediaCollectionEditView, {
          collection: testClientConfig.mediaCollections[0].slug,
          documentId: id,
          initialData: stored as unknown as VexMediaDocument,
        }),
        { convex: t },
      );
      expect(utils.container.querySelector("#alt")).not.toBeNull();
      expect(utils.container.querySelector("#filename")).not.toBeNull();
    });

    it("keeps a field visible but read-only when only update denies it", async () => {
      const id = await t.run((ctx) =>
        ctx.db.insert("media", {
          adapter: "convex",
          alt: "a",
          collectionSlug: "images",
          deleted: false,
          filename: "b.png",
          mimeType: "image/png",
          size: 100,
          storageId: "s1",
        }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const updateGatedAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { images: { read: true, update: () => ({ "*": false, filename: true }) } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionEditView, {
          collection: testClientConfig.mediaCollections[0].slug,
          documentId: id,
          initialData: stored as unknown as VexMediaDocument,
        }),
        { convex: t, access: updateGatedAccess, auth: { user: asUser("gated") } },
      );
      const altInput = utils.container.querySelector("#alt");
      const filenameInput = utils.container.querySelector("#filename");
      expect(altInput).not.toBeNull();
      expect(filenameInput).not.toBeNull();
      expect(altInput).toBeDisabled();
      expect(filenameInput).not.toBeDisabled();
    });

    it("still renders every field when the caller has no known role", async () => {
      const id = await t.run((ctx) =>
        ctx.db.insert("media", {
          adapter: "convex",
          alt: "sentinel-denied",
          collectionSlug: "images",
          deleted: false,
          filename: "visible.png",
          mimeType: "image/png",
          size: 100,
          storageId: "s1",
        }),
      );
      const stored = await t.run((ctx) => ctx.db.get(id));
      const fieldMapAccess = defineAccess({
        roles: ["gated"] as const,
        resources: [testClientConfig.mediaCollections[0]],
        userCollectionSlug: "users",
        userRolesField: "roles",
        permissions: {
          gated: { images: { read: () => ({ "*": false, filename: true }) } },
        },
      });
      const utils = renderView(
        createElement(MediaCollectionEditView, {
          collection: testClientConfig.mediaCollections[0].slug,
          documentId: id,
          initialData: stored as unknown as VexMediaDocument,
        }),
        { convex: t, access: fieldMapAccess, auth: { user: asUser("stranger") } },
      );
      expect(utils.container.querySelector("#alt")).not.toBeNull();
      expect(utils.container.querySelector("#filename")).not.toBeNull();
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(MediaCollectionEditView, {
            collection: testClientConfig.mediaCollections[0].slug,
            documentId: doc._id,
            // convex-test's seeded doc has no VexMediaDocument fields (mimeType/src/filename); the view
            // only reads `_id` (admin.useAsTitle) and `alt` (its one field) from it.
            initialData: doc as unknown as VexMediaDocument,
          }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
        const altInput = utils.container.querySelector("#alt") as HTMLInputElement;
        expect(altInput).not.toBeNull();
        if (expected) {
          expect(altInput).not.toBeDisabled();
        } else {
          expect(altInput).toBeDisabled();
        }
        // Save/Cancel start disabled on every scenario regardless of canEdit (isDefaultValue
        // dominance, same quirk as CollectionEditView/GlobalEditView) — that alone can't
        // distinguish this view's gate from the sibling views' intended
        // `!canEdit || isDefaultValue` gate. Force the form dirty first (see doc comment
        // above for why `fireEvent.change` on a disabled input is the right tool here).
        fireEvent.change(altInput, { target: { value: "changed" } });
        const saveButton = utils.getByRole("button", { name: "Save" });
        const cancelButton = utils.getByRole("button", { name: "Cancel" });
        if (expected) {
          expect(saveButton).not.toBeDisabled();
          expect(cancelButton).not.toBeDisabled();
        } else {
          // Regression guard (RBAC-1): MediaCollectionEditView's
          // Save/Cancel read disabled={!canEdit || isDefaultValue},
          // matching CollectionEditView.
          expect(saveButton).toBeDisabled();
          expect(cancelButton).toBeDisabled();
        }
      },
    });
  });
}

/**
 * Standalone `AppSidebar` (not wrapped in `AdminLayout`, which provides its own
 * `VexAuthProvider` that would shadow `renderWithVexProviders`'s per-scenario `auth` — see
 * `AdminLayout`'s own doc comment below). Needs `ThemeProvider` (for `ThemeToggle`) and
 * `SidebarProvider` (documented on `AppSidebar` itself) but no Convex/QueryClient/nuqs — it
 * calls neither `useQuery` nor `useQueryState`. All three nav sections' `usePermission`
 * calls use `read`+`scope:"any"`: "posts" (`MATRIX_POSTS_READ_ANY`), "settings"/"images"
 * (`MATRIX_UNDECLARED` — undeclared resources, same derivation as `GlobalEditView`).
 *
 * @param options - Optional caller-supplied access config; see {@link ShellSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeAdminSidebar(options: { access?: VexAccessConfig }): void {
  describe("AdminSidebar", () => {
    function mount() {
      return createElement(
        ThemeProvider,
        null,
        createElement(SidebarProvider, null, createElement(AppSidebar, {})),
      );
    }

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderWithVexProviders(mount(), {
          access: options.access,
          auth: { user: null },
        });
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      config: testClientConfig,
      render: () => mount(),
      assert: (utils, scenario) => {
        const name = scenario.name as keyof RbacMatrix;
        const postsLink = utils.container.querySelector('a[href="/admin/collections/posts"]');
        const settingsLink = utils.container.querySelector('a[href="/admin/globals/settings"]');
        const imagesLink = utils.container.querySelector('a[href="/admin/collections/images"]');
        // Unlike `DashboardView`'s heading (always rendered, only its visibility toggles),
        // `AppSidebar` maps the FILTERED array directly — with exactly one collection/global/
        // media collection in `testClientConfig`, a denied permission means that array is
        // empty and the corresponding nav link does not exist in the DOM at all, not merely
        // hidden.
        if (MATRIX_POSTS_READ_ANY[name]) {
          expect(postsLink).not.toBeNull();
          expect(postsLink).toBeVisible();
        } else {
          expect(postsLink).toBeNull();
        }
        if (MATRIX_UNDECLARED[name]) {
          expect(settingsLink).not.toBeNull();
          expect(settingsLink).toBeVisible();
          expect(imagesLink).not.toBeNull();
          expect(imagesLink).toBeVisible();
        } else {
          expect(settingsLink).toBeNull();
          expect(imagesLink).toBeNull();
        }
        if (!MATRIX_POSTS_READ_ANY[name] && !MATRIX_UNDECLARED[name]) {
          // "anonymous"/"denied" deny every one of testClientConfig's three nav categories
          // simultaneously — the sidebar's own nav list renders with ZERO items rather than
          // crashing on an empty filtered array or leaving a stale/placeholder entry behind.
          expect(
            utils.container.querySelectorAll('[data-slot="sidebar-menu-button"]'),
          ).toHaveLength(0);
        }
      },
    });
  });
}

/**
 * Full `AdminLayout` shell: framework Link/Image injection and active-route highlighting.
 * `AdminLayout` calls no `usePermission`/`hasPermission` itself, but it renders `AppSidebar`
 * internally, whose nav entries ARE permission-filtered — so the active-route assertion below
 * (which asserts the "posts" sidebar entry exists AND is marked active) is only valid against
 * the DEFAULT `testAccess`-driven visibility, not an arbitrary caller-supplied config that may
 * deny "posts" outright. `AdminLayout` no longer wraps its children in its own
 * `VexConfigContext.Provider` — it reads `useVexConfig()` directly — so the outer
 * `VexConfigContext` value from `wrapWithViewProviders`/`renderView` flows through unshadowed.
 * The per-scenario `access`/`auth` assertions below continue to exercise the real resolution
 * path; `describeAdminSidebar` (above) remains the function documented as owning the
 * per-scenario RBAC-gating assertion. Same two-mode split as every other member: default
 * drives the real assertions below; a caller-supplied `access` downgrades to a non-crashing
 * mount.
 *
 * @param options - Optional caller-supplied access config; see {@link ShellSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeAdminLayout(options: { access?: VexAccessConfig }): void {
  describe("AdminLayout", () => {
    const t = convexTest(schema, testModules);

    function StubLink({ href, children, ...rest }: VexLinkProps) {
      return createElement("a", { "data-stub-link": "true", href, ...rest }, children);
    }
    function StubImage(props: { src: string; alt: string }) {
      return createElement("img", { "data-stub-image": "true", ...props });
    }
    function ImageProbe() {
      const { Image } = useFrameworkComponents();
      return createElement(
        "span",
        { "data-testid": "image-probe" },
        Image === StubImage ? "stub" : "native",
      );
    }

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(AdminLayout, {
            activeSlug: "posts",
            children: createElement("div", null, "content"),
          }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("injects the framework Link/Image overrides into the tree it wraps", () => {
      const utils = renderView(
        createElement(AdminLayout, {
          activeSlug: "posts",
          components: { Link: StubLink, Image: StubImage },
          children: createElement(ImageProbe),
        }),
        { convex: t },
      );
      const stubLinks = utils.container.querySelectorAll('[data-stub-link="true"]');
      expect(stubLinks.length).toBeGreaterThan(0);
      expect(utils.getByTestId("image-probe").textContent).toBe("stub");
    });

    it("marks the active collection's nav entry and leaves the others inactive", () => {
      const utils = renderView(
        createElement(AdminLayout, {
          activeSlug: "posts",
          children: createElement("div", null, "content"),
        }),
        { convex: t },
      );
      // Scoped to `[data-slot="sidebar-menu-button"]`: the sidebar renders its OWN
      // `<a href="/admin/collections/posts">` distinct from any other link an unrelated
      // part of the tree might render for the same href, so an unscoped href selector
      // would be ambiguous the moment that's ever true.
      const postsLink = utils.container.querySelector(
        'a[data-slot="sidebar-menu-button"][href="/admin/collections/posts"]',
      );
      const imagesLink = utils.container.querySelector(
        'a[data-slot="sidebar-menu-button"][href="/admin/collections/images"]',
      );
      expect(postsLink).toHaveAttribute("data-active");
      expect(imagesLink).not.toHaveAttribute("data-active");
    });
  });
}

/**
 * Standalone `AdminTopNav`: breadcrumb rendering, the "skip" sentinel on globals routes, and
 * framework Link injection. No RBAC surface of its own (no `usePermission`/`hasPermission`
 * call), so `options.access` is threaded through for a non-crashing smoke check only.
 *
 * @param options - Optional caller-supplied access config; see {@link ShellSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeAdminTopNav(options: { access?: VexAccessConfig }): void {
  describe("AdminTopNav", () => {
    const t = convexTest(schema, testModules);

    /**
     * `AdminTopNav` now renders its own `SidebarTrigger` directly (top-bar move — it used to
     * be a sibling in `AdminLayout`'s own `<header>`, which always sat inside a
     * `SidebarProvider`) — standalone tests of `AdminTopNav` alone need one too, or
     * `useSidebar()` throws ("must be used within a SidebarProvider").
     *
     * @param child - The element under test, wrapped so it can call `useSidebar()`.
     * @returns `child` wrapped in a `SidebarProvider`.
     */
    function withSidebarProvider(child: ReturnType<typeof createElement>) {
      return createElement(SidebarProvider, null, child);
    }

    it("renders the breadcrumb trail for an active collection route", () => {
      const utils = renderView(
        withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        { convex: t, access: options.access },
      );
      expect(utils.getByText("Home")).toBeInTheDocument();
      // `Postses` was `defineCollection`'s double-pluralized default label
      // (CORE-LABEL-1); the derived `labels.plural` for slug `posts` is now
      // the title-cased slug itself.
      expect(utils.getByText("Posts")).toBeInTheDocument();
      expect(utils.container.querySelector('a[href="/admin"]')).not.toBeNull();
      expect(utils.container.querySelector('a[href="/admin/collections/posts"]')).not.toBeNull();
    });

    it('resolves a globals route through the "skip" sentinel with no document fetch', () => {
      const utils = renderView(
        withSidebarProvider(
          createElement(AdminTopNav, { activeSlug: "globals", activeDocID: "settings" }),
        ),
        { convex: t, access: options.access },
      );
      expect(utils.getByText("Home")).toBeInTheDocument();
      expect(utils.getByText("Globals")).toBeInTheDocument();
      expect(utils.getByText("Settings")).toBeInTheDocument();
      expect(utils.container.querySelector('a[href="/admin/globals/settings"]')).not.toBeNull();
    });

    it("renders only the Home crumb for an unknown collection slug", () => {
      const utils = renderView(
        withSidebarProvider(createElement(AdminTopNav, { activeSlug: "does-not-exist" })),
        { convex: t, access: options.access },
      );
      // `activeCollection` resolves to `undefined` (not in `config.collections` or
      // `config.mediaCollections`) and `isGlobals` is false, so neither crumb-building
      // branch fires — the breadcrumb degrades to just "Home" rather than crashing or
      // showing a stale/wrong label. Scoped to the breadcrumb trail's own container — the
      // bar ALSO renders a "View site" link (absorbed from `AdminLayout.tsx`, top-bar
      // move), an unrelated piece of UI chrome, not part of the breadcrumb count.
      expect(utils.getByText("Home")).toBeInTheDocument();
      const breadcrumbNav = utils.getByText("Home").closest("a")?.parentElement;
      expect(breadcrumbNav?.querySelectorAll("a")).toHaveLength(1);
    });

    it("injects the framework Link override into every breadcrumb", () => {
      function StubLink({ href, children, ...rest }: VexLinkProps) {
        return createElement("a", { "data-stub-link": "true", href, ...rest }, children);
      }
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          { value: { Link: StubLink } as FrameworkComponents },
          withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        ),
        { convex: t },
      );
      expect(utils.container.querySelectorAll('[data-stub-link="true"]').length).toBeGreaterThan(0);
    });

    it("resolves the document-title crumb via Suspense for an active edit route (top-bar move)", async () => {
      // `testCollection` (the shared fixture) defaults `admin.useAsTitle` to `"_id"`
      // (`defineCollection`'s own documented default) — a local variant with an explicit
      // `useAsTitle: "title"` is needed to prove the crumb shows a REAL title, not just the
      // id it would always have access to regardless of whether this feature works.
      const titledPosts = defineCollection({
        slug: "posts",
        fields: { status: text({ index: "by_status" }), title: text({ required: false }) },
        admin: { useAsTitle: "title" },
      });
      const titledConfig = defineConfig({
        collections: [titledPosts],
        mediaCollections: testClientConfig.mediaCollections,
        globals: testClientConfig.globals,
      });
      const id = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "My Post Title" }));
      const utils = renderView(
        withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts", activeDocID: id })),
        { convex: t, config: titledConfig, access: options.access },
      );
      // Suspense-wrapped: not present synchronously, resolves once the `useSuspenseQuery`
      // (same `vexConvexApi.get` key the edit view's own data component prefetches,
      // `drafts: collection.versions.drafts`) settles — see `AdminTopNav.tsx`'s own doc
      // comment for why this must be a genuine query, not a prop, to work correctly on an
      // SSR-streamed first paint (a direct prop would require the layout to know the
      // document, which it structurally cannot — the whole reason this moved to
      // `NextAdminPage`).
      await waitFor(() => expect(utils.getByText("My Post Title")).toBeInTheDocument());
      expect(
        utils.container.querySelector(`a[href="/admin/collections/posts/${id}"]`),
      ).not.toBeNull();
    });

    /**
     * Sign-in/out control tests (`FrameworkComponents.auth`, `AdminTopNav`'s `AuthControl`).
     * `signOut` is ALWAYS a `vi.fn()` stub here, never a real auth client call — these tests
     * exercise the click handler/pending-state wiring only, matching the project rule that
     * the real sign-out action must only ever be exercised against a mock.
     */
    const stubAuthAdapter = {
      signInHref: (redirectTo: string) => `/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`,
      signOut: () => Promise.resolve(),
    };

    it("renders no sign-in/out control when no auth adapter is configured", () => {
      const utils = renderView(
        withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        { convex: t, access: options.access },
      );
      expect(utils.queryByText("Sign in")).toBeNull();
      expect(utils.queryByText("Sign out")).toBeNull();
    });

    it("shows a visible Sign in label with the icon to its right and a redirectTo back to the current admin URL when signed out", () => {
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          { value: { auth: stubAuthAdapter } as FrameworkComponents },
          withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        ),
        { convex: t, access: options.access, auth: { user: null } },
      );
      expect(utils.getByText("Sign in")).toBeInTheDocument();
      expect(utils.queryByText("Sign out")).toBeNull();
      const link = utils.getByText("Sign in").closest("a");
      expect(link?.getAttribute("href")).toBe(
        "/auth/sign-in?redirectTo=%2Fadmin%2Fcollections%2Fposts",
      );
      // iconPosition="right" (developer correction — not icon-only): the icon is the LAST
      // element child of its own content span, after the visible "Sign in" text node.
      const icon = link?.querySelector("svg");
      expect(icon).not.toBeNull();
      expect(icon?.parentElement?.lastElementChild).toBe(icon);
    });

    it('treats an anonymous session ("isAnonymous: true") as signed out, not signed in', () => {
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          { value: { auth: stubAuthAdapter } as FrameworkComponents },
          withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        ),
        { convex: t, access: options.access, auth: { user: { isAnonymous: true } } },
      );
      expect(utils.getByText("Sign in")).toBeInTheDocument();
      expect(utils.queryByText("Sign out")).toBeNull();
    });

    it("shows a Sign out control when signed in and calls the adapter's signOut exactly once on click", async () => {
      const signOut = vi.fn().mockResolvedValue(undefined);
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          {
            value: {
              auth: { signInHref: stubAuthAdapter.signInHref, signOut },
            } as FrameworkComponents,
          },
          withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        ),
        { convex: t, access: options.access, auth: { user: { _id: "user1" } } },
      );
      expect(utils.getByText("Sign out")).toBeInTheDocument();
      expect(utils.queryByText("Sign in")).toBeNull();
      fireEvent.click(utils.getByText("Sign out"));
      expect(signOut).toHaveBeenCalledTimes(1);
      // The button disables itself (`isPending`) until the adapter's promise settles —
      // never a second call from an impatient double-click while pending.
      fireEvent.click(utils.getByText("Sign out"));
      expect(signOut).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(utils.getByText("Sign out").closest("button")).not.toBeDisabled());
    });

    it("places the control at the far edge opposite the sidebar-trigger cluster when the sidebar is on the right", () => {
      const rightSidebarConfig = defineConfig({
        collections: testClientConfig.collections,
        mediaCollections: testClientConfig.mediaCollections,
        globals: testClientConfig.globals,
        admin: { sidebar: { side: "right" } },
      });
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          { value: { auth: stubAuthAdapter } as FrameworkComponents },
          withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        ),
        { convex: t, config: rightSidebarConfig, access: options.access, auth: { user: null } },
      );
      const header = utils.container.querySelector("header");
      expect(header?.firstElementChild?.textContent).toContain("Sign in");
    });

    it("places the control at the far edge opposite the sidebar-trigger cluster when the sidebar is on the left (default)", () => {
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          { value: { auth: stubAuthAdapter } as FrameworkComponents },
          withSidebarProvider(createElement(AdminTopNav, { activeSlug: "posts" })),
        ),
        { convex: t, access: options.access, auth: { user: null } },
      );
      const header = utils.container.querySelector("header");
      expect(header?.lastElementChild?.textContent).toContain("Sign in");
    });
  });
}

/** A view this suite covers, named as a caller would reference the component. */
export type ViewSuiteMember =
  | "CollectionListView"
  | "CollectionEditView"
  | "GlobalEditView"
  | "GlobalsListView"
  | "DashboardView"
  | "CollectionsIndexView"
  | "UnauthorizedView"
  | "MediaCollectionListView"
  | "MediaCollectionEditView";

const ALL_VIEW_MEMBERS: ViewSuiteMember[] = [
  "CollectionListView",
  "CollectionEditView",
  "GlobalEditView",
  "GlobalsListView",
  "DashboardView",
  "CollectionsIndexView",
  "UnauthorizedView",
  "MediaCollectionListView",
  "MediaCollectionEditView",
];

/** Options for {@link runViewSuite}. */
export interface ViewSuiteOptions {
  /** Views to run. Defaults to all eight. */
  only?: ViewSuiteMember[];
  /**
   * A real `VexAccessConfig` to render every selected view against. Omit to drive the full
   * 5-scenario RBAC gating matrix through the shared `testAccess`/`testUsers` fixtures
   * (`runRbacStateSuite`'s default scenarios). When supplied, this suite cannot assume the
   * caller's role names or granted resources, so it downgrades to a single non-crashing mount
   * per view under the supplied config — the same smoke-check semantics
   * `runVexReactSuite`'s own `access` option already uses.
   */
  access?: VexAccessConfig;
}

/**
 * Runs the full views section: all eight admin views, full-mount against seeded
 * convex-test data. Call at module top level inside a `*.test.ts(x)` file — it calls
 * `describe`/`it` itself.
 *
 * @param options - Which views to run and an optional caller-supplied access config.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runViewSuite(options?: ViewSuiteOptions): void {
  const only = options?.only ?? ALL_VIEW_MEMBERS;
  const access = options?.access;
  if (only.includes("CollectionListView")) describeCollectionListView({ access });
  if (only.includes("CollectionEditView")) describeCollectionEditView({ access });
  if (only.includes("GlobalEditView")) describeGlobalEditView({ access });
  if (only.includes("GlobalsListView")) describeGlobalsListView({ access });
  if (only.includes("DashboardView")) describeDashboardView({ access });
  if (only.includes("CollectionsIndexView")) describeCollectionsIndexView({ access });
  if (only.includes("UnauthorizedView")) describeUnauthorizedView({ access });
  if (only.includes("MediaCollectionListView")) describeMediaCollectionListView({ access });
  if (only.includes("MediaCollectionEditView")) describeMediaCollectionEditView({ access });
}

/** A shell component this suite covers, named as a caller would reference the component. */
export type ShellSuiteMember = "AdminLayout" | "AdminSidebar" | "AdminTopNav";

const ALL_SHELL_MEMBERS: ShellSuiteMember[] = ["AdminLayout", "AdminSidebar", "AdminTopNav"];

/** Options for {@link runShellSuite}. */
export interface ShellSuiteOptions {
  /** Shell components to run. Defaults to all three. */
  only?: ShellSuiteMember[];
  /**
   * A real `VexAccessConfig` to render every selected component against. Same two-mode split
   * as {@link ViewSuiteOptions.access}: omitted drives `AdminSidebar`'s full 5-scenario RBAC
   * matrix; supplied downgrades it to a non-crashing smoke mount. `AdminLayout`/`AdminTopNav`
   * have no RBAC surface of their own (see their own doc comments) and only use this to prove
   * a caller's config does not crash the mount.
   */
  access?: VexAccessConfig;
}

/**
 * Runs the full shell section: `AdminLayout`, `AdminSidebar`, `AdminTopNav`. Call at module
 * top level inside a `*.test.ts(x)` file — it calls `describe`/`it` itself.
 *
 * @param options - Which shell components to run and an optional caller-supplied access config.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
export function runShellSuite(options?: ShellSuiteOptions): void {
  const only = options?.only ?? ALL_SHELL_MEMBERS;
  const access = options?.access;
  if (only.includes("AdminLayout")) describeAdminLayout({ access });
  if (only.includes("AdminSidebar")) describeAdminSidebar({ access });
  if (only.includes("AdminTopNav")) describeAdminTopNav({ access });
}
