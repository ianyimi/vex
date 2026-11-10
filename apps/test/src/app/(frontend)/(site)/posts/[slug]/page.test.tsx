import { fetchQuery } from "convex/nextjs";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getToken } from "~/auth/server";
import { vex } from "~/lib/vex";

import PostPage from "./page";

vi.mock("@convex/_generated/api", () => ({
  api: { posts: { getBySlug: "posts.getBySlug", getBySlugPreview: "posts.getBySlugPreview" } },
}));
vi.mock("~/lib/vex", () => ({ vex: { query: vi.fn() } }));
vi.mock("~/auth/server", () => ({ getToken: vi.fn() }));
vi.mock("convex/nextjs", () => ({ fetchQuery: vi.fn() }));
vi.mock("./PostContent", () => ({ PostContent: () => null }));
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("next/headers", () => ({ draftMode: vi.fn() }));

const vexQuery = vi.mocked(vex.query);
const draftModeMock = vi.mocked(draftMode);
const notFoundMock = vi.mocked(notFound);
const getTokenMock = vi.mocked(getToken);
const fetchQueryMock = vi.mocked(fetchQuery);

/** Finds the `<PostContent>` element's own props inside a `PostPage` return value — either
 * the element directly (published branch) or the second child of the `<>meta, content</>`
 * fragment the Draft Mode branch returns. Casts assigned to named consts, never combined
 * with the member access that reads them: these are React elements this file's own code
 * built a few lines up, not validated external input. */
function postContentProps(element: unknown): Record<string, unknown> {
  const node = element as { props: Record<string, unknown> & { children?: unknown[] } };
  const children = node.props.children;
  if (children === undefined) {
    return node.props;
  }
  const contentNode = children[1] as { props: Record<string, unknown> };
  return contentNode.props;
}

beforeEach(() => {
  vexQuery.mockReset();
  draftModeMock.mockReset();
  notFoundMock.mockClear();
  getTokenMock.mockReset();
  fetchQueryMock.mockReset();
});

describe("PostPage (apps/test posts/[slug] page)", () => {
  it("404s a missing post outside Draft Mode, never calling fetchQuery", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false } as never);
    vexQuery.mockResolvedValue([]);

    await expect(PostPage({ params: Promise.resolve({ slug: "never-published" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    );
    expect(notFound).toHaveBeenCalledOnce();
    expect(fetchQueryMock).not.toHaveBeenCalled();
  });

  it("renders the published post outside Draft Mode without calling fetchQuery", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false } as never);
    vexQuery.mockResolvedValue([{ _id: "p1", slug: "hello-world", title: "Hello" }]);

    const element = await PostPage({ params: Promise.resolve({ slug: "hello-world" }) });
    expect(notFound).not.toHaveBeenCalled();
    expect(fetchQueryMock).not.toHaveBeenCalled();
    expect(postContentProps(element).draftMode).toBeUndefined();
  });

  it("fetches the draft via getBySlugPreview with the editor's token in Draft Mode, skipping the published query and the 404 entirely", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true } as never);
    getTokenMock.mockResolvedValue("editor-token");
    fetchQueryMock.mockResolvedValue([{ _id: "p1", slug: "never-published", title: "Draft" }]);

    const element = await PostPage({ params: Promise.resolve({ slug: "never-published" }) });

    expect(fetchQueryMock).toHaveBeenCalledWith(
      "posts.getBySlugPreview",
      { slug: "never-published" },
      { token: "editor-token" },
    );
    expect(vexQuery).not.toHaveBeenCalled();
    expect(notFound).not.toHaveBeenCalled();
    expect(postContentProps(element).draftMode).toBe(true);
    expect(postContentProps(element).initialData).toEqual([
      { _id: "p1", slug: "never-published", title: "Draft" },
    ]);
  });

  it("emits the `vex-session` meta hint in Draft Mode so convex.tsx's hasSessionHint() sees it before hydration", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true } as never);
    getTokenMock.mockResolvedValue("editor-token");
    fetchQueryMock.mockResolvedValue([]);

    const element = (await PostPage({
      params: Promise.resolve({ slug: "never-published" }),
    })) as { props: { children: unknown[] } };
    const meta = element.props.children[0] as { type: string; props: Record<string, unknown> };

    expect(meta.type).toBe("meta");
    expect(meta.props.name).toBe("vex-session");
  });
});
