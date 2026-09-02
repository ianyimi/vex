import { describe, it, expect } from "vitest";
import { buildThemeCss } from "./utils";

/** Minimal two-token theme exercising both schemes and both shared fields. */
const THEME = {
  fontFamily: "Inter, sans-serif",
  radius: "4px",
  light: { background: "oklch(96.1% 0 0)", primary: "oklch(60.5% 0.175 42)" },
  dark: { background: "oklch(13.7% 0 0)", primary: "oklch(72% 0.175 50)" },
};

describe("buildThemeCss", () => {
  it("emits site CSS at :root / .dark", () => {
    expect(buildThemeCss({ theme: THEME, scope: "site" })).toBe(
      `:root {
  --background: oklch(96.1% 0 0);
  --primary: oklch(60.5% 0.175 42);
  --radius: 4px;
  --font-sans: Inter, sans-serif;
}

.dark {
  --background: oklch(13.7% 0 0);
  --primary: oklch(72% 0.175 50);
}`,
    );
  });

  it("emits admin CSS one specificity rung higher", () => {
    const css = buildThemeCss({ theme: THEME, scope: "admin" });

    expect(css).toContain(":root:root {");
    expect(css).toContain(".dark:root:root {");
    expect(css).not.toContain(".dark :root");
  });

  it("skips empty and non-string values rather than emitting them", () => {
    const css = buildThemeCss({
      theme: { light: { background: "", primary: 42, accent: "oklch(96% 0.025 42)" } },
      scope: "site",
    });

    expect(css).toBe(`:root {\n  --accent: oklch(96% 0.025 42);\n}`);
  });

  it("returns an empty string for a theme that sets nothing", () => {
    expect(buildThemeCss({ theme: {}, scope: "site" })).toBe("");
    expect(buildThemeCss({ theme: { light: {}, dark: {} }, scope: "admin" })).toBe("");
  });
});
