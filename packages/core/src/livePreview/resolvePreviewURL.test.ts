import { describe, it, expect } from "vitest";
import { resolvePreviewURL } from "./resolvePreviewURL";

describe("resolvePreviewURL", () => {
  const doc = { _id: "doc123", slug: "hello-world", title: "Hello" };

  it("returns static URL string as-is", () => {
    const result = resolvePreviewURL({
      config: { url: "/preview/posts" },
      doc,
    });
    expect(result).toBe("/preview/posts");
  });

  it("calls URL function with document data", () => {
    const result = resolvePreviewURL({
      config: { url: (d) => `/preview/posts/${d.slug}` },
      doc,
    });
    expect(result).toBe("/preview/posts/hello-world");
  });

  it("throws when URL function returns empty string", () => {
    expect(() =>
      resolvePreviewURL({
        config: { url: () => "" },
        doc,
      }),
    ).toThrow("empty string");
  });

  it("returns fallbackURL when URL function throws", () => {
    const result = resolvePreviewURL({
      config: {
        url: () => {
          throw new Error("boom");
        },
      },
      doc,
      fallbackURL: "/fallback",
    });
    expect(result).toBe("/fallback");
  });

  it("rethrows when URL function throws and no fallbackURL", () => {
    expect(() =>
      resolvePreviewURL({
        config: {
          url: () => {
            throw new Error("boom");
          },
        },
        doc,
      }),
    ).toThrow("boom");
  });

  it("handles URL function returning undefined", () => {
    expect(() =>
      resolvePreviewURL({
        config: { url: (() => undefined) as any },
        doc,
      }),
    ).toThrow("empty string");
  });
});
