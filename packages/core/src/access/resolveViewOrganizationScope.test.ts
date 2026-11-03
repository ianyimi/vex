import { describe, expect, it } from "vitest";
import { defineAccess } from "./config";
import { defineCollection, text } from "../index";
import { isViewOrganizationScopingEnabled, resolveViewOrganizationId } from "./resolveViewOrganizationScope";

const posts = defineCollection({ slug: "posts", fields: { title: text() } });

const scopedAccess = defineAccess({
  roles: ["editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  orgCollectionSlug: "organizations",
  organizations: true,
  permissions: { editor: { posts: { readViews: true } } },
});

const orgCollectionSlugOnlyAccess = defineAccess({
  roles: ["editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  orgCollectionSlug: "organizations",
  // `organizations` deliberately omitted — must default to `false`.
  permissions: { editor: { posts: { readViews: true } } },
});

const noOrgAccess = defineAccess({
  roles: ["editor"] as const,
  resources: [posts],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: { editor: { posts: { readViews: true } } },
});

describe("isViewOrganizationScopingEnabled", () => {
  it("is false when access is undefined", () => {
    expect(isViewOrganizationScopingEnabled(undefined)).toBe(false);
  });

  it("is false when neither orgCollectionSlug nor organizations is set", () => {
    expect(isViewOrganizationScopingEnabled(noOrgAccess)).toBe(false);
  });

  it("is false when orgCollectionSlug is set but organizations is NOT (the apps/test regression — orgCollectionSlug alone never scoped anything)", () => {
    expect(isViewOrganizationScopingEnabled(orgCollectionSlugOnlyAccess)).toBe(false);
  });

  it("is true only when organizations is explicitly true", () => {
    expect(isViewOrganizationScopingEnabled(scopedAccess)).toBe(true);
  });
});

describe("resolveViewOrganizationId", () => {
  it("returns undefined when scoping is disabled, regardless of a present organization", () => {
    expect(
      resolveViewOrganizationId({ access: orgCollectionSlugOnlyAccess, organization: { _id: "org1" } }),
    ).toBeUndefined();
    expect(resolveViewOrganizationId({ access: undefined, organization: { _id: "org1" } })).toBeUndefined();
  });

  it("returns undefined when scoping is enabled but no organization resolves", () => {
    expect(resolveViewOrganizationId({ access: scopedAccess, organization: undefined })).toBeUndefined();
    expect(resolveViewOrganizationId({ access: scopedAccess, organization: {} })).toBeUndefined();
  });

  it("returns the organization's own _id when scoping is enabled and it resolves", () => {
    expect(resolveViewOrganizationId({ access: scopedAccess, organization: { _id: "org1" } })).toBe("org1");
  });
});
