import { describe, expect, it } from "vitest";

import { buildThemeInitScript, ThemeScript } from "./ThemeScript";

describe("buildThemeInitScript", () => {
  it("embeds the given storage key into the IIFE source", () => {
    const script = buildThemeInitScript({ storageKey: "my-theme" });
    expect(script).toContain("var storageKey = 'my-theme';");
    expect(script).toContain("document.documentElement.classList.add('dark')");
    expect(script).toContain("document.documentElement.classList.remove('dark')");
  });

  it("defaults the storage key to vex-theme", () => {
    expect(buildThemeInitScript()).toContain("var storageKey = 'vex-theme';");
    expect(buildThemeInitScript({})).toContain("var storageKey = 'vex-theme';");
  });
});

describe("ThemeScript", () => {
  it("renders a script element wrapping buildThemeInitScript's output", () => {
    // A genuine Server Component with no hooks: calling it directly (rather
    // than through a renderer) is a valid, hook-free way to inspect its
    // returned element — see `./resolveIconNodes.test.ts` for the same
    // pattern on its sibling file.
    const element = ThemeScript({ storageKey: "custom-key" });

    expect(element.type).toBe("script");
    expect(element.props.dangerouslySetInnerHTML).toEqual({
      __html: buildThemeInitScript({ storageKey: "custom-key" }),
    });
    expect(element.props.suppressHydrationWarning).toBe(true);
  });

  it("defaults the storage key to vex-theme", () => {
    const element = ThemeScript({});
    expect(element.props.dangerouslySetInnerHTML.__html).toContain("var storageKey = 'vex-theme';");
  });
});
