import { describe, it, expect } from "vitest";
import { upload } from "./config";
import { uploadFieldToInputSchema } from "./inputSchema";

describe("uploadFieldToInputSchema", () => {
  it("returns z.array for required field", () => {
    const field = upload({ to: "images", required: true });
    const schema = uploadFieldToInputSchema({ field });
    // Upload fields store arrays of media document IDs
    expect(() => schema.parse(["doc_123"])).not.toThrow();
    expect(() => schema.parse(undefined)).toThrow();
  });

  it("returns z.array().optional for optional field", () => {
    const field = upload({ to: "images", required: false });
    const schema = uploadFieldToInputSchema({ field });
    expect(() => schema.parse(["doc_123"])).not.toThrow();
    expect(() => schema.parse(undefined)).not.toThrow();
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = upload({ to: "images", required: true });
    const schema = uploadFieldToInputSchema({ field });

    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects an explicit empty array on a required field", () => {
    const field = upload({ to: "images", required: true });
    const schema = uploadFieldToInputSchema({ field });

    const result = schema.safeParse([]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("enforces min/max file count regardless of required, skipping only an empty/omitted optional value", () => {
    const required = upload({ to: "images", required: true, min: 1, max: 2 });
    const requiredSchema = uploadFieldToInputSchema({ field: required });
    const belowMin = requiredSchema.safeParse([]);
    expect(belowMin.success).toBe(false);
    // Regression: `min` matching the required floor (1) must not make the
    // configured min message unreachable — `[]` merely failing isn't enough;
    // the min-specific message must actually be among the issues.
    if (!belowMin.success) {
      expect(belowMin.error.issues.map((issue) => issue.message)).toContain(
        "At least 1 file required.",
      );
    }
    expect(requiredSchema.safeParse(["doc_1"]).success).toBe(true);
    expect(requiredSchema.safeParse(["doc_1", "doc_2", "doc_3"]).success).toBe(false);

    const optional = upload({ to: "images", min: 2, max: 3 });
    const optionalSchema = uploadFieldToInputSchema({ field: optional });
    // Empty/omitted is fine — the field isn't required.
    expect(optionalSchema.safeParse(undefined).success).toBe(true);
    expect(optionalSchema.safeParse([]).success).toBe(true);
    // Regression: min/max is independent of `required` — a *supplied* value
    // still has to respect the configured file-count bounds.
    expect(optionalSchema.safeParse(["doc_1"]).success).toBe(false);
    expect(optionalSchema.safeParse(["doc_1", "doc_2", "doc_3", "doc_4"]).success).toBe(false);
    expect(optionalSchema.safeParse(["doc_1", "doc_2"]).success).toBe(true);
  });
});
