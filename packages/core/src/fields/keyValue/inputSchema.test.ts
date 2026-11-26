import { describe, it, expect } from "vitest";
import { keyValue } from "./config";
import { number } from "../number";
import { keyValueFieldToInputSchema } from "./inputSchema";

describe("keyValueFieldToInputSchema", () => {
  it("parses a valid string-keyed record", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.safeParse({ alpha: 1, beta: 2 }).success).toBe(true);
  });

  it("rejects a key starting with an underscore", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.safeParse({ _bad: 1 }).success).toBe(false);
  });

  it("rejects an empty-string key", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.safeParse({ "": 1 }).success).toBe(false);
  });

  it("defaults to {} when the field is optional and the value is undefined", () => {
    const field = keyValue({ value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    expect(schema.parse(undefined)).toEqual({});
  });

  it("rejects a missing value on a required field with a 'required' message", () => {
    const field = keyValue({ required: true, value: number({ required: true }) });
    const schema = keyValueFieldToInputSchema({ field });
    const result = schema.safeParse(undefined);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]!.message).toMatch(/required/i);
    }
  });
});
