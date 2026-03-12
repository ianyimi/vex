import { describe, it, expect } from "vitest";
import { selectColumnDef } from "./columnDef";
import { select } from ".";

describe("selectColumnDef", () => {
  const selectField = select({
    options: [
      { value: "draft", label: "Draft" },
      { value: "published", label: "Published" },
    ],
  });

  it("uses fieldKey as accessorKey", () => {
    const col = selectColumnDef({ fieldKey: "status", field: selectField });
    expect(col).toHaveProperty("accessorKey", "status");
  });

  it("uses field.label as header when provided", () => {
    const field = select({
      options: [
        { value: "draft", label: "Draft" },
        { value: "published", label: "Published" },
      ],
      label: "Post Status",
    });
    const col = selectColumnDef({ fieldKey: "status", field });
    expect(col).toHaveProperty("header", "Post Status");
  });

  it("capitalizes fieldKey as header fallback", () => {
    const col = selectColumnDef({ fieldKey: "status", field: selectField });
    expect(col).toHaveProperty("header", "Status");
  });
});
