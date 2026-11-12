import { render, screen } from "@testing-library/react";
import type * as VexcmsReactModule from "@vexcms/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PostContent } from "./PostContent";

vi.mock("@convex/_generated/api", () => ({
  api: { posts: { getBySlug: "posts.getBySlug", getBySlugPreview: "posts.getBySlugPreview" } },
}));
vi.mock("@convex-dev/react-query", () => ({ convexQuery: vi.fn((query: unknown) => ({ query })) }));
vi.mock("@vexcms/richtext-plate/render", () => ({ RichText: () => null }));

const useLivePreviewQueryMock = vi.fn();
vi.mock("@vexcms/react", async (importOriginal) => {
  const actual = await importOriginal<typeof VexcmsReactModule>();
  return { ...actual, useLivePreviewQuery: (...args: unknown[]) => useLivePreviewQueryMock(...args) };
});

beforeEach(() => {
  useLivePreviewQueryMock.mockReset();
});
describe("PostContent (apps/test)", () => {
  it("renders the not-found state instead of a blank page when the post disappears", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: undefined });

    render(<PostContent initialData={[]} slug="vanished" />);

    expect(screen.getByText("Page not found")).toBeInTheDocument();
  });

  it("renders the post when the query resolves", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: { body: [], title: "Hello" } });

    render(<PostContent initialData={[]} slug="hello-world" />);

    expect(screen.getByRole("heading", { name: "Hello" })).toBeInTheDocument();
    expect(screen.queryByText("Page not found")).not.toBeInTheDocument();
  });

  it("selects the preview query (not the published one) on its first render when the server already rendered it via `draftMode`", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: { body: [], title: "Draft" } });

    render(<PostContent initialData={[]} slug="never-published" draftMode />);

    const queryOptions = useLivePreviewQueryMock.mock.calls.at(-1)?.[0] as { query: unknown };
    expect(queryOptions.query).toBe("posts.getBySlugPreview");
  });

  it("passes `placeholderData: keepPreviousData` through to `useLivePreviewQuery` so a newly-keyed query keeps the last-shown post instead of flashing not-found while loading", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: { body: [], title: "Hello" } });

    render(<PostContent initialData={[]} slug="hello-world" />);

    const queryOptions = useLivePreviewQueryMock.mock.calls.at(-1)?.[0] as { placeholderData: unknown };
    expect(typeof queryOptions.placeholderData).toBe("function");
  });
});
