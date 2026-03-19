import { describe, it, expect } from "vitest";
import { ui } from "./config";

// Minimal mock component for testing
const MockComponent = () => null;

describe("ui field factory", () => {
  it("creates a ui field with type 'ui'", () => {
    const field = ui({
      label: "Word Count",
      admin: { components: { Field: MockComponent } },
    });
    expect(field.type).toBe("ui");
    expect(field.label).toBe("Word Count");
    expect(field.admin.components.Field).toBe(MockComponent);
  });

  it("preserves admin config properties", () => {
    const field = ui({
      label: "Stats",
      admin: {
        components: { Field: MockComponent },
        position: "sidebar",
        description: "Some stats",
      },
    });
    expect(field.admin.position).toBe("sidebar");
    expect(field.admin.description).toBe("Some stats");
  });

  it("allows optional label and description", () => {
    const field = ui({
      admin: { components: { Field: MockComponent } },
    });
    expect(field.label).toBeUndefined();
    expect(field.description).toBeUndefined();
  });
});
