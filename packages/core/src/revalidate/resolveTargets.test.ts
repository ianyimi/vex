import { describe, expect, it } from "vitest";

import { resolveTargets } from "./resolveTargets";
import type { VexRouteMapper } from "../routes";

const aboutPage = { _creationTime: 0, _id: "doc1", slug: "about" };
const companyPage = { _creationTime: 0, _id: "doc1", slug: "company" };
const homePage = { _creationTime: 0, _id: "doc2", slug: "home" };

const pageMap: VexRouteMapper = ({ collection, doc }) => {
  if (collection !== "pages") return [];
  const slug = doc.slug as string;
  return [slug === "home" ? "/" : `/${slug}`];
};

describe("resolveTargets", () => {
  it("create — maps the new document only", () => {
    const result = resolveTargets({
      after: aboutPage,
      collection: "pages",
      map: pageMap,
      operation: "create",
    });
    expect(result).toEqual({ errors: [], paths: ["/about"] });
  });

  it("update without a rename — dedupes to one path", () => {
    const result = resolveTargets({
      after: { ...aboutPage, title: "About us" },
      before: aboutPage,
      collection: "pages",
      map: pageMap,
      operation: "update",
    });
    expect(result).toEqual({ errors: [], paths: ["/about"] });
  });

  it("update with a rename — returns BOTH the old and the new path, old first", () => {
    // Without the old path the pre-rename URL serves stale content forever.
    const result = resolveTargets({
      after: companyPage,
      before: aboutPage,
      collection: "pages",
      map: pageMap,
      operation: "update",
    });
    expect(result).toEqual({ errors: [], paths: ["/about", "/company"] });
  });

  it("delete — maps the old document only", () => {
    const result = resolveTargets({
      before: homePage,
      collection: "pages",
      map: pageMap,
      operation: "delete",
    });
    expect(result).toEqual({ errors: [], paths: ["/"] });
  });

  it("a map throwing on every call — reports errors, never propagates", () => {
    const boom = new Error("boom");
    const throwingMap: VexRouteMapper = () => {
      throw boom;
    };
    const result = resolveTargets({
      after: companyPage,
      before: aboutPage,
      collection: "pages",
      map: throwingMap,
      operation: "update",
    });
    expect(result).toEqual({ errors: [boom, boom], paths: [] });
  });

  it("a map throwing on only one call — keeps the other's paths", () => {
    const boom = new Error("boom on rename");
    const partialMap: VexRouteMapper = ({ doc }) => {
      if (doc.slug === "company") throw boom;
      return [`/${doc.slug as string}`];
    };
    const result = resolveTargets({
      after: companyPage,
      before: aboutPage,
      collection: "pages",
      map: partialMap,
      operation: "update",
    });
    expect(result).toEqual({ errors: [boom], paths: ["/about"] });
  });

  it("a map returning [] contributes nothing and is not an error", () => {
    const result = resolveTargets({
      after: aboutPage,
      collection: "media",
      map: pageMap,
      operation: "create",
    });
    expect(result).toEqual({ errors: [], paths: [] });
  });

  it("both before and after omitted — nothing to call, nothing to purge", () => {
    const result = resolveTargets({
      collection: "pages",
      map: pageMap,
      operation: "update",
    });
    expect(result).toEqual({ errors: [], paths: [] });
  });
});
