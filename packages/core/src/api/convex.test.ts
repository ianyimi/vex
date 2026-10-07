import type { GenericDataModel, MutationBuilder, QueryBuilder } from "convex/server";
import { describe, expect, test } from "vitest";

import type { VexConfig } from "../config";
import { defineCollection, defineGlobal, text } from "../index";
import { versionsApi } from "./server";

// Mock builders: `versionsApi`'s registration branching doesn't execute the
// handler, so an identity function stands in for Convex's real `query`/
// `mutation` — this tests which keys get registered, not handler behavior
// (that's covered by each operation's own `.server.test.ts`).
const mockQuery = ((def: unknown) => def) as unknown as QueryBuilder<GenericDataModel, "public">;
const mockMutation = ((def: unknown) => def) as unknown as MutationBuilder<
  GenericDataModel,
  "public"
>;

const REGISTERED_OPERATION_NAMES = ["saveDraft", "publish"].sort();

const unversionedPosts = defineCollection({
  slug: "posts",
  fields: { title: text({ required: true }) },
});

const versionedPosts = defineCollection({
  slug: "posts",
  versions: { drafts: true },
  fields: { title: text({ required: true }) },
});

const versionedSiteSettings = defineGlobal({
  slug: "siteSettings",
  label: "Site Settings",
  versions: { drafts: true },
  fields: { siteName: text({ label: "Site Name", required: true }) },
});

describe("versionsApi — conditional registration", () => {
  test("registers nothing for a project with no versioned collection or global", () => {
    const config = { collections: [unversionedPosts], globals: [] } as unknown as VexConfig;
    const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });
    expect(Object.keys(api)).toEqual([]);
  });

  test("registers every bare-named operation when a collection declares versions.drafts", () => {
    const config = { collections: [versionedPosts], globals: [] } as unknown as VexConfig;
    const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });
    expect(Object.keys(api).sort()).toEqual(REGISTERED_OPERATION_NAMES);
  });

  test("registers every operation when only a GLOBAL declares versions.drafts", () => {
    const config = {
      collections: [unversionedPosts],
      globals: [versionedSiteSettings],
    } as unknown as VexConfig;
    const api = versionsApi({ config, query: mockQuery, mutation: mockMutation });
    // The surface doesn't split by resource kind.
    expect(Object.keys(api).sort()).toEqual(REGISTERED_OPERATION_NAMES);
  });
});
