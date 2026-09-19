import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { defineCollection, text } from "../index";
import { validateFields } from "./validateFields";

const fixtureCtx = {} as GenericMutationCtx<GenericDataModel>;

describe("validateFields", () => {
  it("passes when no field in the key set declares validate()", async () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    await expect(
      validateFields({ collection, doc: { title: "Hi" }, keys: ["title"], ctx: fixtureCtx }),
    ).resolves.toBeUndefined();
  });

  it("rejects when a field's validate() returns a message", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { slug: text({ validate: () => "Slug must be unique." }) },
    });
    await expect(
      validateFields({ collection, doc: { slug: "dup" }, keys: ["slug"], ctx: fixtureCtx }),
    ).rejects.toThrow(ConvexError);
  });

  it("skips a field outside the key set even if it declares validate()", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { slug: text({ validate: () => "should not run" }) },
    });
    await expect(
      validateFields({ collection, doc: { title: "Hi" }, keys: ["title"], ctx: fixtureCtx }),
    ).resolves.toBeUndefined();
  });

  it("awaits an async validate() and passes ctx/doc/fieldKey through", async () => {
    let seen: unknown;
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: text({
          validate: async (props) => {
            seen = props;
          },
        }),
      },
    });
    await validateFields({ collection, doc: { slug: "ok", _id: "abc" }, keys: ["slug"], ctx: fixtureCtx });
    expect(seen).toMatchObject({ value: "ok", fieldKey: "slug", doc: { slug: "ok" } });
  });
});
