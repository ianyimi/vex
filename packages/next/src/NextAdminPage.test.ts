import { defineCollection, defineConfig, defineGlobal, text, vexConvexApi } from "@vexcms/core";
import type { VexConfig } from "@vexcms/core";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NextAdminPage } from "./NextAdminPage";

const { fetchQueryMock, notFoundMock } = vi.hoisted(() => ({
  fetchQueryMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("convex/nextjs", () => ({ fetchQuery: fetchQueryMock }));
vi.mock("next/navigation", () => ({ notFound: notFoundMock }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => undefined }),
}));
// The views are client components; these tests only inspect what the server
// page prefetched, so stub them out of the module graph.
vi.mock("@vexcms/react", () => {
  const stub = () => null;
  return {
    CollectionEditView: stub,
    CollectionListView: stub,
    DashboardView: stub,
    GlobalEditView: stub,
    GlobalsListView: stub,
    MediaCollectionEditView: stub,
    MediaCollectionListView: stub,
  };
});

const versionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text() },
  versions: { drafts: true },
});
const plainPages = defineCollection({ slug: "pages", fields: { title: text() } });
const versionedBanner = defineGlobal({
  slug: "banner",
  label: "Banner",
  fields: { message: text() },
  versions: { drafts: true },
});

const config = defineConfig({
  collections: [versionedPosts, plainPages],
  globals: [versionedBanner],
}) as unknown as VexConfig;

async function render(path: string[]) {
  await NextAdminPage({ config, params: Promise.resolve({ path }) });
}

/** The args `NextAdminPage` passed to `fetchQuery` for one endpoint. */
function prefetchArgs(endpoint: unknown) {
  const call = fetchQueryMock.mock.calls.find(([fn]) => fn === endpoint);
  expect(call).toBeDefined();
  return call?.[1];
}

// Hydrated `initialData` seeds the CLIENT's query key, so a prefetch whose args
// differ from the view's own query paints one result and then swaps to another
// (or, for the edit view, rendered "not found" and then crashed on the hook
// count). Each expectation below is the exact args the matching view sends.
describe("NextAdminPage — prefetch args match the view's client query", () => {
  beforeEach(() => {
    fetchQueryMock.mockReset().mockResolvedValue(null);
  });

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

  it("edit page of a versioned global prefetches with drafts: true (GlobalEditView)", async () => {
    await render(["globals", "banner"]);
    expect(prefetchArgs(vexConvexApi.globals.get)).toEqual({ slug: "banner", drafts: true });
  });
});

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
