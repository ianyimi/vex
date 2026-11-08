import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

vi.mock("@convex/_generated/api", () => ({
  api: {
    images: { getById: "getById" },
    vex: { media: { getUrl: "getUrl" } },
  },
}))

vi.mock("@convex-dev/react-query", () => ({
  convexQuery: (fn: string) => ({ queryFn: fn }),
}))

const useQueryMock = vi.fn()
vi.mock("@tanstack/react-query", () => ({
  useQuery: (opts: { queryFn: string }) => useQueryMock(opts.queryFn),
}))

import { MediaImage } from "./MediaImage"

function mockQueries(props: {
  doc?: { data?: { alt?: string }; isPending?: boolean }
  url?: { data?: { url?: string }; isPending?: boolean }
}) {
  useQueryMock.mockImplementation((queryFn: string) =>
    queryFn === "getUrl"
      ? { data: props.url?.data, isPending: props.url?.isPending ?? false }
      : { data: props.doc?.data, isPending: props.doc?.isPending ?? false },
  )
}

describe("MediaImage", () => {
  it("renders nothing while the url is still resolving", () => {
    mockQueries({ url: { isPending: true } })

    const { container } = render(<MediaImage alt="" height={20} value="m1" width={96} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing while the alt lookup is pending, even once the url resolves", () => {
    mockQueries({ doc: { isPending: true }, url: { data: { url: "https://example.com/a.png" } } })

    const { container } = render(<MediaImage height={20} value="m1" width={96} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders with the resolved document alt once both queries settle", () => {
    mockQueries({
      doc: { data: { alt: "A real photo" } },
      url: { data: { url: "https://example.com/a.png" } },
    })

    render(<MediaImage height={20} value="m1" width={96} />)

    expect(screen.getByAltText("A real photo")).toBeInTheDocument()
  })

  it("skips the alt lookup and renders immediately when alt is explicitly provided", () => {
    mockQueries({ url: { data: { url: "https://example.com/a.png" } } })

    render(<MediaImage alt="Explicit" height={20} value="m1" width={96} />)

    expect(screen.getByAltText("Explicit")).toBeInTheDocument()
  })
})
