import { draftMode } from "next/headers"
import { notFound } from "next/navigation"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { vex } from "~/lib/vex"

import PublicPage from "./page"

vi.mock("~/lib/vex", () => ({ vex: { query: vi.fn() } }))
vi.mock("~/lib/metadata", () => ({ generatePageMetadata: vi.fn() }))
vi.mock("~/lib/highlight", () => ({ highlightPageBlocks: vi.fn(async () => ({})) }))
vi.mock("~/lib/iconNodes", () => ({ resolveDocumentIconNodes: vi.fn(async () => ({})) }))
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

beforeEach(() => {
  vexQuery.mockReset()
  draftModeMock.mockReset()
  notFoundMock.mockClear()
})

describe("PublicPage (apps/www [slug] page)", () => {
  it("404s a missing document outside Draft Mode", async () => {
    vexQuery.mockResolvedValue([])
    draftModeMock.mockResolvedValue({ isEnabled: false } as never)

    await expect(PublicPage({ params: Promise.resolve({ slug: "never-published" }) })).rejects.toThrow(
      "NEXT_NOT_FOUND",
    )
    expect(notFound).toHaveBeenCalledOnce()
  })

  it("renders instead of 404ing a never-published document's draft while Draft Mode is enabled", async () => {
    vexQuery.mockResolvedValue([])
    draftModeMock.mockResolvedValue({ isEnabled: true } as never)

    await expect(
      PublicPage({ params: Promise.resolve({ slug: "never-published" }) }),
    ).resolves.toBeTruthy()
    expect(notFound).not.toHaveBeenCalled()
  })

  it("never checks Draft Mode when the published query already found the document", async () => {
    vexQuery.mockResolvedValue([{ _id: "d1", blocks: [], slug: "about" }])

    await expect(PublicPage({ params: Promise.resolve({ slug: "about" }) })).resolves.toBeTruthy()
    expect(draftModeMock).not.toHaveBeenCalled()
    expect(notFound).not.toHaveBeenCalled()
  })
})
