import { describe, expect, it } from "vitest";
import { DEFAULT_LIVE_PREVIEW_BREAKPOINTS, DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS } from "./constants";
import { resolveLivePreviewSettings } from "./resolveSettings";
import type { LivePreviewConfig } from "./types";

const ROOT_BREAKPOINT = { label: "root", width: 900 };
const OVERRIDE_BREAKPOINT = { label: "override", width: 320 };

function makeConfig(overrides: Partial<LivePreviewConfig> = {}): LivePreviewConfig {
  return {
    allowedOrigins: [],
    breakpoints: DEFAULT_LIVE_PREVIEW_BREAKPOINTS,
    collections: {},
    globals: {},
    ...overrides,
  };
}

describe("resolveLivePreviewSettings", () => {
  it("returns undefined when no layer supplies a url", () => {
    expect(
      resolveLivePreviewSettings({ config: makeConfig(), kind: "collection", slug: "pages" }),
    ).toBeUndefined();
  });

  it("resolves from the root map when the collection declares nothing", () => {
    const settings = resolveLivePreviewSettings({
      config: makeConfig({ collections: { pages: { url: "/root" } } as never }),
      kind: "collection",
      slug: "pages",
    });
    expect(settings?.url).toBe("/root");
  });

  it("lets the collection's own value win over the root entry", () => {
    const settings = resolveLivePreviewSettings({
      config: makeConfig({ collections: { pages: { url: "/root", debounceMs: 900 } } as never }),
      kind: "collection",
      slug: "pages",
      admin: { url: "/own" },
    });
    expect(settings?.url).toBe("/own");
    // Only `url` was overridden, so `debounceMs` still comes from the root entry —
    // the merge is per field, not a whole-object replacement.
    expect(settings?.debounceMs).toBe(900);
  });

  it("inherits the root entry's url when the collection overrides only another field", () => {
    const settings = resolveLivePreviewSettings({
      config: makeConfig({ collections: { pages: { url: "/root" } } as never }),
      kind: "collection",
      slug: "pages",
      admin: { url: undefined as never, defaultOpen: true },
    });
    expect(settings?.url).toBe("/root");
    expect(settings?.defaultOpen).toBe(true);
  });

  it("falls back to root breakpoints, then to the built-in defaults", () => {
    const withRootBreakpoints = resolveLivePreviewSettings({
      config: makeConfig({ breakpoints: [ROOT_BREAKPOINT] }),
      kind: "collection",
      slug: "pages",
      admin: { url: "/" },
    });
    expect(withRootBreakpoints?.breakpoints).toEqual([ROOT_BREAKPOINT]);

    const bare = resolveLivePreviewSettings({
      config: makeConfig(),
      kind: "collection",
      slug: "pages",
      admin: { url: "/" },
    });
    expect(bare?.breakpoints).toEqual(DEFAULT_LIVE_PREVIEW_BREAKPOINTS);
    expect(bare?.debounceMs).toBe(DEFAULT_LIVE_PREVIEW_DEBOUNCE_MS);
    expect(bare?.defaultOpen).toBe(false);
  });

  it("prefers the collection's breakpoints over both the root entry's and the root default", () => {
    const settings = resolveLivePreviewSettings({
      config: makeConfig({
        breakpoints: [ROOT_BREAKPOINT],
        collections: { pages: { url: "/", breakpoints: [ROOT_BREAKPOINT] } } as never,
      }),
      kind: "collection",
      slug: "pages",
      admin: { url: "/", breakpoints: [OVERRIDE_BREAKPOINT] },
    });
    expect(settings?.breakpoints).toEqual([OVERRIDE_BREAKPOINT]);
  });

  it("reads globals from the globals map, never the collections map", () => {
    const config = makeConfig({
      collections: { siteSettings: { url: "/wrong" } } as never,
      globals: { siteSettings: { url: "/right" } } as never,
    });
    expect(
      resolveLivePreviewSettings({ config, kind: "global", slug: "siteSettings" })?.url,
    ).toBe("/right");
    expect(
      resolveLivePreviewSettings({ config, kind: "collection", slug: "siteSettings" })?.url,
    ).toBe("/wrong");
  });
});
