import { describe, it, expect } from "vitest";
import { relationship } from "./config";
import { relationshipFieldToValidator } from "./validator";

describe("relationshipFieldToValidator", () => {
  // Relationship fields always store as v.array(v.id()) regardless of hasMany.
  // hasMany is a UI-only hint — it does not change the Convex schema.

  it("emits v.array(v.id()) for a required reference", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("authors"))',
    );
  });

  it("wraps v.array(v.id()) in v.optional() for an optional reference", () => {
    const field = relationship({
      collection: { slug: "authors" },
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("authors")))',
    );
  });

  it("emits v.array(v.id()) for a required hasMany reference", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("tags"))',
    );
  });

  it("wraps v.array(v.id()) in v.optional() for an optional hasMany reference", () => {
    const field = relationship({
      collection: { slug: "tags" },
      hasMany: true,
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("tags")))',
    );
  });

  it("uses the collection slug verbatim in the validator string", () => {
    const field = relationship({
      collection: { slug: "blog_posts" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.array(v.id("blog_posts"))',
    );
  });

  it("defaults required to false — emits v.optional(v.array(v.id()))", () => {
    const field = relationship({ collection: { slug: "authors" } });
    expect(relationshipFieldToValidator({ field })).toBe(
      'v.optional(v.array(v.id("authors")))',
    );
  });
});

describe("relationshipFieldToValidator — schema override", () => {
  it("emits v.id() for schema.validator 'id'", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "id" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe('v.id("authors")');
  });

  it("wraps v.id() in v.optional() when not required", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "id" },
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe('v.optional(v.id("authors"))');
  });

  it("emits v.string() for schema.validator 'string'", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "string" },
      required: true,
    });
    expect(relationshipFieldToValidator({ field })).toBe("v.string()");
  });

  it("wraps v.string() in v.optional() when not required", () => {
    const field = relationship({
      collection: { slug: "authors" },
      schema: { validator: "string" },
      required: false,
    });
    expect(relationshipFieldToValidator({ field })).toBe("v.optional(v.string())");
  });
});
