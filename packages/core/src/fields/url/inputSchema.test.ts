import { describe, it, expect } from "vitest";
import { url } from "./config";
import { urlFieldToInputSchema } from "./inputSchema";

describe("urlFieldToInputSchema", () => {
  it("generates required URL schema — accepts valid URLs", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("https://example.com").success).toBe(true);
    expect(schema.safeParse("http://localhost:3000/path?q=1").success).toBe(true);
  });

  it("generates required URL schema — rejects invalid URLs", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("not-a-url").success).toBe(false);
    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("generates optional URL schema — accepts undefined and returns default", () => {
    const field = url({ required: false, defaultValue: "" });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("generates optional URL schema — accepts valid URLs when provided", () => {
    const field = url({ required: false, defaultValue: "" });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("https://example.com").success).toBe(true);
  });

  it("still enforces URL format on an optional field once a non-empty value is supplied", () => {
    // Regression: format/constraint checks are independent of `required` —
    // `required` only governs whether the field may be empty, not whether a
    // *supplied* value must be well-formed.
    const field = url({ required: false, defaultValue: "" });
    const schema = urlFieldToInputSchema({ field });

    expect(schema.safeParse("not-a-url").success).toBe(false);
    expect(schema.safeParse("").success).toBe(true);
    expect(schema.safeParse("https://example.com").success).toBe(true);
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("reports 'required' rather than 'Invalid URL' on an empty required field (CORE-2)", () => {
    const field = url({ required: true });
    const schema = urlFieldToInputSchema({ field });

    const result = schema.safeParse("");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("This field is required.");
    }
  });

  it("includes metadata (label, description)", () => {
    const field = url({
      required: true,
      label: "Website",
      description: "Company website URL",
    });
    const schema = urlFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });

  describe("min/max length constraints", () => {
    it("applies min length constraint", () => {
      const field = url({ required: true, min: 15 });
      const schema = urlFieldToInputSchema({ field });

      expect(schema.safeParse("https://example.com").success).toBe(true);
      expect(schema.safeParse("https://a.co").success).toBe(false);
    });

    it("applies max length constraint", () => {
      const field = url({ required: true, max: 20 });
      const schema = urlFieldToInputSchema({ field });

      expect(schema.safeParse("https://a.co").success).toBe(true);
      expect(schema.safeParse("https://example.com/very/long/path").success).toBe(false);
    });

    it("uses a custom min error message instead of the default when configured", () => {
      const field = url({ required: true, min: [15, "URL is too short."] });
      const schema = urlFieldToInputSchema({ field });

      const result = schema.safeParse("https://a.co");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("URL is too short.");
      }
    });

    it("uses a custom max error message instead of the default when configured", () => {
      const field = url({ required: true, max: [20, "URL is too long."] });
      const schema = urlFieldToInputSchema({ field });

      const result = schema.safeParse("https://example.com/very/long/path");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("URL is too long.");
      }
    });

    it("uses the default min error message when no custom message is configured", () => {
      const field = url({ required: true, min: 15 });
      const schema = urlFieldToInputSchema({ field });

      const result = schema.safeParse("https://a.co");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must be at least 15 characters.");
      }
    });

    it("uses the default max error message when no custom message is configured", () => {
      const field = url({ required: true, max: 20 });
      const schema = urlFieldToInputSchema({ field });

      const result = schema.safeParse("https://example.com/very/long/path");
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Must be no more than 20 characters.");
      }
    });
  });
});
