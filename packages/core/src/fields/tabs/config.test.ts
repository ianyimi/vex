import { describe, it, expect } from "vitest";
import { tabs } from "./config";
import { text } from "../text/config";
import { defineCollection } from "../../collections/config";
import { getDataFields } from "../utils";
import type { AdminDataField } from "../types";
import type { DataFieldSlug } from "../conditions";

describe("tabs()", () => {
  it("throws when given no tabs", () => {
    expect(() => tabs({ tabs: [] })).toThrow("tabs(): requires at least one tab");
  });

  it("throws when a tab has no fields", () => {
    expect(() =>
      tabs({ tabs: [{ label: "Content", fields: {} }] }),
    ).toThrow('tabs(): tab "Content" requires at least one field');
  });

  it("keeps the given tabs verbatim on the resolved field", () => {
    const field = tabs({
      tabs: [{ label: "Content", fields: { title: text() } }],
    });
    expect(field.type).toBe("tabs");
    expect(field.tabs[0]?.label).toBe("Content");
  });
});

describe("tabs() key inference", () => {
  it("infers the flattened union of hoisted and named-tab keys and rejects unknown keys", () => {
    const posts = defineCollection({
      slug: "posts",
      fields: {
        info: tabs({
          tabs: [
            { label: "Content", fields: { title: text(), body: text() } },
            { label: "SEO", name: "seo", fields: { metaTitle: text() } },
          ],
        }),
      },
    });

    const dataFields = getDataFields({ fields: posts.fields }) as Record<
      DataFieldSlug<typeof posts.fields>,
      AdminDataField
    >;
    expect(dataFields.title).toBeDefined();
    expect(dataFields.body).toBeDefined();
    expect(dataFields.seo).toBeDefined();
    // @ts-expect-error — "info" (the tabs() field's own key) is never a data key
    expect(dataFields.info).toBeUndefined();
    // @ts-expect-error — "metaTitle" nests under "seo", it isn't hoisted
    expect(dataFields.metaTitle).toBeUndefined();
  });
});
