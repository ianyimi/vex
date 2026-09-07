import { describe, expect, test } from "vitest";

import { vexMetadata } from "./vexMetadata";

describe("vexMetadata", () => {
  test("emits openGraph title/description even with no image", () => {
    // The regression this guards: gating the whole `openGraph` block on an
    // image meant a page with none published no `og:title`/`og:description`.
    const metadata = vexMetadata({
      description: "About us.",
      path: "/about",
      siteUrl: "https://example.com",
      title: "About",
    });

    expect(metadata.title).toBe("About");
    expect(metadata.description).toBe("About us.");
    expect(metadata.metadataBase).toEqual(new URL("https://example.com"));
    expect(metadata.alternates).toEqual({ canonical: "/about" });
    expect(metadata.openGraph).toEqual({ description: "About us.", title: "About" });
  });

  test("adds the image to openGraph when imageUrl is set", () => {
    const metadata = vexMetadata({
      description: "About us.",
      imageUrl: "https://example.com/og.png",
      path: "/about",
      siteUrl: "https://example.com",
      title: "About",
    });

    expect(metadata.openGraph).toEqual({
      description: "About us.",
      images: [{ url: "https://example.com/og.png" }],
      title: "About",
    });
  });

  test("treats a blank imageUrl as absent", () => {
    const metadata = vexMetadata({
      imageUrl: "",
      path: "/",
      siteUrl: "https://example.com",
      title: "Home",
    });

    expect(metadata.openGraph).toEqual({ description: undefined, title: "Home" });
  });

  test("canonical is the path, not the absolute url — metadataBase resolves it", () => {
    const metadata = vexMetadata({
      path: "/pricing",
      siteUrl: "https://example.com",
      title: "Pricing",
    });

    expect(metadata.alternates).toEqual({ canonical: "/pricing" });
  });
});
