import { createElement } from "react";
import { beforeAll, describe, expect, it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { convexTest } from "convex-test";
import {
  select,
  type PaginationResult,
  type VexAccessConfig,
  type VexDocument,
  type VexMediaDocument,
} from "@vexcms/core";
import schema, { testModules, type TestDoc } from "./convex/schema";
import type { ConvexTestInstance } from "./convex/bridge";
import { renderWithVexProviders, testCollection } from "./harness/accessFixtures";
import { renderView, testClientConfig, wrapWithViewProviders } from "./harness/viewHarness";
import { runRbacStateSuite } from "./rbacState";
import { ThemeProvider } from "../components/ui/ThemeProvider";
import { SidebarProvider } from "../components/ui/sidebar";
import {
  FrameworkComponentsContext,
  useFrameworkComponents,
  type FrameworkComponents,
  type VexLinkProps,
} from "../hooks/useFrameworkComponents";
import { AdminLayout } from "../components/AdminLayout";
import { AppSidebar } from "../components/AdminSidebar";
import AdminTopNav from "../components/AdminTopNav";
import {
  CollectionListView,
  CollectionEditView,
  GlobalEditView,
  GlobalsListView,
  DashboardView,
  UnauthorizedView,
  MediaCollectionListView,
  MediaCollectionEditView,
} from "../components/views";

/**
 * One entry per `runRbacStateSuite` default scenario name, resolved for a given
 * resource/action/scope combination. Three distinct matrices cover every
 * `usePermission`/`hasPermission` call site this suite exercises — see the derivation
 * comment above each constant.
 */
type RbacMatrix = Record<"none" | "anonymous" | "denied" | "allowed" | "scoped", boolean>;

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
function toPage<TDoc extends VexDocument = VexDocument>(docs: TestDoc<"documents">[]): PaginationResult<TDoc> {
  // convex-test's schema-derived doc type has no index signature; `VexDocument` requires one,
  // and `VexMediaDocument` (the media list view's TDoc) requires media-specific fields none of
  // this suite's seeded rows carry (they only exercise the "no src" fallback rendering path).
  return { page: docs as unknown as TDoc[], continueCursor: "", isDone: true };
}

/**
 * Inserts one "documents" row per title and returns the seeded rows, in insertion order.
 *
 * @param t - The `convexTest()` instance to seed.
 * @param titles - One title per row to insert.
 * @returns The seeded rows, in insertion order.
 */
async function seedDocuments(t: ConvexTestInstance, titles: string[]): Promise<TestDoc<"documents">[]> {
  return t.run(async (ctx) => {
    const ids = await Promise.all(titles.map((title) => ctx.db.insert("documents", { title })));
    const docs = await Promise.all(ids.map((id) => ctx.db.get(id)));
    return docs.filter((doc): doc is TestDoc<"documents"> => doc !== null);
  });
}

/**
 * Full-mount `CollectionListView` — the SSR-preview stack transitively rendered here is
 * `DataTable` + `CreateDocumentModal` + `RevalidateButton`, exactly what an admin visits.
 *
 * `canDelete`'s only possible consumer is `DataTable`'s bulk-delete confirmation, but
 * `DataTable.tsx`'s bulk-actions bar (the only UI that ever calls `setDeleteModalOpen(true)`)
 * is commented out — `DataTableBulkActions` is exported but never rendered there. There is
 * therefore no `canDelete`-gated control in the DOM to assert a disabled state against;
 * asserting one would fabricate a query against markup that isn't rendered (RBAC-2 in
 * BUGS-REPORT.md). What IS checkable, and asserted below in a dedicated test, is the actual
 * safe consequence: no destructive control is reachable at all, gated or not — that test also
 * records the wiring requirement for whoever restores the bar. `canCreate` (the "+ New"
 * button) and `RevalidateButton` (the same "posts" resource, `update` action) ARE both
 * directly observable and are what the RBAC suite below gates on.
 *
 * @param options - Optional caller-supplied access config; see {@link ViewSuiteOptions.access}.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeCollectionListView(options: { access?: VexAccessConfig }): void {
  describe("CollectionListView", () => {
    const t = convexTest(schema, testModules);
    let docs: TestDoc<"documents">[] = [];

    beforeAll(async () => {
      docs = await seedDocuments(t, ["First", "Second", "Third"]);
    });

    if (options.access) {
      it("renders without crashing under the provided access config", () => {
        const { container, unmount } = renderView(
          createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
          { convex: t, access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders rows from seeded data", () => {
      const utils = renderView(
        createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
        { convex: t },
      );
      expect(utils.getByText("3 documents")).toBeInTheDocument();
      expect(utils.getAllByRole("row")).toHaveLength(4); // 1 header row + 3 data rows
    });

    it("renders the empty state with zero documents", () => {
      const utils = renderView(
        createElement(CollectionListView, { collection: testCollection, initialData: toPage([]) }),
        { convex: t },
      );
      expect(utils.getByText("0 documents")).toBeInTheDocument();
      expect(utils.getAllByRole("row")).toHaveLength(1); // header row only
    });

    it("has no reachable destructive control while bulk-delete UI remains unwired", () => {
      const utils = renderView(
        createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
        { convex: t },
      );
      // `canDelete` (asserted nowhere in this suite — see doc comment above) has no live
      // consumer: `DataTable.tsx`'s bulk-actions bar, the only UI that ever calls
      // `setDeleteModalOpen(true)`, is commented out. WIRING FINDING for whoever restores
      // `DataTableBulkActions`: once it renders again, this suite needs a real
      // `canDelete`-gated assertion here (mirroring the "+ New" button's `aria-disabled`
      // check below), not this absence check.
      expect(utils.queryByRole("button", { name: /delete/i })).toBeNull();
    });

    it("renders without crashing when useAsTitle points at a non-text field", () => {
      // `useAsTitle?: CoreAdminField | NoInfer<TFieldSlug>` (core/collections/types.ts:170)
      // accepts ANY field key, including a select/date/number column, not just a text one.
      // `getCollectionColumnDefs` (components/fields/index.tsx:220) marks whichever field's
      // key equals `useAsTitle` as `isTitleField` regardless of its type — the same shared
      // logic that makes Step 5's CELL-1 (9 of 12 Cell components silently ignore
      // `isTitleField`) reachable in the first place. This proves the full-mount list view
      // survives a non-text title column; whether that column ends up clickable is Step 5's
      // own contract, not asserted here.
      const priorityTitleCollection = {
        ...testCollection,
        fields: {
          ...testCollection.fields,
          priority: select({
            label: "Priority",
            options: [
              { label: "Low", value: "low" },
              { label: "High", value: "high" },
            ],
          }),
        },
        admin: { ...testCollection.admin, useAsTitle: "priority" },
        // `useAsTitle` is typed against `testCollection`'s own generated field-key union
        // ("status"), which doesn't include this test-local "priority" key — a real
        // collection's own `TFieldSlug` would. Cast at this boundary rather than widen the
        // shared fixture's type.
      } as unknown as typeof testCollection;
      const utils = renderView(
        createElement(CollectionListView, { collection: priorityTitleCollection, initialData: toPage(docs) }),
        { convex: t },
      );
      expect(utils.getAllByRole("row")).toHaveLength(4); // 1 header row + 3 data rows
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(CollectionListView, { collection: testCollection, initialData: toPage(docs) }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_POSTS[scenario.name as keyof RbacMatrix];
        const newLink = utils.container.querySelector('a[href="/admin/posts?createNew=true"]');
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
            collection: testCollection,
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
          collection: testCollection,
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
        createElement(CollectionEditView, { collection: testCollection, documentId: doc._id, initialData: doc }),
        { convex: t },
      );
      const statusInput = utils.container.querySelector("#status") as HTMLInputElement;
      expect(statusInput).not.toBeNull();
      expect(statusInput.value).toBe("");
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(CollectionEditView, {
            collection: testCollection,
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
        const revalidateButton = utils.getByRole("button", { name: "Revalidate" });
        if (expected) {
          expect(revalidateButton).not.toBeDisabled();
        } else {
          expect(revalidateButton).toBeDisabled();
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
        const { container, unmount } = renderView(createElement(GlobalEditView, { global: testClientConfig.globals[0] }), {
          convex: t,
          access: options.access,
          auth: { user: null },
        });
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    it("renders the default field values when no document has ever been saved", () => {
      const utils = renderView(createElement(GlobalEditView, { global: testClientConfig.globals[0] }), { convex: t });
      const heading = utils.getByRole("heading", { level: 1 });
      expect(heading.textContent).toBe("Edit Global - Settings");
      expect(utils.container.querySelector("#siteName")).not.toBeNull();
    });

    runRbacStateSuite({
      render: () => wrapWithViewProviders(createElement(GlobalEditView, { global: testClientConfig.globals[0] }), { convex: t }),
      assert: (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
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
 * `GlobalsListView` reads only its `config` prop — no context, no `usePermission`, no
 * gating of its own (the sidebar and dashboard already filter which globals a caller ever
 * sees a link to). A plain render proves the card grid and its link targets.
 *
 * @param _options - Unused; this view has no RBAC surface to downgrade.
 * @returns Nothing; registers `describe`/`it` blocks as a side effect.
 */
function describeGlobalsListView(_options: { access?: VexAccessConfig }): void {
  describe("GlobalsListView", () => {
    it("renders one card per configured global, linking to its edit route", () => {
      const utils = renderWithVexProviders(createElement(GlobalsListView, { config: testClientConfig }));
      expect(utils.getByText("Settings")).toBeInTheDocument();
      expect(utils.getByText("Edit Global")).toBeInTheDocument();
      const link = utils.container.querySelector('a[href="/admin/globals/settings"]');
      expect(link).not.toBeNull();
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
        const { container, unmount } = renderWithVexProviders(
          createElement(DashboardView, { config: testClientConfig }),
          { access: options.access, auth: { user: null } },
        );
        expect(container).toBeTruthy();
        unmount();
      });
      return;
    }

    runRbacStateSuite({
      render: () => createElement(DashboardView, { config: testClientConfig }),
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
            collection: testClientConfig.mediaCollections[0],
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
          collection: testClientConfig.mediaCollections[0],
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
          collection: testClientConfig.mediaCollections[0],
          initialData: toPage<VexMediaDocument>([]),
        }),
        { convex: t },
      );
      expect(utils.getByText(/No images yet/)).toBeInTheDocument();
      expect(utils.getByText("Upload one.")).toBeInTheDocument();
      expect(utils.queryAllByRole("row")).toHaveLength(0);
    });

    it("has no reachable destructive control while bulk-delete UI remains unwired", () => {
      const utils = renderView(
        createElement(MediaCollectionListView, {
          collection: testClientConfig.mediaCollections[0],
          initialData: toPage<VexMediaDocument>(docs),
        }),
        { convex: t },
      );
      // Same dead-code gap as CollectionListView's own canDelete: `DataTable.tsx`'s
      // bulk-actions bar is commented out, so there is nothing in the DOM to gate. WIRING
      // FINDING for whoever restores it: this suite then needs a real canDelete-gated
      // assertion here.
      expect(utils.queryByRole("button", { name: /delete/i })).toBeNull();
    });

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(MediaCollectionListView, {
            collection: testClientConfig.mediaCollections[0],
            initialData: toPage<VexMediaDocument>(docs),
          }),
          { convex: t },
        ),
      assert: (utils, scenario) => {
        const expected = MATRIX_UNDECLARED[scenario.name as keyof RbacMatrix];
        expect(utils.getByText("2 items")).toBeInTheDocument();
        const uploadLink = utils.container.querySelector('a[href="/admin/images?upload=true"]');
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
            collection: testClientConfig.mediaCollections[0],
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

    runRbacStateSuite({
      render: () =>
        wrapWithViewProviders(
          createElement(MediaCollectionEditView, {
            collection: testClientConfig.mediaCollections[0],
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
        createElement(SidebarProvider, null, createElement(AppSidebar, { config: testClientConfig })),
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
      render: () => mount(),
      assert: (utils, scenario) => {
        const name = scenario.name as keyof RbacMatrix;
        const postsLink = utils.container.querySelector('a[href="/admin/posts"]');
        const settingsLink = utils.container.querySelector('a[href="/admin/globals/settings"]');
        const imagesLink = utils.container.querySelector('a[href="/admin/images"]');
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
          expect(utils.container.querySelectorAll('[data-slot="sidebar-menu-button"]')).toHaveLength(0);
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
 * deny "posts" outright. `AdminLayout` also provides its OWN internal
 * `VexConfigContext.Provider`/`VexAuthProvider`/`FrameworkComponentsContext.Provider` (see its
 * render implementation), so an outer `auth` value never reaches its children either — a real
 * per-scenario RBAC-gating test belongs on `AppSidebar` directly (above), which has no such
 * internal provider to shadow it. Same two-mode split as every other member: default drives
 * the real assertions below; a caller-supplied `access` downgrades to a non-crashing mount.
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
            config: testClientConfig,
            pathname: "/admin/posts",
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
        createElement(
          AdminLayout,
          {
            config: testClientConfig,
            pathname: "/admin/posts",
            activeSlug: "posts",
            components: { Link: StubLink, Image: StubImage },
            children: createElement(ImageProbe),
          },
        ),
        { convex: t },
      );
      const stubLinks = utils.container.querySelectorAll('[data-stub-link="true"]');
      expect(stubLinks.length).toBeGreaterThan(0);
      expect(utils.getByTestId("image-probe").textContent).toBe("stub");
    });

    it("marks the active collection's nav entry and leaves the others inactive", () => {
      const utils = renderView(
        createElement(AdminLayout, {
          config: testClientConfig,
          pathname: "/admin/posts",
          activeSlug: "posts",
          children: createElement("div", null, "content"),
        }),
        { convex: t },
      );
      // Scoped to `[data-slot="sidebar-menu-button"]`: AdminTopNav's breadcrumb ALSO renders
      // an `<a href="/admin/posts">` (unrelated to `isActive`), so an unscoped href selector
      // is ambiguous the moment the sidebar entry itself is ever absent.
      const postsLink = utils.container.querySelector(
        'a[data-slot="sidebar-menu-button"][href="/admin/posts"]',
      );
      const imagesLink = utils.container.querySelector(
        'a[data-slot="sidebar-menu-button"][href="/admin/images"]',
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

    it("renders the breadcrumb trail for an active collection route", () => {
      const utils = renderView(
        createElement(AdminTopNav, {
          config: testClientConfig,
          pathname: "/admin/posts",
          activeSlug: "posts",
          children: null,
        }),
        { convex: t, access: options.access },
      );
      expect(utils.getByText("Home")).toBeInTheDocument();
      // `Postses` was `defineCollection`'s double-pluralized default label
      // (CORE-LABEL-1); the derived `labels.plural` for slug `posts` is now
      // the title-cased slug itself.
      expect(utils.getByText("Posts")).toBeInTheDocument();
      expect(utils.container.querySelector('a[href="/admin"]')).not.toBeNull();
      expect(utils.container.querySelector('a[href="/admin/posts"]')).not.toBeNull();
    });

    it('resolves a globals route through the "skip" sentinel with no document fetch', () => {
      const utils = renderView(
        createElement(AdminTopNav, {
          config: testClientConfig,
          pathname: "/admin/globals/settings",
          activeSlug: "globals",
          activeDocID: "settings",
          children: null,
        }),
        { convex: t, access: options.access },
      );
      expect(utils.getByText("Home")).toBeInTheDocument();
      expect(utils.getByText("Globals")).toBeInTheDocument();
      expect(utils.getByText("Settings")).toBeInTheDocument();
      expect(utils.container.querySelector('a[href="/admin/globals/settings"]')).not.toBeNull();
    });

    it("renders only the Home crumb for an unknown collection slug", () => {
      const utils = renderView(
        createElement(AdminTopNav, {
          config: testClientConfig,
          pathname: "/admin/does-not-exist",
          activeSlug: "does-not-exist",
          children: null,
        }),
        { convex: t, access: options.access },
      );
      // `activeCollection` resolves to `undefined` (not in `config.collections` or
      // `config.mediaCollections`) and `isGlobals` is false, so neither crumb-building
      // branch fires (AdminTopNav.tsx:77,90) — the breadcrumb degrades to just "Home" rather
      // than crashing or showing a stale/wrong label.
      expect(utils.getByText("Home")).toBeInTheDocument();
      expect(utils.container.querySelectorAll("a")).toHaveLength(1);
    });

    it("injects the framework Link override into every breadcrumb", () => {
      function StubLink({ href, children, ...rest }: VexLinkProps) {
        return createElement("a", { "data-stub-link": "true", href, ...rest }, children);
      }
      const utils = renderView(
        createElement(
          FrameworkComponentsContext.Provider,
          { value: { Link: StubLink } as FrameworkComponents },
          createElement(AdminTopNav, {
            config: testClientConfig,
            pathname: "/admin/posts",
            activeSlug: "posts",
            children: null,
          }),
        ),
        { convex: t },
      );
      expect(utils.container.querySelectorAll('[data-stub-link="true"]').length).toBeGreaterThan(0);
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
  | "UnauthorizedView"
  | "MediaCollectionListView"
  | "MediaCollectionEditView";

const ALL_VIEW_MEMBERS: ViewSuiteMember[] = [
  "CollectionListView",
  "CollectionEditView",
  "GlobalEditView",
  "GlobalsListView",
  "DashboardView",
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
