import { describe, it, expect } from "vitest";
import { isMediaCollection } from "./isMediaCollection";
import { defineCollection, defineMediaCollection } from "./defineCollection";
import { text } from "../fields/text";

describe("isMediaCollection", () => {
  const mediaImages = defineMediaCollection({ slug: "images" });
  const mediaDocuments = defineMediaCollection({ slug: "documents" });
  const posts = defineCollection({ slug: "posts",
    fields: { title: text({ required: true, defaultValue: "" }) },
  });

  const config = {
    media: {
      collections: [mediaImages, mediaDocuments],
    },
  };

  const configNoMedia = {};

  it("returns true for a media collection", () => {
    expect(isMediaCollection({ collection: mediaImages, config })).toBe(true);
    expect(isMediaCollection({ collection: mediaDocuments, config })).toBe(true);
  });

  it("returns false for a regular collection", () => {
    expect(isMediaCollection({ collection: posts, config })).toBe(false);
  });

  it("returns false when config has no media", () => {
    expect(
      isMediaCollection({ collection: mediaImages, config: configNoMedia }),
    ).toBe(false);
  });

  it("returns false when media.collections is empty", () => {
    expect(
      isMediaCollection({
        collection: mediaImages,
        config: { media: { collections: [] } },
      }),
    ).toBe(false);
  });
});
