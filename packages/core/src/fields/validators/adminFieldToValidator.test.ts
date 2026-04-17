import { describe, it, expect } from "vitest";
import {
  text,
  number,
  checkbox,
  date,
  select,
  defineCollection,
} from "../../index";
import { adminFieldToValidator } from "./index";

const SELECT_OPTIONS = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
];

// ─── text ────────────────────────────────────────────────────────────────────

describe("adminFieldToValidator — text", () => {
  it("dispatches required text → v.string()", () => {
    expect(adminFieldToValidator({ field: text({ required: true }) })).toBe(
      "v.string()",
    );
  });

  it("dispatches optional text → v.optional(v.string())", () => {
    expect(adminFieldToValidator({ field: text({ required: false }) })).toBe(
      "v.optional(v.string())",
    );
  });
});

// ─── number ──────────────────────────────────────────────────────────────────

describe("adminFieldToValidator — number", () => {
  it("dispatches required number → v.number()", () => {
    expect(adminFieldToValidator({ field: number({ required: true }) })).toBe(
      "v.number()",
    );
  });

  it("dispatches optional number → v.optional(v.number())", () => {
    expect(adminFieldToValidator({ field: number({ required: false }) })).toBe(
      "v.optional(v.number())",
    );
  });

  it("ignores min/max constraints — they don't affect the DB schema", () => {
    const field = number({
      required: true,
      min: { value: 0 },
      max: { value: 100 },
    });
    expect(adminFieldToValidator({ field })).toBe("v.number()");
  });
});

// ─── checkbox ────────────────────────────────────────────────────────────────

describe("adminFieldToValidator — checkbox", () => {
  it("dispatches required checkbox → v.boolean()", () => {
    expect(
      adminFieldToValidator({ field: checkbox({ required: true }) }),
    ).toBe("v.boolean()");
  });

  it("dispatches optional checkbox → v.optional(v.boolean())", () => {
    expect(
      adminFieldToValidator({ field: checkbox({ required: false }) }),
    ).toBe("v.optional(v.boolean())");
  });
});

// ─── date ────────────────────────────────────────────────────────────────────

describe("adminFieldToValidator — date", () => {
  it("dispatches required date → v.number() (stored as Unix ms timestamp)", () => {
    expect(adminFieldToValidator({ field: date({ required: true }) })).toBe(
      "v.number()",
    );
  });

  it("dispatches optional date → v.optional(v.number())", () => {
    expect(adminFieldToValidator({ field: date({ required: false }) })).toBe(
      "v.optional(v.number())",
    );
  });
});

// ─── select ──────────────────────────────────────────────────────────────────

describe("adminFieldToValidator — select", () => {
  it("dispatches required select → v.array(v.union(...))", () => {
    const field = select({ required: true, options: SELECT_OPTIONS });
    expect(adminFieldToValidator({ field })).toBe(
      'v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
  });

  it("dispatches optional select → v.optional(v.array(v.union(...)))", () => {
    const field = select({ required: false, options: SELECT_OPTIONS });
    expect(adminFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.union(v.literal("draft"), v.literal("published"))))',
    );
  });

  it("single option produces a single-member union", () => {
    const field = select({
      required: true,
      options: [{ label: "Active", value: "active" }],
    });
    expect(adminFieldToValidator({ field })).toBe(
      'v.array(v.union(v.literal("active")))',
    );
  });
});

// ─── comprehensive ───────────────────────────────────────────────────────────

describe("adminFieldToValidator — comprehensive (all field types)", () => {
  it("produces correct validators for every field type in a single collection", () => {
    const collection = defineCollection({
      slug: "all_fields",
      fields: {
        title: text({ required: true }),
        score: number({ required: true }),
        published: checkbox({ required: true }),
        publishedAt: date({ required: false }),
        status: select({
          required: true,
          options: SELECT_OPTIONS,
        }),
        tags: select({
          required: false,
          hasMany: true,
          options: [
            { label: "News", value: "news" },
            { label: "Tutorial", value: "tutorial" },
          ],
        }),
      },
    });

    const results: Record<string, string> = {};
    for (const [key, field] of Object.entries(collection.fields)) {
      results[key] = adminFieldToValidator({ field });
    }

    expect(results.title).toBe("v.string()");
    expect(results.score).toBe("v.number()");
    expect(results.published).toBe("v.boolean()");
    expect(results.publishedAt).toBe("v.optional(v.number())");
    expect(results.status).toBe(
      'v.array(v.union(v.literal("draft"), v.literal("published")))',
    );
    expect(results.tags).toBe(
      'v.optional(v.array(v.union(v.literal("news"), v.literal("tutorial"))))',
    );
  });
});
