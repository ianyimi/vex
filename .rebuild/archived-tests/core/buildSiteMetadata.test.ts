import { describe, it, expect } from "vitest";
import { buildSiteMetadata } from "./buildSiteMetadata";

describe("buildSiteMetadata", () => {
  const baseSite = {
    name: "Vex CMS",
    metaTitle: "Vex CMS — The CMS for Convex",
    metaDescription: "A headless CMS built on Convex",
    description: "Site description fallback",
    ogImage: "https://vexcms.dev/og.png",
    twitterHandle: "@vexcms",
  };

  it("returns site defaults when no page overrides", () => {
    const result = buildSiteMetadata({ site: baseSite });
    expect(result.title).toBe("Vex CMS — The CMS for Convex");
    expect(result.description).toBe("A headless CMS built on Convex");
    expect(result.ogImage).toBe("https://vexcms.dev/og.png");
    expect(result.twitterHandle).toBe("@vexcms");
  });

  it("page metaTitle overrides site metaTitle", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { metaTitle: "Features — Vex CMS" },
    });
    expect(result.title).toBe("Features — Vex CMS");
  });

  it("page title used as fallback when no metaTitle", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { title: "Features" },
    });
    expect(result.title).toBe("Features");
  });

  it("page metaDescription overrides site", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { metaDescription: "All the features" },
    });
    expect(result.description).toBe("All the features");
  });

  it("page ogImage overrides site", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { ogImage: "https://vexcms.dev/features-og.png" },
    });
    expect(result.ogImage).toBe("https://vexcms.dev/features-og.png");
  });

  it("appends titleSuffix to page title", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { title: "Features" },
      titleSuffix: " | Vex CMS",
    });
    expect(result.title).toBe("Features | Vex CMS");
  });

  it("does not double-append titleSuffix", () => {
    const result = buildSiteMetadata({
      site: baseSite,
      page: { metaTitle: "Features | Vex CMS" },
      titleSuffix: " | Vex CMS",
    });
    expect(result.title).toBe("Features | Vex CMS");
  });

  it("does not append suffix when title equals site name", () => {
    const result = buildSiteMetadata({
      site: { name: "Vex CMS" },
      titleSuffix: " | Vex CMS",
    });
    expect(result.title).toBe("Vex CMS");
  });

  it("handles completely empty inputs", () => {
    const result = buildSiteMetadata({ site: {} });
    expect(result.title).toBe("Untitled");
    expect(result.description).toBe("");
    expect(result.ogImage).toBeUndefined();
    expect(result.twitterHandle).toBeUndefined();
  });

  it("site.description is fallback for metaDescription", () => {
    const result = buildSiteMetadata({
      site: { description: "Fallback desc" },
    });
    expect(result.description).toBe("Fallback desc");
  });

  it("site.name is fallback for metaTitle", () => {
    const result = buildSiteMetadata({
      site: { name: "My Site" },
    });
    expect(result.title).toBe("My Site");
  });
});
