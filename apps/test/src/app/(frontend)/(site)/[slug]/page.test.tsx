import { fetchQuery } from "convex/nextjs"
import { draftMode } from "next/headers"
import { notFound } from "next/navigation"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { getToken } from "~/auth/server"
import { vex } from "~/lib/vex"

import PublicPage from "./page"

vi.mock("@convex/_generated/api", () => ({
  api: { pages: { getBySlug: "pages.getBySlug", getBySlugPreview: "pages.getBySlugPreview" } },
}))
vi.mock("~/lib/vex", () => ({ vex: { query: vi.fn() } }))
vi.mock("~/lib/metadata", () => ({ generatePageMetadata: vi.fn() }))
vi.mock("~/lib/highlight", () => ({ highlightPageBlocks: vi.fn(async () => ({})) }))
vi.mock("~/lib/iconNodes", () => ({ resolveDocumentIconNodes: vi.fn(async () => ({})) }))
vi.mock("~/auth/server", () => ({ getToken: vi.fn() }))
vi.mock("convex/nextjs", () => ({ fetchQuery: vi.fn() }))
vi.mock("../PageContent", () => ({ PageContent: () => null }))
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))
vi.mock("next/headers", () => ({ draftMode: vi.fn() }))

const vexQuery = vi.mocked(vex.query)
const draftModeMock = vi.mocked(draftMode)
const notFoundMock = vi.mocked(notFound)
const getTokenMock = vi.mocked(getToken)
const fetchQueryMock = vi.mocked(fetchQuery)

/** Finds the `<PageContent>` element's own props inside a `PublicPage` return value — either
 * the element directly (published branch) or the second child of the `<>meta, content</>`
 * fragment the Draft Mode branch returns. Casts assigned to named consts, never combined
 * with the member access that reads them: these are React elements this file's own code
 * built a few lines up, not validated external input. */
function pageContentProps(element: unknown): Record<string, unknown> {
  const node = element as { props: Record<string, unknown> & { children?: unknown[] } }
  const children = node.props.children
  if (children === undefined) {
    return node.props
  }
  const contentNode = children[1] as { props: Record<string, unknown> }
  return contentNode.props
}

beforeEach(() => {
  vexQuery.mockReset()
  draftModeMock.mockReset()
  notFoundMock.mockClear()
  getTokenMock.mockReset()
  fetchQueryMock.mockReset()
})

describe("PublicPage (apps/test [slug] page)", () => {
  it("404s a missing document outside Draft Mode, never calling fetchQuery", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false } as never)
    vexQuery.mockResolvedValue([])

    await expect(PublicPage({ params: Promise.resolve({ slug: "never-published" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    )
    expect(notFound).toHaveBeenCalledOnce()
    expect(fetchQueryMock).not.toHaveBeenCalled()
  })

  it("renders the published document outside Draft Mode without calling fetchQuery", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: false } as never)
    vexQuery.mockResolvedValue([{ _id: "d1", blocks: [], slug: "about" }])

    const element = await PublicPage({ params: Promise.resolve({ slug: "about" }) })
    expect(notFound).not.toHaveBeenCalled()
    expect(fetchQueryMock).not.toHaveBeenCalled()
    expect(pageContentProps(element).draftMode).toBeUndefined()
  })

  it("fetches the draft via getBySlugPreview with the editor's token in Draft Mode, skipping the published query and the 404 entirely", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true } as never)
    getTokenMock.mockResolvedValue("editor-token")
    fetchQueryMock.mockResolvedValue([{ _id: "d1", blocks: [], slug: "never-published" }])

    const element = await PublicPage({ params: Promise.resolve({ slug: "never-published" }) })

    expect(fetchQueryMock).toHaveBeenCalledWith(
      "pages.getBySlugPreview",
      { slug: "never-published" },
      { token: "editor-token" },
    )
    expect(vexQuery).not.toHaveBeenCalled()
    expect(notFound).not.toHaveBeenCalled()
    expect(pageContentProps(element).draftMode).toBe(true)
    expect(pageContentProps(element).initialData).toEqual([
      { _id: "d1", blocks: [], slug: "never-published" },
    ])
  })

  it("emits the `vex-session` meta hint in Draft Mode so convex.tsx's hasSessionHint() sees it before hydration", async () => {
    draftModeMock.mockResolvedValue({ isEnabled: true } as never)
    getTokenMock.mockResolvedValue("editor-token")
    fetchQueryMock.mockResolvedValue([])

    const element = (await PublicPage({
      params: Promise.resolve({ slug: "never-published" }),
    })) as { props: { children: unknown[] } }
    const meta = element.props.children[0] as { type: string; props: Record<string, unknown> }

    expect(meta.type).toBe("meta")
    expect(meta.props.name).toBe("vex-session")
  })
})
