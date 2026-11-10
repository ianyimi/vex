import { describe, expect, it, vi } from "vitest"

import { vex } from "~/lib/vex"

import { generatePageMetadata, generatePostMetadata } from "./metadata"

vi.mock("~/lib/vex", () => ({ vex: { query: vi.fn() } }))
vi.mock("~/env.mjs", () => ({ env: { NEXT_PUBLIC_SITE_URL: "http://localhost:3030" } }))

const vexQuery = vi.mocked(vex.query)

const settings = {
  description: "Site description",
  metaDescription: "",
  metaTitle: "",
  name: "Vex CMS",
  ogImage: undefined,
  twitterHandle: "",
}

describe("generatePageMetadata", () => {
  it("falls back to settings when no page-level overrides exist", async () => {
    vexQuery.mockResolvedValueOnce(settings).mockResolvedValueOnce([])

    const metadata = await generatePageMetadata({ slug: "about" })

    expect(metadata.title).toBe("Vex CMS | Vex CMS")
    expect(metadata.description).toBe("Site description")
    expect(metadata.alternates).toEqual({ canonical: "/about" })
  })

  it("prefers page-level metaTitle/metaDescription over settings", async () => {
    vexQuery
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce([{ metaDescription: "Page description", metaTitle: "Page title" }])

    const metadata = await generatePageMetadata({ slug: "about" })

    expect(metadata.title).toBe("Page title | Vex CMS")
    expect(metadata.description).toBe("Page description")
  })
})

describe("generatePostMetadata", () => {
  it("builds metadata from the post's title/excerpt with the /posts canonical path", async () => {
    vexQuery
      .mockResolvedValueOnce(settings)
      .mockResolvedValueOnce([{ excerpt: "Post excerpt", slug: "hello-world", title: "Hello World" }])

    const metadata = await generatePostMetadata({ slug: "hello-world" })

    expect(metadata.title).toBe("Hello World | Vex CMS")
    expect(metadata.description).toBe("Post excerpt")
    expect(metadata.alternates).toEqual({ canonical: "/posts/hello-world" })
  })

  it("falls back to the site default title when the post doesn't resolve", async () => {
    vexQuery.mockResolvedValueOnce(settings).mockResolvedValueOnce([])

    const metadata = await generatePostMetadata({ slug: "missing" })

    expect(metadata.title).toBe("Vex CMS | Vex CMS")
    expect(metadata.description).toBeUndefined()
    expect(metadata.alternates).toBeUndefined()
  })

  it("degrades to a bare title when Convex is unreachable", async () => {
    vexQuery.mockRejectedValueOnce(new Error("unreachable"))

    const metadata = await generatePostMetadata({ slug: "hello-world" })

    expect(metadata).toEqual({ title: "Vex CMS" })
  })
})
