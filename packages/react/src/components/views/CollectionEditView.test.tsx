import { createElement } from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { defineAccess, defineCollection, defineConfig, text } from "@vexcms/core";
import type * as ConvexReactQuery from "@convex-dev/react-query";
import { CollectionEditView } from "./CollectionEditView";
import { renderView } from "../../testing/harness/viewHarness";
import { testCollection } from "../../testing/harness/accessFixtures";
import schema, { testModules } from "../../testing/convex/schema";
import { runViewSuite } from "../../testing/viewSuite";

runViewSuite({ only: ["CollectionEditView"] });

const { convexMutationMock } = vi.hoisted(() => ({ convexMutationMock: vi.fn() }));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQuery>();
  return { ...actual, useConvexMutation: () => convexMutationMock };
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
