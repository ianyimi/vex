import { describe, it, expect } from "vitest";
import { generateColumns } from "./generateColumns";
import { defineCollection } from "../config/defineCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import { checkbox } from "../fields/checkbox";
import { select } from "../fields/select";

describe("generateColumns", () => {
  it("always includes _id column as first column", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
      },
    });
    const columns = generateColumns(posts);
    expect(columns[0]).toHaveProperty("accessorKey", "_id");
    expect(columns[0]).toHaveProperty("header", "ID");
  });

  it("generates columns for all field types", () => {
    const items = defineCollection("items", {
      fields: {
        name: text({ required: true, label: "Name" }),
        count: number({ label: "Count" }),
        active: checkbox({ label: "Active" }),
        status: select({
          label: "Status",
          required: true,
          options: [
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
          ],
        }),
      },
    });
    const columns = generateColumns(items);

    // _id + 4 fields
    expect(columns).toHaveLength(5);
    expect(columns[1]).toHaveProperty("accessorKey", "name");
    expect(columns[1]).toHaveProperty("header", "Name");
    expect(columns[2]).toHaveProperty("accessorKey", "count");
    expect(columns[3]).toHaveProperty("accessorKey", "active");
    expect(columns[4]).toHaveProperty("accessorKey", "status");
  });

  it("respects defaultColumns — only shows specified fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        slug: text(),
        body: text(),
        featured: checkbox(),
      },
      admin: {
        defaultColumns: ["title", "featured"],
      },
    });
    const columns = generateColumns(posts);

    // _id + title + featured
    expect(columns).toHaveLength(3);
    expect(columns[0]).toHaveProperty("accessorKey", "_id");
    expect(columns[1]).toHaveProperty("accessorKey", "title");
    expect(columns[2]).toHaveProperty("accessorKey", "featured");
  });

  it("skips hidden fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        internalId: text({ admin: { hidden: true } }),
      },
    });
    const columns = generateColumns(posts);

    // _id + title (internalId skipped)
    expect(columns).toHaveLength(2);
    expect(
      columns.find((c: any) => c.accessorKey === "internalId"),
    ).toBeUndefined();
  });

  it("skips defaultColumns entries that reference hidden fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        secret: text({ admin: { hidden: true } }),
      },
      admin: {
        defaultColumns: ["title", "secret"],
      },
    });
    const columns = generateColumns(posts);

    // _id + title (secret is hidden, skipped)
    expect(columns).toHaveLength(2);
  });

  it("produces fallback column for defaultColumns entries referencing non-existent fields", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
      },
      admin: {
        // @ts-expect-error — testing runtime behavior with invalid field key
        defaultColumns: ["title", "nonexistent"],
      },
    });
    const columns = generateColumns(posts);

    // _id + title + nonexistent (fallback column)
    expect(columns).toHaveLength(3);
    expect(columns[2]).toMatchObject({
      accessorKey: "nonexistent",
      header: "Nonexistent",
    });
  });

  it("marks useAsTitle column with meta.isTitle", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
        body: text(),
      },
      admin: {
        useAsTitle: "title",
      },
    });
    const columns = generateColumns(posts);
    const titleCol = columns.find((c: any) => c.accessorKey === "title");

    expect(titleCol).toBeDefined();
    expect(titleCol!.meta).toHaveProperty("isTitle", true);
  });

  it("returns only _id column when fields object is empty", () => {
    const empty = defineCollection("empty", {
      fields: {},
    });
    const columns = generateColumns(empty);
    expect(columns).toHaveLength(1);
    expect(columns[0]).toHaveProperty("accessorKey", "_id");
  });

  it("does not mark any column as isTitle when useAsTitle is not set", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text({ required: true }),
      },
    });
    const columns = generateColumns(posts);
    const withIsTitle = columns.filter((c) => (c.meta as any)?.isTitle);
    expect(withIsTitle).toHaveLength(0);
  });

  it("produces a fallback column for unknown field types", () => {
    const weird = defineCollection("weird", {
      fields: {
        title: text({ required: true }),
        custom: { _type: "", _meta: { type: "json" as any } } as any,
      },
    });
    const columns = generateColumns(weird);

    // _id + title + custom (fallback)
    expect(columns).toHaveLength(3);
    const customCol = columns.find((c: any) => c.accessorKey === "custom");
    expect(customCol).toBeDefined();
    expect(customCol).toHaveProperty("header", "Custom");
  });
});
