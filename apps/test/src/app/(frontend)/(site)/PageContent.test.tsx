import { render, screen } from "@testing-library/react"
import type * as VexcmsReactModule from "@vexcms/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { PageContent } from "./PageContent"

vi.mock("@convex/_generated/api", () => ({
  api: { pages: { getBySlug: "pages.getBySlug", getBySlugPreview: "pages.getBySlugPreview" } },
}))
vi.mock("@convex-dev/react-query", () => ({ convexQuery: vi.fn((query: unknown) => ({ query })) }))
vi.mock("~/lib/useSitePreviewMode", () => ({ useSitePreviewMode: vi.fn(() => false) }))
vi.mock("~/components/WelcomePage", () => ({ WelcomePage: () => <div>Welcome</div> }))
vi.mock("~/vexcms/blocks", () => ({ blockComponents: {} }))

const useLivePreviewQueryMock = vi.fn()
vi.mock("@vexcms/react", async (importOriginal) => {
  const actual = await importOriginal<typeof VexcmsReactModule>()
  return {
    ...actual,
    useLivePreviewQuery: (...args: unknown[]) => useLivePreviewQueryMock(...args),
    RenderBlocks: () => <div>blocks</div>,
    IconNodeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }
})

beforeEach(() => {
  useLivePreviewQueryMock.mockReset()
})

describe("PageContent (apps/test)", () => {
  it("falls back to WelcomePage when no page resolves", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: undefined })

    render(<PageContent initialData={[]} slug="never-published" />)

    expect(screen.getByText("Welcome")).toBeInTheDocument()
  })

  it("renders blocks when the query resolves", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: { blocks: [] } })

    render(<PageContent initialData={[]} slug="home" />)

    expect(screen.getByText("blocks")).toBeInTheDocument()
  })

  it("selects the preview query (not the published one) on its first render when the server already rendered it via `draftMode`", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: { blocks: [] } })

    render(<PageContent initialData={[]} slug="never-published" draftMode />)

    const queryOptions = useLivePreviewQueryMock.mock.calls.at(-1)?.[0] as { query: unknown }
    expect(queryOptions.query).toBe("pages.getBySlugPreview")
  })

  it("passes `placeholderData: keepPreviousData` through to `useLivePreviewQuery` so a newly-keyed query keeps the last-shown page instead of flashing WelcomePage while loading", () => {
    useLivePreviewQueryMock.mockReturnValue({ data: { blocks: [] } })

    render(<PageContent initialData={[]} slug="home" />)

    const queryOptions = useLivePreviewQueryMock.mock.calls.at(-1)?.[0] as { placeholderData: unknown }
    expect(typeof queryOptions.placeholderData).toBe("function")
  })
})
