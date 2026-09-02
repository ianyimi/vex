import { describe, it, expect } from "vitest";
import { ADMIN_FIELDS } from "@vexcms/core";

import { fieldInputComponents, fieldCellComponents } from "./index";
import { reactAdapter } from "../../adapter";

/**
 * Registry parity.
 *
 * The `Record<AdminFieldType, …>` annotations on the two component maps make a
 * missing key a compile error today, but nothing enforces that at runtime, and
 * `reactAdapter.fields` is guarded only by a code comment saying the two "must
 * be kept in sync". These assertions fail loudly the moment a field type is
 * registered in core without a React component.
 */
describe("react field registries", () => {
  const fieldTypes = Object.keys(ADMIN_FIELDS).sort();

  it("registers an input component for every core field type", () => {
    expect(Object.keys(fieldInputComponents).sort()).toEqual(fieldTypes);
  });

  it("registers a cell component for every core field type", () => {
    expect(Object.keys(fieldCellComponents).sort()).toEqual(fieldTypes);
  });

  it("registers an adapter entry for every core field type", () => {
    expect(Object.keys(reactAdapter.fields).sort()).toEqual(fieldTypes);
  });

  it("gives every adapter entry both an input and a cell", () => {
    for (const [fieldType, slot] of Object.entries(reactAdapter.fields)) {
      expect(slot.input, `${fieldType}.input`).toBeTypeOf("function");
      expect(slot.cell, `${fieldType}.cell`).toBeTypeOf("function");
    }
  });
});