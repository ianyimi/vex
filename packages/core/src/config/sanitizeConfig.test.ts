import { describe, it, expect } from "vitest";
import { stripNonSerializable, sanitizeConfigForClient } from "./sanitizeConfig";
import { defineConfig, defineCollection } from "../index";
import { text } from "../fields";

// ─── stripNonSerializable ────────────────────────────────────────────────────

describe("stripNonSerializable — primitives", () => {
  it("passes string through", () => {
    expect(stripNonSerializable("hello")).toBe("hello");
  });

  it("passes number through", () => {
    expect(stripNonSerializable(42)).toBe(42);
  });

  it("passes boolean through", () => {
    expect(stripNonSerializable(true)).toBe(true);
    expect(stripNonSerializable(false)).toBe(false);
  });

  it("converts null to null", () => {
    expect(stripNonSerializable(null)).toBeNull();
  });

  it("converts undefined to null", () => {
    expect(stripNonSerializable(undefined)).toBeNull();
  });
});

describe("stripNonSerializable — non-serializable scalars", () => {
  it("replaces functions with null", () => {
    expect(stripNonSerializable(() => "hi")).toBeNull();
    expect(stripNonSerializable(async () => {})).toBeNull();
  });

  it("replaces symbols with null", () => {
    expect(stripNonSerializable(Symbol("id"))).toBeNull();
  });

  it("replaces bigints with null", () => {
    expect(stripNonSerializable(BigInt(9007199254740991))).toBeNull();
  });

  it("replaces class instances with null", () => {
    class Foo {
      value = 1;
    }
    expect(stripNonSerializable(new Foo())).toBeNull();
  });

  it("replaces React-component-shaped functions with null", () => {
    // Simulates a React component (function with displayName)
    function MyComponent() {
      return null;
    }
    MyComponent.displayName = "MyComponent";
    expect(stripNonSerializable(MyComponent)).toBeNull();
  });
});

describe("stripNonSerializable — plain objects", () => {
  it("passes a fully-serializable flat object through unchanged", () => {
    const obj = { a: "hello", b: 42, c: true, d: null };
    expect(stripNonSerializable(obj)).toEqual({ a: "hello", b: 42, c: true, d: null });
  });

  it("strips function values from a plain object", () => {
    const obj = { label: "posts", onClick: () => "clicked", count: 3 };
    expect(stripNonSerializable(obj)).toEqual({ label: "posts", onClick: null, count: 3 });
  });

  it("strips deeply nested functions", () => {
    const obj = {
      admin: {
        icon: "FileText",
        components: {
          Field: () => null,
          Cell: () => null,
        },
        livePreview: {
          url: (doc: { slug: string }) => `/preview/${doc.slug}`,
        },
      },
    };
    expect(stripNonSerializable(obj)).toEqual({
      admin: {
        icon: "FileText",
        components: { Field: null, Cell: null },
        livePreview: { url: null },
      },
    });
  });

  it("strips symbol keys are ignored — only enumerable string keys are processed", () => {
    const sym = Symbol("hidden");
    const obj = { visible: "yes" } as Record<string | symbol, unknown>;
    obj[sym] = "hidden";
    const result = stripNonSerializable(obj) as Record<string, unknown>;
    expect(result["visible"]).toBe("yes");
    expect(result[sym as unknown as string]).toBeUndefined();
  });

  it("handles Object.create(null) plain objects", () => {
    const obj = Object.create(null) as Record<string, unknown>;
    obj["x"] = 1;
    obj["fn"] = () => {};
    expect(stripNonSerializable(obj)).toEqual({ x: 1, fn: null });
  });

  it("replaces class instances inside objects with null", () => {
    class Adapter {
      getUrl() {
        return "url";
      }
    }
    const obj = { adapter: new Adapter(), name: "convex" };
    expect(stripNonSerializable(obj)).toEqual({ adapter: null, name: "convex" });
  });
});

describe("stripNonSerializable — arrays", () => {
  it("passes a serializable array through unchanged", () => {
    expect(stripNonSerializable([1, "two", true, null])).toEqual([1, "two", true, null]);
  });

  it("strips functions inside arrays", () => {
    const arr = ["keep", () => {}, 42];
    expect(stripNonSerializable(arr)).toEqual(["keep", null, 42]);
  });

  it("recursively processes arrays of objects", () => {
    const arr = [
      { slug: "posts", icon: "FileText", render: () => null },
      { slug: "media", icon: "Image", render: () => null },
    ];
    expect(stripNonSerializable(arr)).toEqual([
      { slug: "posts", icon: "FileText", render: null },
      { slug: "media", icon: "Image", render: null },
    ]);
  });

  it("handles nested arrays", () => {
    expect(stripNonSerializable([[1, () => {}], [2, "ok"]])).toEqual([
      [1, null],
      [2, "ok"],
    ]);
  });
});

// ─── sanitizeConfigForClient ─────────────────────────────────────────────────

describe("sanitizeConfigForClient — serializable config passes through", () => {
  it("returns a config with only serializable collection fields intact", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text({ required: true }) },
        }),
      ],
    });
    const client = sanitizeConfigForClient(config);
    expect(client.collections).toHaveLength(1);
    expect(client.collections[0].slug).toBe("posts");
  });
});

describe("sanitizeConfigForClient — strips non-serializable values", () => {
  it("strips a function icon on a collection's admin config", () => {
    const MyIcon = () => null; // simulated React component
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
          // @ts-expect-error — intentionally passing component where string expected to test runtime stripping
          admin: { icon: MyIcon },
        }),
      ],
    });
    const client = sanitizeConfigForClient(config);
    expect((client.collections[0].admin as Record<string, unknown>)["icon"]).toBeNull();
  });

  it("keeps a string icon value unchanged", () => {
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
          // @ts-expect-error — icon not yet typed on rebuild's AdminCollectionConfigInput
          admin: { icon: "FileText" },
        }),
      ],
    });
    const client = sanitizeConfigForClient(config);
    expect((client.collections[0].admin as Record<string, unknown>)["icon"]).toBe("FileText");
  });

  it("strips custom component references from field admin.components", () => {
    const FakeComponent = () => null;
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: {
            title: text({
              admin: {
                // @ts-expect-error — testing runtime stripping of component refs
                components: { Field: FakeComponent },
              },
            }),
          },
        }),
      ],
    });
    const client = sanitizeConfigForClient(config);
    const titleField = (client.collections[0].fields as Record<string, unknown>)[
      "title"
    ] as Record<string, unknown>;
    const fieldAdmin = titleField["admin"] as Record<string, unknown>;
    const components = fieldAdmin["components"] as Record<string, unknown>;
    expect(components["Field"]).toBeNull();
  });

  it("strips functions at arbitrary depths — future fields handled automatically", () => {
    // Simulate a future config field with a deeply nested callback
    const config = defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { title: text() },
        }),
      ],
    });
    // Manually inject a deeply nested function to simulate future additions
    const mutated = {
      ...config,
      future: {
        nested: {
          deepCallback: () => "should be stripped",
          deepValue: "should be kept",
        },
      },
    };
    const client = sanitizeConfigForClient(mutated as typeof config);
    const future = (client as Record<string, unknown>)["future"] as Record<string, unknown>;
    const nested = future["nested"] as Record<string, unknown>;
    expect(nested["deepCallback"]).toBeNull();
    expect(nested["deepValue"]).toBe("should be kept");
  });
});
