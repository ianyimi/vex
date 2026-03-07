import { describe, it, expect } from "vitest";
import { relationshipColumnDef } from "./columnDef";
import type { RelationshipFieldMeta } from "../../types";

describe("relationshipColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const meta: RelationshipFieldMeta = { type: "relationship", to: "users" };
    const col = relationshipColumnDef({ fieldKey: "author", meta });
    expect(col).toHaveProperty("accessorKey", "author");
  });

  it("uses meta.label as header when provided", () => {
    const meta: RelationshipFieldMeta = { type: "relationship", to: "users", label: "Author" };
    const col = relationshipColumnDef({ fieldKey: "author", meta });
    expect(col).toHaveProperty("header", "Author");
  });

  it("includes relationship metadata", () => {
    const meta: RelationshipFieldMeta = { type: "relationship", to: "users" };
    const col = relationshipColumnDef({ fieldKey: "author", meta });
    expect(col.meta).toEqual({ type: "relationship", to: "users", align: "left" });
  });
});
