import { describe, it, expect } from "vitest";
import { relationshipColumnDef } from "./columnDef";
import { relationship } from ".";

describe("relationshipColumnDef", () => {
  it("uses fieldKey as accessorKey", () => {
    const col = relationshipColumnDef({ fieldKey: "author", field: relationship({ to: "users" }) });
    expect(col).toHaveProperty("accessorKey", "author");
  });

  it("uses field.label as header when provided", () => {
    const col = relationshipColumnDef({ fieldKey: "author", field: relationship({ to: "users", label: "Author" }) });
    expect(col).toHaveProperty("header", "Author");
  });

  it("includes relationship metadata", () => {
    const col = relationshipColumnDef({ fieldKey: "author", field: relationship({ to: "users" }) });
    expect(col.meta).toEqual({ type: "relationship", to: "users", align: "left" });
  });
});
