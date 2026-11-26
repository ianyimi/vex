import { describe, expect, it } from "vitest";
import { text } from "../fields";
import { defineGlobal } from "./config";
import { globalConfigToInterface } from "./interfaceGen";

describe("globalConfigToInterface — nullable", () => {
  it("emits | null for a nullable field", () => {
    const g = defineGlobal({
      slug: "siteSettings",
      label: "Site Settings",
      fields: { tagline: text({ nullable: true }) },
    });
    const output = globalConfigToInterface({ global: g });
    expect(output).toContain("tagline?: string | null");
  });
});
