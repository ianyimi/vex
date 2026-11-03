import { describe, it, expect } from "vitest";
import { commitTs } from "./config";
import { commitTsFieldToInputSchema } from "./inputSchema";

describe("commitTsFieldToInputSchema", () => {
  it("accepts anything, including undefined", () => {
    const schema = commitTsFieldToInputSchema({ field: commitTs() });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(1234567890).success).toBe(true);
    expect(schema.safeParse("ignored").success).toBe(true);
  });
});
