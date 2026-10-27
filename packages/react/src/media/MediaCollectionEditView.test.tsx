import { createElement } from "react";
import { fireEvent, waitFor } from "@testing-library/react";
import { convexTest } from "convex-test";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VexMediaDocument } from "@vexcms/core";
import type * as ConvexReactQuery from "@convex-dev/react-query";
import { MediaCollectionEditView } from "./MediaCollectionEditView";
import { renderView, testClientConfig } from "../testing/harness/viewHarness";
import schema, { testModules } from "../testing/convex/schema";
import { runViewSuite } from "../testing/viewSuite";

runViewSuite({ only: ["MediaCollectionEditView"] });

const { convexMutationMock } = vi.hoisted(() => ({ convexMutationMock: vi.fn() }));

vi.mock("@convex-dev/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof ConvexReactQuery>();
  return { ...actual, useConvexMutation: () => convexMutationMock };
});

describe("MediaCollectionEditView — diff submit", () => {
  const t = convexTest(schema, testModules);

  beforeEach(() => {
    convexMutationMock.mockReset().mockResolvedValue("media1");
  });

  it("submits only the changed field", async () => {
    const doc = await t.run((ctx) =>
      ctx.db.insert("media", {
        adapter: "convex",
        alt: "old alt",
        collectionSlug: "images",
        deleted: false,
        filename: "photo.png",
        mimeType: "image/png",
        size: 100,
        src: "https://example.com/photo.png",
        storageId: "s1",
      }),
    );
    const stored = await t.run((ctx) => ctx.db.get(doc));
    const utils = renderView(
      createElement(MediaCollectionEditView, {
        collection: testClientConfig.mediaCollections[0].slug,
        documentId: doc,
        initialData: stored as unknown as VexMediaDocument,
      }),
      { convex: t },
    );

    fireEvent.change(utils.container.querySelector("#alt")!, { target: { value: "new alt" } });
    fireEvent.submit(utils.container.querySelector("form")!);

    await waitFor(() => expect(convexMutationMock).toHaveBeenCalled());
    // `filename` was never edited, so it is absent from the submitted diff.
    expect(convexMutationMock.mock.calls[0]?.[0]?.data).toEqual({ alt: "new alt" });
  });

  it("does not submit at all when nothing changed", async () => {
    const doc = await t.run((ctx) =>
      ctx.db.insert("media", {
        adapter: "convex",
        alt: "old alt",
        collectionSlug: "images",
        deleted: false,
        filename: "photo.png",
        mimeType: "image/png",
        size: 100,
        src: "https://example.com/photo.png",
        storageId: "s1",
      }),
    );
    const stored = await t.run((ctx) => ctx.db.get(doc));
    const utils = renderView(
      createElement(MediaCollectionEditView, {
        collection: testClientConfig.mediaCollections[0].slug,
        documentId: doc,
        initialData: stored as unknown as VexMediaDocument,
      }),
      { convex: t },
    );

    fireEvent.submit(utils.container.querySelector("form")!);

    // Let the microtask queue drain, so a submit that WAS going to fire has
    // had its chance before asserting it never did.
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(convexMutationMock).not.toHaveBeenCalled();
  });
});

describe("MediaCollectionEditView — document appearing after a missing prefetch", () => {
  const t = convexTest(schema, testModules);

  // Regression: same hook-order hazard as `CollectionEditView` — the view
  // returned "Document not found" before its form hooks.
  it("renders the form without a hook-order error when the client query finds the document", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const doc = await t.run((ctx) =>
      ctx.db.insert("media", {
        adapter: "convex",
        alt: "found alt",
        collectionSlug: "images",
        deleted: false,
        filename: "photo.png",
        mimeType: "image/png",
        size: 100,
        src: "https://example.com/photo.png",
        storageId: "s1",
      }),
    );
    const utils = renderView(
      createElement(MediaCollectionEditView, {
        collection: testClientConfig.mediaCollections[0].slug,
        documentId: doc,
      }),
      { convex: t },
    );

    // No prefetched document: the first render has none, the query then finds it.
    expect(utils.getByText("Document not found.")).toBeInTheDocument();
    await waitFor(() => expect(utils.container.querySelector("#alt")).not.toBeNull());
    expect((utils.container.querySelector("#alt") as HTMLInputElement).value).toBe("found alt");

    const hookErrors = consoleError.mock.calls.filter((call) =>
      call.some((arg) => String(arg).includes("order of Hooks")),
    );
    expect(hookErrors).toEqual([]);
    consoleError.mockRestore();
  });
});
