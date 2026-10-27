import { createElement } from "react";
import { fireEvent, waitFor, within } from "@testing-library/react";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import { defineAccess, defineCollection, defineConfig, text, VERSION_STATUSES } from "@vexcms/core";
import type * as ConvexReactQuery from "@convex-dev/react-query";
import type * as Documents from "../documents";
import { ConvexError } from "convex/values";
import { CollectionEditView } from "./CollectionEditView";
import { renderView } from "../testing/harness/viewHarness";
import { testCollection } from "../testing/harness/accessFixtures";
import schema, { testModules } from "../testing/convex/schema";
import { runViewSuite } from "../testing/viewSuite";

runViewSuite({ only: ["CollectionEditView"] });

const { convexMutationMock, headerCollapseMock } = vi.hoisted(() => ({
  convexMutationMock: vi.fn(),
  headerCollapseMock: vi.fn(() => ({ collapseDelete: false, collapsePreview: false, collapseCancel: false })),
}));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQuery>();
  return { ...actual, useConvexMutation: () => convexMutationMock };
});

vi.mock("../documents", async (importOriginal) => {
  const actual = await importOriginal<typeof Documents>();
  return { ...actual, useHeaderActionsCollapse: headerCollapseMock };
});

beforeEach(() => {
  headerCollapseMock.mockReturnValue({ collapseDelete: false, collapsePreview: false, collapseCancel: false });
});

describe("CollectionEditView — diff submit", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset().mockResolvedValue("doc1");
  });

  it("submits only the changed field", async () => {
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "a" }));
    const stored = await t.run((ctx) => ctx.db.get(doc));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc, initialData: stored }),
      { convex: t },
    );

    fireEvent.change(utils.container.querySelector("#title")!, { target: { value: "new title" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    // `status` was never edited, so it is absent — this is what stops a save
    // from reverting another editor's concurrent change to it.
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toEqual({ title: "new title" });
  });

  it("does not submit at all when nothing changed", async () => {
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "a" }));
    const stored = await t.run((ctx) => ctx.db.get(doc));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc, initialData: stored }),
      { convex: t },
    );

    fireEvent.submit(utils.container.querySelector("form")!);

    // Let the microtask queue drain, so a submit that WAS going to fire has
    // had its chance before asserting it never did.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(convexMutationMock).not.toHaveBeenCalled();
  });

  it("omits a read-denied field from the submitted payload", async () => {
    // No shared-suite equivalent: the shared kit never mocks `useConvexMutation`
    // (a real submit would hit the fake bridge, which has no "vex:update"
    // handler), so a payload assertion only works here, against this file's
    // own hoisted mock.
    const readGatedAccess = defineAccess({
      roles: ["gated"] as const,
      resources: [testCollection],
      userCollectionSlug: "users",
      userRolesField: "roles",
      permissions: {
        gated: {
          posts: {
            read: () => ({ "*": false, title: true }),
            update: () => ({ "*": false, title: true }),
          },
        },
      },
    });
    const id = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "secret", title: "visible" }),
    );
    const stored = await t.run((ctx) => ctx.db.get(id));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: id, initialData: stored }),
      { convex: t, access: readGatedAccess, auth: { user: { _id: "u1", roles: "gated" } as never } },
    );

    fireEvent.change(utils.container.querySelector("#title")!, { target: { value: "edited" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toEqual({ title: "edited" });
  });
});

describe("CollectionEditView — live preview split", () => {
  const t = convexTest(schema, testModules);

  const previewCollection = defineCollection({
    slug: "posts",
    fields: {
      status: text({ index: "by_status" }),
      title: text({ required: false }),
    },
    admin: {
      livePreview: { url: (doc) => `/posts/${String(doc.title ?? "")}` },
    },
  });
  const previewConfig = defineConfig({ collections: [previewCollection] });

  async function renderSplit(initialPreviewPanelSize?: number) {
    const id = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "a" }));
    const stored = await t.run((ctx) => ctx.db.get(id));
    return renderView(
      createElement(CollectionEditView, {
        collection: previewCollection.slug,
        documentId: id,
        initialData: stored,
        initialPreviewPanelOpen: true,
        initialPreviewPanelSize,
      }),
      { convex: t, config: previewConfig },
    );
  }

  /** react-resizable-panels renders each panel's share as its flex-grow factor. */
  function panelGrowFactors(container: HTMLElement): string[] {
    return Array.from(container.querySelectorAll("[data-panel]")).map(
      (panel) => (panel as HTMLElement).style.flexGrow,
    );
  }

  it("renders the split at the server-supplied handle position on first paint", async () => {
    const utils = await renderSplit(35);
    await waitFor(() => expect(utils.container.querySelector("[data-panel]")).not.toBeNull());
    // The cookie-derived width must be the FIRST painted layout — a default-then-correct
    // sequence is exactly the shift this prop exists to prevent. Both panels are
    // asserted: a panel left without a `defaultSize` paints at grow factor 0 until the
    // group measures itself, which is a preview pane that flashes at zero width.
    expect(panelGrowFactors(utils.container)).toEqual(["35", "65"]);
  });

  it("falls back to the default share when no position was stored", async () => {
    const utils = await renderSplit(undefined);
    await waitFor(() => expect(utils.container.querySelector("[data-panel]")).not.toBeNull());
    expect(panelGrowFactors(utils.container)).toEqual(["60", "40"]);
  });
});

describe("CollectionEditView — document appearing after a missing prefetch", () => {
  const t = convexTest(schema, testModules);

  // Regression: the server prefetch can resolve `null` (e.g. it read without
  // `drafts` while the client reads a draft row) and the client query then
  // finds the document. The view used to return "Document not found" BEFORE its
  // form hooks, so the next render called more hooks and React threw "Rendered
  // more hooks than during the previous render".
  it("renders the form without a hook-order error when the client query finds the document", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "b", title: "found" }));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );

    // No prefetched document: the first render has none, the query then finds it.
    expect(utils.getByText("Document not found.")).toBeInTheDocument();
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());
    expect((utils.container.querySelector("#title") as HTMLInputElement).value).toBe("found");

    const hookErrors = consoleError.mock.calls.filter((call) =>
      call.some((arg) => String(arg).includes("order of Hooks")),
    );
    expect(hookErrors).toEqual([]);
    consoleError.mockRestore();
  });
});

/**
 * jsdom's `Location#assign` is an own, non-configurable/non-writable property
 * (`configurable: false`), so `vi.spyOn(window.location, "assign")` throws
 * "Cannot redefine property: assign". `window`'s OWN `location` property is
 * configurable in vitest's jsdom environment, though, so swapping the whole
 * object works — `restore()` puts the original back so later tests/files in
 * this same jsdom window are unaffected.
 */
interface LocationAssignMock {
  assign: Mock;
  restore: () => void;
}

function mockLocationAssign(): LocationAssignMock {
  const originalLocation = window.location;
  const assign = vi.fn();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, assign },
  });
  return {
    assign,
    restore: () => {
      Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
    },
  };
}

describe("CollectionEditView — duplicate", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset();
  });


  it("navigates to the new document on a successful duplicate", async () => {
    const assignSpy = mockLocationAssign();
    convexMutationMock.mockResolvedValueOnce("newDoc1");
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "a", title: "Original" }));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    fireEvent.click(await utils.findByRole("menuitem", { name: "Duplicate" }));

    await waitFor(() => expect(assignSpy.assign).toHaveBeenCalledWith("/admin/collections/posts/newDoc1"));
    assignSpy.restore();
  });

  it("opens the all-fields fallback and focuses the conflicting field when the create is rejected", async () => {
    // Rejects every `create` call (not just the first) — the SAME rejection has to recur
    // on the fallback form's own `submitOnOpen` resubmission, which goes through this same
    // mock via a separate `useVexMutation` instance; a `...Once` here would resolve that
    // second call successfully instead and close the dialog before these assertions run.
    //
    // Conflict targets `title` — the SECOND field in `fieldsMode: "all"`'s render order
    // (`status` then `title`), not the first. `DialogContent` autofocuses its first
    // focusable input on open regardless of any error, so a conflict on the first field
    // would pass this test even if `focusFirstFieldError` never ran at all.
    convexMutationMock.mockRejectedValue(
      new ConvexError({ message: "title already taken", field: "title" }),
    );
    const doc = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "a", title: "taken" }),
    );
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    fireEvent.click(await utils.findByRole("menuitem", { name: "Duplicate" }));

    // The fallback dialog opens prefilled with the clone, fields: "all" (both `status` and
    // `title`, not just the required `status`), and auto-submits via `submitOnOpen`.
    const dialog = await waitFor(() => utils.getByRole("dialog"));
    const titleInput = await waitFor(() => {
      const input = dialog.querySelector("#title") as HTMLInputElement | null;
      expect(input).not.toBeNull();
      return input!;
    });
    expect(dialog.querySelector("#status")).not.toBeNull();
    expect(titleInput.value).toBe("taken");

    // `submitOnOpen` re-ran the same create, which rejected the same way — `applyVexFieldErrors`
    // put the server's message on `title`, and `AppForm`'s `failedSubmitAttempt` effect
    // ran `focusFirstFieldError`, overriding the dialog's own first-input autofocus.
    await waitFor(() => expect(titleInput).toHaveFocus());
    expect(dialog).toHaveTextContent("title already taken");
  });

  it("forces a draft on a versioned collection even when defaultStatus is published", async () => {
    convexMutationMock.mockResolvedValueOnce("newDoc2");
    const assignSpy = mockLocationAssign();
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

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    fireEvent.click(await utils.findByRole("menuitem", { name: "Duplicate" }));

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]).toMatchObject({
      status: VERSION_STATUSES.draft.key,
    });
    assignSpy.restore();
  });
});

describe("CollectionEditView — header action order", () => {
  const t = convexTest(schema, testModules);

  it("places More actions (Duplicate/Revalidate) left of the status badge, then Preview/Save/Cancel/Delete left to right, with Duplicate/Revalidate reachable only through the menu", async () => {
    const doc = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "a", title: "Original" }),
    );
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    // Duplicate/Revalidate are not rendered as standalone header buttons — only
    // reachable by opening the ⋯ menu.
    expect(utils.queryByRole("button", { name: "Duplicate" })).toBeNull();
    expect(utils.queryByRole("button", { name: "Revalidate" })).toBeNull();
    const moreActions = utils.getByRole("button", { name: "More actions" });
    fireEvent.click(moreActions);
    expect(await utils.findByRole("menuitem", { name: "Duplicate" })).toBeInTheDocument();
    expect(utils.getByRole("menuitem", { name: "Revalidate" })).toBeInTheDocument();

    const actionNames = ["More actions", "Save", "Cancel", "Delete"];
    const buttons = Array.from(utils.container.querySelectorAll("button")).filter((button) =>
      actionNames.includes(button.getAttribute("aria-label") ?? button.textContent?.trim() ?? ""),
    );
    const order = buttons.map(
      (button) => button.getAttribute("aria-label") ?? button.textContent?.trim(),
    );
    expect(order).toEqual(actionNames);
  });

  it("keeps Save and Cancel visible but disabled when the form has no unsaved changes (never hidden by state)", async () => {
    const doc = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "a", title: "Original" }),
    );
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    expect(utils.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(utils.getByRole("button", { name: "Cancel" })).toBeDisabled();

    fireEvent.change(utils.container.querySelector("#title")!, { target: { value: "Changed" } });
    await waitFor(() => expect(utils.getByRole("button", { name: "Save" })).toBeEnabled());
    expect(utils.getByRole("button", { name: "Cancel" })).toBeEnabled();
  });

  it("orders the ⋯ menu as History, Revalidate, Duplicate for a versioned collection (Preview not configured, so absent)", async () => {
    const versionedCollection = {
      ...testCollection,
      versions: { ...testCollection.versions, drafts: true },
    } as unknown as typeof testCollection;
    const config = defineConfig({ collections: [versionedCollection] });
    const doc = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "a", title: "Original", vex_status: "draft" }),
    );
    const utils = renderView(
      createElement(CollectionEditView, { collection: versionedCollection.slug, documentId: doc }),
      { convex: t, config },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    const menu = await utils.findByRole("menu");
    const itemNames = within(menu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent?.trim());
    expect(itemNames).toEqual(["History", "Revalidate", "Duplicate"]);
  });
});

describe("CollectionEditView — responsive header collapse", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset();
  });

  it("moves Delete into the ⋯ menu when the header is measured narrow; Save and Cancel stay inline", async () => {
    headerCollapseMock.mockReturnValue({ collapseDelete: true, collapsePreview: false, collapseCancel: false });
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "a", title: "Original" }));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    expect(utils.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(utils.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(utils.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    expect(await utils.findByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("the collapsed Delete's confirm dialog still opens from the menu and deletes on confirm", async () => {
    headerCollapseMock.mockReturnValue({ collapseDelete: true, collapsePreview: false, collapseCancel: false });
    const assignSpy = mockLocationAssign();
    convexMutationMock.mockResolvedValueOnce(undefined);
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "a", title: "Original" }));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    fireEvent.click(await utils.findByRole("menuitem", { name: "Delete" }));

    // The item that opened it (CollectionDeleteAction with placement="menu") has already
    // unmounted — the dialog rendered through useEditActionsMenuDialog's host, outside
    // DropdownMenuContent, survives the dropdown closing.
    const dialog = await waitFor(() => utils.getByRole("dialog"));
    expect(dialog).toHaveTextContent("Delete this document?");
    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    expect(convexMutationMock.mock.calls[0]?.[0]).toMatchObject({
      ids: [doc],
      collection: testCollection.slug,
    });
    assignSpy.restore();
  });

  it("collapses vex.livePreview into the ⋯ menu too, once the header is measured narrower still", async () => {
    headerCollapseMock.mockReturnValue({ collapseDelete: true, collapsePreview: true, collapseCancel: false });
    const previewCollection = defineCollection({
      slug: "posts",
      fields: { status: text({ index: "by_status" }), title: text({ required: false }) },
      admin: { livePreview: { url: (doc) => `/posts/${String(doc.title ?? "")}` } },
    });
    const previewConfig = defineConfig({ collections: [previewCollection] });
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "a", title: "Original" }));
    const utils = renderView(
      createElement(CollectionEditView, { collection: previewCollection.slug, documentId: doc }),
      { convex: t, config: previewConfig },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    expect(utils.queryByRole("button", { name: "Preview" })).toBeNull();
    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    expect(await utils.findByRole("menuitem", { name: "Preview" })).toBeInTheDocument();
  });

  it("moves Cancel into the ⋯ menu when the header is measured narrower still; Save stays inline", async () => {
    headerCollapseMock.mockReturnValue({ collapseDelete: true, collapsePreview: true, collapseCancel: true });
    const doc = await t.run((ctx) => ctx.db.insert("documents", { status: "a", title: "Original" }));
    const utils = renderView(
      createElement(CollectionEditView, { collection: testCollection.slug, documentId: doc }),
      { convex: t },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    expect(utils.queryByRole("button", { name: "Cancel" })).toBeNull();
    expect(utils.getByRole("button", { name: "Save" })).toBeInTheDocument();

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    expect(await utils.findByRole("menuitem", { name: "Cancel" })).toBeInTheDocument();
  });

  it("orders the fully-collapsed ⋯ menu as Cancel, Preview, History, Revalidate, Duplicate, Delete", async () => {
    headerCollapseMock.mockReturnValue({ collapseDelete: true, collapsePreview: true, collapseCancel: true });
    const previewCollection = defineCollection({
      slug: "posts",
      fields: { status: text({ index: "by_status" }), title: text({ required: false }) },
      admin: { livePreview: { url: (doc) => `/posts/${String(doc.title ?? "")}` } },
    });
    const versionedPreviewCollection = {
      ...previewCollection,
      versions: { ...previewCollection.versions, drafts: true },
    } as unknown as typeof previewCollection;
    const config = defineConfig({ collections: [versionedPreviewCollection] });
    const doc = await t.run((ctx) =>
      ctx.db.insert("documents", { status: "a", title: "Original", vex_status: "draft" }),
    );
    const utils = renderView(
      createElement(CollectionEditView, {
        collection: versionedPreviewCollection.slug,
        documentId: doc,
      }),
      { convex: t, config },
    );
    await waitFor(() => expect(utils.container.querySelector("#title")).not.toBeNull());

    fireEvent.click(utils.getByRole("button", { name: "More actions" }));
    const menu = await utils.findByRole("menu");
    const itemNames = within(menu)
      .getAllByRole("menuitem")
      .map((item) => item.textContent?.trim());
    expect(itemNames).toEqual(["Cancel", "Preview", "History", "Revalidate", "Duplicate", "Delete"]);
  });
});
