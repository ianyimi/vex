import { describe, it, expect } from "vitest";
import { email } from "./config";
import { emailFieldToInputSchema } from "./inputSchema";

describe("emailFieldToInputSchema", () => {
  it("generates required schema — accepts a valid email", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse("a@b.com").success).toBe(true);
  });

  it("generates required schema — rejects a malformed email with a clear format message", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse("nope");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Enter a valid email address.");
    }
  });

  it("generates required schema — rejects non-strings", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse(123).success).toBe(false);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("rejects a missing value on a required field with a 'required' message, not the format message", () => {
    const field = email({ required: true });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("This field is required.");
    }
  });

  it("generates optional schema — accepts undefined and returns the default", () => {
    const field = email({ required: false, defaultValue: "" });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("");
    }
  });

  it("generates optional schema — accepts an empty string without a format error", () => {
    const field = email({ required: false, defaultValue: "" });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse("").success).toBe(true);
  });

  it("still enforces email format on an optional field once a non-empty value is supplied", () => {
    const field = email({ required: false, defaultValue: "" });
    const schema = emailFieldToInputSchema({ field });

    expect(schema.safeParse("nope").success).toBe(false);
    expect(schema.safeParse("a@b.com").success).toBe(true);
  });

  it("applies a min-length constraint with the default value-aware message", () => {
    const field = email({ required: true, min: 10 });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse("a@b.co");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be at least 10 characters.");
    }
    expect(schema.safeParse("abcde@fg.com").success).toBe(true);
  });

  it("applies a max-length constraint with the default value-aware message", () => {
    const field = email({ required: true, max: 12 });
    const schema = emailFieldToInputSchema({ field });

    const result = schema.safeParse("abcdefgh@ij.com");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be no more than 12 characters.");
    }
    expect(schema.safeParse("abcde@fg.com").success).toBe(true);
  });

  it("uses custom [value, error] tuple messages instead of the defaults", () => {
    const field = email({ required: true, min: [10, "Too short!"], max: [12, "Too long!"] });
    const schema = emailFieldToInputSchema({ field });

    const shortResult = schema.safeParse("a@b.co");
    expect(shortResult.success).toBe(false);
    if (!shortResult.success) {
      expect(shortResult.error.issues[0].message).toBe("Too short!");
    }

    const longResult = schema.safeParse("abcdefgh@ij.com");
    expect(longResult.success).toBe(false);
    if (!longResult.success) {
      expect(longResult.error.issues[0].message).toBe("Too long!");
    }
  });

  it("includes metadata (label, description)", () => {
    const field = email({
      required: true,
      label: "Contact Email",
      description: "Primary contact address",
    });
    const schema = emailFieldToInputSchema({ field });

    expect(schema._def).toBeDefined();
  });
});
