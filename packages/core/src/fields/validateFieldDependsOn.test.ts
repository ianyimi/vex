import { describe, expect, it } from "vitest";

import { text } from "./text";
import { defineCollection } from "../collections/config";
import { defineGlobal } from "../globals/config";
import { VexConfigError } from "../errors";

describe("defineCollection — dependsOn", () => {
  it("accepts a dependsOn naming another of this collection's own fields", () => {
    expect(() =>
      defineCollection({
        slug: "events",
        fields: {
          startDate: text(),
          endDate: text({ dependsOn: ["startDate"] }),
        },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the field and the unknown dependsOn key", () => {
    expect(() =>
      defineCollection({
        slug: "events",
        fields: {
          startDate: text(),
          endDate: text({ dependsOn: ["nope"] }),
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineCollection: collection "events": field "endDate" declares dependsOn naming "nope", which is not a field of this collection.',
      ),
    );
  });
});

describe("defineGlobal — dependsOn", () => {
  it("accepts a dependsOn naming another of this global's own fields", () => {
    expect(() =>
      defineGlobal({
        slug: "siteSettings",
        label: "Site Settings",
        fields: {
          startDate: text(),
          endDate: text({ dependsOn: ["startDate"] }),
        },
      }),
    ).not.toThrow();
  });

  it("throws VexConfigError naming the field and the unknown dependsOn key", () => {
    expect(() =>
      defineGlobal({
        slug: "siteSettings",
        label: "Site Settings",
        fields: {
          startDate: text(),
          endDate: text({ dependsOn: ["nope"] }),
        },
      }),
    ).toThrow(
      new VexConfigError(
        'defineGlobal: global "siteSettings": field "endDate" declares dependsOn naming "nope", which is not a field of this global.',
      ),
    );
  });
});
