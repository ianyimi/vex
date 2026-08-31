import { describe, it, expect, afterEach } from "vitest";
import { readThemeColorTokens } from "./utils";

function injectStylesheet(props: { css: string }): void {
  const style = document.createElement("style");
  style.setAttribute("data-test-stylesheet", "true");
  style.textContent = props.css;
  document.head.appendChild(style);
}

afterEach(() => {
  for (const el of Array.from(document.querySelectorAll("[data-test-stylesheet]"))) {
    el.remove();
  }
});

describe("readThemeColorTokens", () => {
  it("pairs each token's light and dark declarations", () => {
    injectStylesheet({
      css: `
        :root { --primary: oklch(60.5% 0.175 42); --background: #F5F5F5; }
        .dark { --primary: oklch(72% 0.175 50); }
      `,
    });

    expect(readThemeColorTokens()).toEqual([
      {
        name: "--background",
        reference: "var(--background)",
        lightValue: "#F5F5F5",
        darkValue: null,
      },
      {
        name: "--primary",
        reference: "var(--primary)",
        lightValue: "oklch(60.5% 0.175 42)",
        darkValue: "oklch(72% 0.175 50)",
      },
    ]);
  });

  it("descends into @layer blocks", () => {
    injectStylesheet({ css: `@layer base { :root { --accent: #E8622A; } }` });

    expect(readThemeColorTokens().map((t) => t.name)).toEqual(["--accent"]);
  });

  it("skips non-colour tokens", () => {
    injectStylesheet({
      css: `:root { --primary: #E8622A; --radius: 0.25rem; --font-sans: Geist, sans-serif; }`,
    });

    expect(readThemeColorTokens().map((t) => t.name)).toEqual(["--primary"]);
  });

  it("skips Tailwind's --color-* @theme aliases", () => {
    injectStylesheet({
      css: `:root { --primary: #E8622A; --color-primary: var(--primary); }`,
    });

    expect(readThemeColorTokens().map((t) => t.name)).toEqual(["--primary"]);
  });

  it("ignores Tailwind dark: utility selectors", () => {
    injectStylesheet({
      css: `:root { --primary: #E8622A; } .dark\\:bg-x { --primary: #000000; }`,
    });

    const primary = readThemeColorTokens()[0];
    expect(primary.darkValue).toBeNull();
  });

  it("resolves a token declared as a reference to another token", () => {
    injectStylesheet({
      css: `:root { --brand: #E8622A; --primary: var(--brand); }`,
    });

    const primary = readThemeColorTokens().find((t) => t.name === "--primary");
    expect(primary?.lightValue).toBe("#E8622A");
  });

  it("returns an empty list when no stylesheet declares colour tokens", () => {
    expect(readThemeColorTokens()).toEqual([]);
  });
});