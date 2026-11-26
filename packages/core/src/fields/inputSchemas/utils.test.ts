import { describe, it, expect } from "vitest";
import * as z from "zod";
import { text } from "../text/config";
import { applyBaseInputSchemaMeta } from "./utils";

describe("applyBaseInputSchemaMeta", () => {
  it("accepts a value, rejects null and undefined, on a required non-nullable field", () => {
    const field = text({ required: true });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse("hi").success).toBe(true);
    expect(schema.safeParse(null).success).toBe(false);
    expect(schema.safeParse(undefined).success).toBe(false);
  });

  it("accepts undefined, rejects null, on an optional non-nullable field", () => {
    const field = text({ required: false });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse(undefined).success).toBe(true);
    expect(schema.safeParse(null).success).toBe(false);
  });

  it("accepts null, rejects undefined, on a required nullable field", () => {
    const field = text({ required: true, nullable: true });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse("hi").success).toBe(true);
  });

  it("accepts both null and undefined on an optional nullable field", () => {
    const field = text({ required: false, nullable: true });
    const schema = applyBaseInputSchemaMeta({ field, inputSchema: z.string() });
    expect(schema.safeParse(null).success).toBe(true);
    expect(schema.safeParse(undefined).success).toBe(true);
  });
});
