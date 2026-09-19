import { describe, expect, it } from "vitest";
import type { GenericDataModel } from "convex/server";
import type { VexConfig } from "../config";
import { defineCollection, text } from "../index";
import { createVexMutations } from "./triggers";

const rawBuilder = ((definition: unknown) => definition) as never;

describe("createVexMutations", () => {
  it("returns wrapped mutation and internalMutation builders", () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    const config = { collections: [collection] } as unknown as VexConfig;
    const { mutation, internalMutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    expect(typeof mutation).toBe("function");
    expect(typeof internalMutation).toBe("function");
  });

  it("does not throw for a collection with no afterChange/afterDelete", () => {
    const collection = defineCollection({ slug: "posts", fields: { title: text() } });
    const config = { collections: [collection] } as unknown as VexConfig;
    expect(() =>
      createVexMutations<GenericDataModel>({ config, mutation: rawBuilder, internalMutation: rawBuilder }),
    ).not.toThrow();
  });

  it("does not throw when collections declare afterChange and afterDelete", () => {
    const collection = defineCollection({
      slug: "posts",
      fields: { title: text() },
      hooks: {
        afterChange: () => {},
        afterDelete: () => {},
      },
    });
    const config = { collections: [collection] } as unknown as VexConfig;
    expect(() =>
      createVexMutations<GenericDataModel>({ config, mutation: rawBuilder, internalMutation: rawBuilder }),
    ).not.toThrow();
  });

  it("handles an empty collections list", () => {
    const config = { collections: [] } as unknown as VexConfig;
    const { mutation } = createVexMutations<GenericDataModel>({
      config,
      mutation: rawBuilder,
      internalMutation: rawBuilder,
    });
    expect(typeof mutation).toBe("function");
  });
});
