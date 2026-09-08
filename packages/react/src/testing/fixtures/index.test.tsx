import { describe, it, expect } from "vitest";
import { ADMIN_FIELDS } from "@vexcms/core";
import { fieldFixtures } from "./index";

describe("field fixture registry", () => {
  it("registers a fixture for every core field type", () => {
    expect(Object.keys(fieldFixtures).sort()).toEqual(Object.keys(ADMIN_FIELDS).sort());
  });
});
