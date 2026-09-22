import { ConvexError } from "convex/values";
import { describe, expect, it } from "vitest";
import type { GenericDataModel, GenericMutationCtx } from "convex/server";
import { defineCollection, text } from "../index";
import { validateFields } from "./validateFields";
import type { VexConfig } from "../config";

const fixtureCtx = {} as GenericMutationCtx<GenericDataModel>;

/** `validateFields` only reads `config` to build the `vex` api handed to callbacks. */
const fixtureConfig = { collections: [], globals: [] } as unknown as VexConfig;

describe("validateFields", () => {
  it("passes when no field in the key set declares validate()", async () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    await expect(
      validateFields({ collection, doc: { title: "Hi" }, keys: ["title"], ctx: fixtureCtx, config: fixtureConfig }),
    ).resolves.toBeUndefined();
  });

  it("rejects when a field's validate() throws, attributing the failure to that field", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: text({
          validate: () => {
            throw new Error("Slug must be unique.");
          },
        }),
      },
    });
    await expect(
      validateFields({ collection, doc: { slug: "dup" }, keys: ["slug"], ctx: fixtureCtx, config: fixtureConfig }),
    ).rejects.toMatchObject({
      data: { field: "slug", message: "Slug must be unique." },
    });
  });

  it("preserves a ConvexError's structured data so a project can carry its own codes", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: text({
          validate: () => {
            throw new ConvexError({ message: "Slug taken", code: "SLUG_CONFLICT" });
          },
        }),
      },
    });
    await expect(
      validateFields({ collection, doc: { slug: "dup" }, keys: ["slug"], ctx: fixtureCtx, config: fixtureConfig }),
    ).rejects.toMatchObject({
      data: { field: "slug", message: "Slug taken", code: "SLUG_CONFLICT" },
    });
  });

  it("skips a field outside the key set even if it declares validate()", async () => {
    const collection = defineCollection({
      slug: "posts",
      fields: {
        slug: text({
          validate: () => {
            throw new Error("should not run");
          },
        }),
      },
    });
    await expect(
      validateFields({ collection, doc: { title: "Hi" }, keys: ["title"], ctx: fixtureCtx, config: fixtureConfig }),
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
    await validateFields({ collection, doc: { slug: "ok", _id: "abc" }, keys: ["slug"], ctx: fixtureCtx, config: fixtureConfig });
    expect(seen).toMatchObject({ value: "ok", fieldKey: "slug", doc: { slug: "ok" } });
  });
});
