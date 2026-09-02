import { describe, expect, it } from "vitest";
import { text } from "../fields";
import { defineGlobal } from "./config";

describe("defineGlobal", () => {
  it("applies admin defaults when omitted", () => {
    const g = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { name: text({ label: "Name" }) },
    });
    expect(g.admin.group).toBe("");
    expect(g.admin.description).toBe("");
    expect(g.admin.components).toEqual({});
    expect(g.versions.drafts).toBe(false);
  });

  it("derives interfaceName from slug with Global suffix", () => {
    const g = defineGlobal({ slug: "siteSettings", label: "x", fields: {} });
    expect(g.interfaceName).toBe("SiteSettingsGlobal");
  });

  it("respects user-supplied interfaceName", () => {
    const g = defineGlobal({
      slug: "nav",
      label: "Nav",
      fields: {} as any,
      interfaceName: "NavGlobalConfig",
    });
    expect(g.interfaceName).toBe("NavGlobalConfig");
  });

  it("preserves admin group and description", () => {
    const g = defineGlobal({
      slug: "nav",
      label: "Nav",
      fields: {} as any,
      admin: { group: "Site Builder", description: "Main nav" },
    });
    expect(g.admin.group).toBe("Site Builder");
    expect(g.admin.description).toBe("Main nav");
  });

  it("enables drafts when versions.drafts is true", () => {
    const g = defineGlobal({
      slug: "nav",
      label: "Nav",
      fields: {} as any,
      versions: { drafts: true },
    });
    expect(g.versions.drafts).toBe(true);
  });

  it("throws at runtime when a reserved key is used", () => {
    expect(() =>
      defineGlobal({
        slug: "test",
        label: "Test",
        fields: { _slug: text({ label: "Slug" }) } as any,
      }),
    ).toThrow(/reserved/);
  });
});
