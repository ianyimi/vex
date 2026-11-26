import { describe, it, expect } from "vitest";
import { bytes } from "./config";
import { bytesFieldToInputSchema } from "./inputSchema";

function makeBuffer(byteLength: number): ArrayBuffer {
  return new ArrayBuffer(byteLength);
}

describe("bytesFieldToInputSchema", () => {
  it("accepts an ArrayBuffer within maxSize", () => {
    const field = bytes({ required: false });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse(makeBuffer(10)).success).toBe(true);
  });

  it("accepts a missing value when not required", () => {
    const field = bytes({ required: false });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse(undefined).success).toBe(true);
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = bytes({ required: true });
    const schema = bytesFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/required/i);
    }
  });

  it("rejects a non-ArrayBuffer value", () => {
    const field = bytes({ required: true });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse("not a buffer").success).toBe(false);
  });

  it("rejects an ArrayBuffer larger than maxSize", () => {
    const field = bytes({ required: true, maxSize: 4 });
    const schema = bytesFieldToInputSchema({ field });
    const result = schema.safeParse(makeBuffer(5));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Must be 4 B or smaller.");
    }
  });

  it("accepts an ArrayBuffer exactly at maxSize", () => {
    const field = bytes({ required: true, maxSize: 4 });
    const schema = bytesFieldToInputSchema({ field });
    expect(schema.safeParse(makeBuffer(4)).success).toBe(true);
  });
});
