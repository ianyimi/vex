import { describe, it, expect } from "vitest";
import { generateFormDefaultValues } from "./generateFormDefaultValues";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";
import { date } from "../fields/date";
import { imageUrl } from "../fields/imageUrl";
import { relationship } from "../fields/relationship";
import { json } from "../fields/json";
import { array } from "../fields/array";

describe("generateFormDefaultValues", () => {
  it("returns sensible zero-values for all field types", () => {
    const result = generateFormDefaultValues({
      fields: {
        title: text({ label: "Title", required: true }),
        count: number({ label: "Count" }),
        active: checkbox({ label: "Active" }),
        status: select({
          label: "Status",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
        }),
        createdAt: date({ label: "Created" }),
        avatar: imageUrl({ label: "Avatar" }),
        author: relationship({ to: "users" }),
        meta: json({ label: "Meta" }),
        tags: array({ field: text(), label: "Tags" }),
      },
    });

    expect(result).toEqual({
      title: "",
      count: 0,
      active: false,
      status: "",
      createdAt: 0,
      avatar: "",
      author: "",
      meta: {},
      tags: [],
    });
  });

  it("uses user-provided defaultValue when set", () => {
    const result = generateFormDefaultValues({
      fields: {
        status: select({
          label: "Status",
          options: [
            { label: "Draft", value: "draft" },
            { label: "Published", value: "published" },
          ],
          defaultValue: "draft",
        }),
        title: text({ label: "Title", defaultValue: "Untitled" }),
        count: number({ label: "Count", defaultValue: 42 }),
      },
    });

    expect(result).toEqual({
      status: "draft",
      title: "Untitled",
      count: 42,
    });
  });

  it("skips hidden fields", () => {
    const result = generateFormDefaultValues({
      fields: {
        title: text({ label: "Title" }),
        internal: text({ label: "Internal", admin: { hidden: true } }),
      },
    });

    expect(result).toEqual({ title: "" });
    expect(result).not.toHaveProperty("internal");
  });

  it("returns empty array for hasMany relationship", () => {
    const result = generateFormDefaultValues({
      fields: {
        tags: relationship({ to: "tags", hasMany: true }),
      },
    });

    expect(result).toEqual({ tags: [] });
  });

  it("returns empty array for hasMany select", () => {
    const result = generateFormDefaultValues({
      fields: {
        categories: select({
          labels: { singular: "Category", plural: "Categories" },
          options: [{ label: "A", value: "a" }],
          hasMany: true,
        }),
      },
    });

    expect(result).toEqual({ categories: [] });
  });

  it("handles empty fields record", () => {
    const result = generateFormDefaultValues({ fields: {} });
    expect(result).toEqual({});
  });
});
