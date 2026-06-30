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
});
