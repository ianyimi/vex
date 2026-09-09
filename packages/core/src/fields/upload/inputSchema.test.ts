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
});
