import { describe, it, expect } from "vitest";
import { checkbox, defineCollection, text } from "../index";
import {
  andFieldConditions,
  getDataFields,
  getFieldsInputSchema,
  getUIFieldsWithCell,
  hasFieldConditions,
  isFieldConditionMet,
  resolveFieldComponents,
  resolveFieldLimit,
  resolveRowWidths,
} from "./utils";
import { tabs } from "./ui/tabs/config";
import { collapsible } from "./ui/collapsible/config";
import { row } from "./ui/row/config";
import { ui } from "./ui/ui/config";
import { group } from "./group/config";
import { array } from "./array/config";
import { blocks, defineBlock } from "./blocks/config";

describe("resolveFieldLimit", () => {
  it("returns undefined when limit is undefined", () => {
    expect(
      resolveFieldLimit({ limit: undefined, defaultError: () => "Too short." }),
    ).toBeUndefined();
  });

  it("pairs a bare number with the default error message", () => {
    expect(resolveFieldLimit({ limit: 3, defaultError: () => "Too short." })).toEqual([
      3,
      "Too short.",
    ]);
  });

  it("passes the resolved value into defaultError", () => {
    expect(
      resolveFieldLimit({
        limit: 5,
        defaultError: (value) => `At least ${value} required.`,
      }),
    ).toEqual([5, "At least 5 required."]);
  });

  it("returns a [value, error] tuple input unchanged", () => {
    expect(
      resolveFieldLimit({
        limit: [3, "Need 3+ chars."],
        defaultError: () => "Too short.",
      }),
    ).toEqual([3, "Need 3+ chars."]);
  });

  it("does not call defaultError for a tuple input", () => {
    let called = false;
    resolveFieldLimit({
      limit: [3, "Need 3+ chars."],
      defaultError: () => {
        called = true;
        return "Too short.";
      },
    });
    expect(called).toBe(false);
  });
});

describe("resolveFieldComponents", () => {
  it("defaults every list to [] when components is omitted", () => {
    const resolved = resolveFieldComponents({});
    expect(resolved).toEqual({
      Input: [],
      Cell: [],
      Label: [],
      Description: [],
      beforeInput: [],
      afterInput: [],
    });
  });

  it("resolves a field's own beforeInput order", () => {
    const comp = () => null;
    const resolved = resolveFieldComponents({
      components: {
        beforeInput: [
          { id: "b", component: comp, order: 1 },
          { id: "a", component: comp, order: 0 },
        ],
      },
    });
    expect(resolved.beforeInput.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("propagates a duplicate-id error from the field's own Input chain", () => {
    const comp = () => null;
    expect(() =>
      resolveFieldComponents({
        components: {
          Input: [
            { id: "x", component: comp },
            { id: "x", component: comp },
          ],
        },
      }),
    ).toThrow();
  });
});

describe("getFieldsInputSchema — admin.condition (data-aware schema)", () => {
  it("keeps a condition-hidden required field out of the required check, still accepting its value", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        showSecret: checkbox(),
        secret: text({
          required: true,
          admin: {
            condition: ({ siblingData }) => siblingData.showSecret === true,
          },
        }),
      },
    });
    const schema = getFieldsInputSchema({
      fields: collection.fields,
      data: { showSecret: false },
    });
    expect(schema.safeParse({ showSecret: false }).success).toBe(true);
  });

  it("still fails a visible condition-gated required field, naming it in the issue path", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        showSecret: checkbox(),
        secret: text({
          required: true,
          admin: {
            condition: ({ siblingData }) => siblingData.showSecret === true,
          },
        }),
      },
    });
    const schema = getFieldsInputSchema({
      fields: collection.fields,
      data: { showSecret: true },
    });
    const result = schema.safeParse({ showSecret: true });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "secret")).toBe(true);
    }
  });

  it("treats a throwing condition as met — fails visible, never silently skips validation", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        secret: text({
          required: true,
          admin: {
            condition: () => {
              throw new Error("boom");
            },
          },
        }),
      },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields, data: {} });
    expect(schema.safeParse({}).success).toBe(false);
  });

  it("without `data`, behaves exactly as before — every field validated regardless of its condition", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        secret: text({ required: true, admin: { condition: () => false } }),
      },
    });
    const schema = getFieldsInputSchema({ fields: collection.fields });
    expect(schema.safeParse({}).success).toBe(false);
  });
});


describe("isFieldConditionMet", () => {
  const siblingData = {};

  it("returns true when no condition is set", () => {
    expect(isFieldConditionMet({ field: text(), data: {}, siblingData })).toBe(true);
  });

  it("evaluates the condition function against data", () => {
    const field = text({ admin: { condition: ({ data }) => typeof data === "object" && data !== null && "published" in data && data.published === true } });
    expect(isFieldConditionMet({ field, data: { published: true }, siblingData })).toBe(true);
    expect(isFieldConditionMet({ field, data: { published: false }, siblingData })).toBe(false);
  });

  it("treats a throwing condition as met", () => {
    const field = text({
      admin: {
        condition: () => {
          throw new Error("boom");
        },
      },
    });
    expect(isFieldConditionMet({ field, data: {}, siblingData })).toBe(true);
  });
});

describe("andFieldConditions", () => {
  const data = {};
  const siblingData = {};

  it("returns undefined when no conditions are defined", () => {
    expect(andFieldConditions({ conditions: [undefined, undefined] })).toBeUndefined();
  });

  it("ANDs every defined condition", () => {
    const condition = andFieldConditions({ conditions: [undefined, () => true, () => false] });
    expect(condition?.({ data, siblingData })).toBe(false);
  });

  it("treats a throwing condition as met", () => {
    const condition = andFieldConditions({
      conditions: [
        () => {
          throw new Error("boom");
        },
        () => true,
      ],
    });
    expect(condition?.({ data, siblingData })).toBe(true);
  });
});

describe("hasFieldConditions", () => {
  it("is false for fields without any condition", () => {
    expect(hasFieldConditions({ fields: { title: text() } })).toBe(false);
  });

  it("is true when a top-level field has a condition", () => {
    expect(
      hasFieldConditions({ fields: { title: text({ admin: { condition: () => true } }) } }),
    ).toBe(true);
  });

  it("recurses into group sub-fields", () => {
    const fields = {
      seo: group({ fields: { title: text({ admin: { condition: () => true } }) } }),
    };
    expect(hasFieldConditions({ fields })).toBe(true);
  });

  it("recurses into array items", () => {
    const fields = { tags: array({ items: text({ admin: { condition: () => true } }) }) };
    expect(hasFieldConditions({ fields })).toBe(true);
  });

  it("recurses into block fields", () => {
    const heroBlock = defineBlock({
      slug: "hero",
      label: "Hero",
      fields: { headline: text({ admin: { condition: () => true } }) },
    });
    const fields = { body: blocks({ blocks: [heroBlock] }) };
    expect(hasFieldConditions({ fields })).toBe(true);
  });
});

describe("resolveRowWidths", () => {
  it("uses declared percent widths that already sum to 100", () => {
    expect(resolveRowWidths({ widths: ["30%", "70%"] })).toEqual(["30%", "70%"]);
  });

  it("tolerates a ±0.5 rounding slop", () => {
    expect(resolveRowWidths({ widths: ["33.4%", "33.4%", "33.5%"] })).toEqual([
      "33.4%",
      "33.4%",
      "33.5%",
    ]);
  });

  it("falls back to an equal share when a width is not a percent", () => {
    expect(resolveRowWidths({ widths: ["240px", "100%"] })).toEqual(["50%", "50%"]);
  });

  it("falls back to an equal share when percents don't sum to 100", () => {
    expect(resolveRowWidths({ widths: ["10%", "10%", "10%"] })).toEqual([
      "33.33%",
      "33.33%",
      "33.33%",
    ]);
  });
});

describe("getDataFields", () => {
  it("passes data fields through unchanged (no condition anywhere)", () => {
    const fields = { title: text(), published: checkbox() };
    const result = getDataFields({ fields });
    expect(Object.keys(result)).toEqual(["title", "published"]);
    expect(result.title?.admin.condition).toBeUndefined();
  });

  it("drops a ui() field entirely", () => {
    const Field = () => null;
    const fields = { title: text(), helper: ui({ admin: { components: { Field } } }) };
    expect(Object.keys(getDataFields({ fields }))).toEqual(["title"]);
  });

  it("hoists an unnamed tab's fields to the parent level", () => {
    const fields = {
      info: tabs({ tabs: [{ label: "Content", fields: { title: text(), body: text() } }] }),
    };
    expect(Object.keys(getDataFields({ fields }))).toEqual(["title", "body"]);
  });

  it("nests a named tab's fields as one group-shaped data field under its name", () => {
    const fields = {
      info: tabs({
        tabs: [{ label: "SEO", name: "seo", fields: { metaTitle: text() } }],
      }),
    };
    const result = getDataFields({ fields });
    expect(Object.keys(result)).toEqual(["seo"]);
    expect(result.seo?.type).toBe("group");
    expect((result.seo as { fields: Record<string, unknown> }).fields.metaTitle).toBeDefined();
  });

  it("hoists row() and collapsible() fields the same way", () => {
    const fields = {
      name: row({ fields: { first: text(), last: text() } }),
      seo: collapsible({ label: "SEO", fields: { metaTitle: text() } }),
    };
    expect(Object.keys(getDataFields({ fields }))).toEqual(["first", "last", "metaTitle"]);
  });

  it("ANDs a tabs()/row()/collapsible() condition into every field it flattens", () => {
    const fields = {
      info: tabs({
        tabs: [{ label: "Content", fields: { title: text() } }],
        admin: { condition: () => false },
      }),
    };
    const result = getDataFields({ fields });
    expect(result.title?.admin.condition?.({ data: {}, siblingData: {} })).toBe(false);
  });

  it("ANDs a per-tab condition on top of the tabs() field's own condition", () => {
    const fields = {
      info: tabs({
        tabs: [
          {
            label: "Content",
            fields: { title: text() },
            admin: { condition: ({ data }) => typeof data === "object" && data !== null && "published" in data && data.published === true },
          },
        ],
      }),
    };
    const result = getDataFields({ fields });
    expect(result.title?.admin.condition?.({ data: { published: false }, siblingData: {} })).toBe(
      false,
    );
    expect(result.title?.admin.condition?.({ data: { published: true }, siblingData: {} })).toBe(
      true,
    );
  });

  it("recursively hoists an unnamed tab nested inside a row", () => {
    const fields = {
      info: tabs({
        tabs: [{ label: "Content", fields: { row: row({ fields: { a: text(), b: text() } }) } }],
      }),
    };
    expect(Object.keys(getDataFields({ fields }))).toEqual(["a", "b"]);
  });

  it("throws on a duplicate flattened key between a hoisted field and a sibling", () => {
    const fields = {
      title: text(),
      info: tabs({ tabs: [{ label: "Content", fields: { title: text() } }] }),
    };
    expect(() => getDataFields({ fields })).toThrow('getDataFields(): duplicate field key "title"');
  });

  it("throws when two named tabs share a name", () => {
    const fields = {
      info: tabs({
        tabs: [
          { label: "SEO", name: "seo", fields: { a: text() } },
          { label: "SEO 2", name: "seo", fields: { b: text() } },
        ],
      }),
    };
    expect(() => getDataFields({ fields })).toThrow('getDataFields(): duplicate field key "seo"');
  });


  it("throws on a duplicate flattened key between a hoisted field and a sibling inside a tab nested inside a row", () => {
    const fields = {
      a: text(),
      info: tabs({
        tabs: [{ label: "Content", fields: { layout: row({ fields: { a: text() } }) } }],
      }),
    };
    expect(() => getDataFields({ fields })).toThrow('getDataFields(): duplicate field key "a"');
  });

  it("flattens a tabs() field nested inside a group's own fields (array-of-group items), when group() is constructed", () => {
    const itemsGroup = group({
      label: "Stat",
      fields: {
        info: tabs({ tabs: [{ label: "Content", fields: { value: text(), caption: text() } }] }),
      },
    });
    const fields = {
      stats: array({ label: "Stats", items: itemsGroup }),
    };
    const result = getDataFields({ fields });
    expect(Object.keys(result)).toEqual(["stats"]);
    const itemFields = getDataFields({ fields: itemsGroup.fields });
    expect(Object.keys(itemFields)).toEqual(["value", "caption"]);
  });

  it("flattens a collapsible() field nested inside a block's own fields, when defineBlock() is constructed", () => {
    const block = defineBlock({
      slug: "stat",
      label: "Stat",
      fields: {
        details: collapsible({ label: "Details", fields: { value: text(), caption: text() } }),
      },
    });
    const result = getDataFields({ fields: block.fields });
    expect(Object.keys(result)).toEqual(["value", "caption"]);
  });

  it("throws on a duplicate flattened key between two tabs inside a block's own fields", () => {
    expect(() =>
      defineBlock({
        slug: "dup",
        label: "Dup",
        fields: {
          info: tabs({
            tabs: [
              { label: "A", fields: { value: text() } },
              { label: "B", fields: { value: text() } },
            ],
          }),
        },
      }),
  ).toThrow('getDataFields(): duplicate field key "value"');
  });
});

describe("getUIFieldsWithCell", () => {
  it("drops a ui() field with no Cell component", () => {
    const fields = { helper: ui({ admin: { components: { Field: () => null } } }) };
    expect(Object.keys(getUIFieldsWithCell({ fields }))).toEqual([]);
  });

  it("collects a top-level ui() field whose admin.components.Cell is set", () => {
    const Field = () => null;
    const Cell = () => null;
    const fields = { wordCount: ui({ admin: { components: { Field, Cell } } }) };
    const result = getUIFieldsWithCell({ fields });
    expect(Object.keys(result)).toEqual(["wordCount"]);
    expect(result.wordCount?.admin.components.Cell).toBe(Cell);
  });

  it("hoists a ui() field with Cell out of an unnamed tab/row/collapsible, unprefixed", () => {
    const Cell = () => null;
    const fields = {
      info: tabs({
        tabs: [
          {
            label: "Content",
            fields: {
              layout: row({
                fields: {
                  details: collapsible({
                    label: "Details",
                    fields: { wordCount: ui({ admin: { components: { Field: () => null, Cell } } }) },
                  }),
                },
              }),
            },
          },
        ],
      }),
    };
    expect(Object.keys(getUIFieldsWithCell({ fields }))).toEqual(["wordCount"]);
  });

  it("keys a named tab's ui() field with Cell as '<tabName>.<key>'", () => {
    const Cell = () => null;
    const fields = {
      info: tabs({
        tabs: [
          { label: "SEO", name: "seo", fields: { wordCount: ui({ admin: { components: { Field: () => null, Cell } } }) } },
        ],
      }),
    };
    expect(Object.keys(getUIFieldsWithCell({ fields }))).toEqual(["seo.wordCount"]);
  });

  it("does not descend into a group()/array()/blocks() field's own sub-fields", () => {
    const Cell = () => null;
    const fields = {
      seo: group({
        label: "SEO",
        fields: { wordCount: ui({ admin: { components: { Field: () => null, Cell } } }) },
      }),
    };
    expect(Object.keys(getUIFieldsWithCell({ fields }))).toEqual([]);
  });
});
