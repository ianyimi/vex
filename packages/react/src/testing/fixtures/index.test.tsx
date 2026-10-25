import { describe, it, expect } from "vitest";
import { ADMIN_FIELDS } from "@vexcms/core";
import { fieldFixtures } from "./index";

describe("field fixture registry", () => {
  it("registers a fixture for every core field type", () => {
    const dataFieldTypes = Object.entries(ADMIN_FIELDS)
      .filter(([, def]) => def.kind === "data")
      .map(([type]) => type)
      .sort();
    expect(Object.keys(fieldFixtures).sort()).toEqual(dataFieldTypes);
  });
});
