import { describe, expect, it } from "vitest";
import { adminHref } from "./adminHref";
import { MODALS } from "../components/modals/constants";

describe("adminHref", () => {
  it("builds the dashboard URL", () => {
    expect(adminHref({ type: "dashboard" }, "/admin")).toBe("/admin");
  });

  it("builds a collection list URL", () => {
    expect(adminHref({ type: "collection", slug: "posts" }, "/admin")).toBe(
      "/admin/posts",
    );
  });

  it("builds a global edit URL", () => {
    expect(adminHref({ type: "global", slug: "siteSettings" }, "/admin")).toBe(
      "/admin/globals/siteSettings",
    );
  });

  it("builds a document edit URL", () => {
    expect(
      adminHref({ type: "document", slug: "posts", id: "abc123" }, "/admin"),
    ).toBe("/admin/posts/abc123");
  });

  it("builds a create-modal URL, reusing MODALS.createDocument's own urlParam", () => {
    expect(adminHref({ type: "create", slug: "posts" }, "/admin")).toBe(
      `/admin/posts?${MODALS.createDocument.urlParam}=true`,
    );
  });

  it("normalizes a basePath without a leading slash, matching addLeadingSlash", () => {
    expect(adminHref({ type: "collection", slug: "posts" }, "admin")).toBe(
      "/admin/posts",
    );
  });

  it("supports a custom basePath", () => {
    expect(adminHref({ type: "collection", slug: "posts" }, "/cms")).toBe(
      "/cms/posts",
    );
  });
});
