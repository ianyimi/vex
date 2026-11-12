import { createElement, type ReactNode } from "react";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { icons } from "lucide-react";
import { assertHydratesWithoutMismatch } from "../testing/ssrHydration";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeToggle } from "./ThemeToggle";
import { IconComponentsProvider } from "./Icon";

const STORAGE_KEY = "vex-theme";

// `AdminLayout` always wraps the admin shell in `IconComponentsProvider` with lucide's full
// icon set — "so every icon renders in the server HTML" (its own doc comment) — without it,
// `Icon` falls back to an on-demand client import that renders an EMPTY `<svg>` server-side
// regardless of theme, which would make every assertion below about the icon's own SHAPE
// meaningless (both the neutral and resolved icons would be indistinguishable empty `<svg>`s).
function withIcons(children: ReactNode) {
  return createElement(IconComponentsProvider, { icons, children });
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

afterEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

/**
 * Developer-reported bug: a caller with a PERSISTED theme different from
 * `ThemeProvider`'s server-side default (`"system"`) saw a hydration
 * mismatch on `ThemeToggle`'s icon — the server (which can never read
 * `localStorage`) rendered the neutral/system icon, while an EARLIER
 * version of the client's first render picked the icon straight off
 * `theme`, which coincidentally also started at `"system"` server- and
 * client-side (so `theme` itself never actually diverged) — the real risk
 * was gating the icon on anything OTHER than an explicit `mounted` flag,
 * which these tests guard against regressing back into.
 *
 * Developer-CONFIRMED (not just hydration-safe): every `ThemeToggle` — the
 * `<Suspense>` fallback's disabled instance AND the real, no-`disabled`-prop
 * one `AppSidebar` renders — is `"SunMoon"` + disabled on the SERVER (and
 * the client's first render) identically, enabling and switching to the
 * resolved icon only once `mounted` flips. `effectiveDisabled` ORs the
 * caller's own `disabled` prop with `!mounted`, so the REAL toggle (no
 * `disabled` prop passed at all) still starts out disabled.
 */
describe("ThemeToggle — SSR hydration", () => {
  it("hydrates cleanly with a persisted 'dark' theme that differs from the server default", async () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    const element = withIcons(createElement(ThemeProvider, null, createElement(ThemeToggle)));
    await assertHydratesWithoutMismatch(element, async (container) => {
      // Once mounted, the icon catches up to the persisted theme — lucide's "Moon" icon
      // (a single `<path>`, no `<circle>`), not the neutral "SunMoon" the server/first
      // paint used (five `<path>` elements, no `<circle>`) — lucide-react's generated
      // class names aren't reliably present in this test environment, so this checks the
      // SVG's own child shape instead.
      const button = within(container).getByText("Toggle theme").closest("button");
      const svg = button?.querySelector("svg");
      expect(svg?.querySelectorAll("path").length).toBe(1);
      expect(svg?.querySelector("circle")).toBeNull();
    });
  });

  it("hydrates cleanly with a persisted 'light' theme that differs from the server default", async () => {
    localStorage.setItem(STORAGE_KEY, "light");
    const element = withIcons(createElement(ThemeProvider, null, createElement(ThemeToggle)));
    await assertHydratesWithoutMismatch(element, async (container) => {
      // lucide's "Sun" icon: one `<circle>` plus several ray `<path>`s.
      const button = within(container).getByText("Toggle theme").closest("button");
      const svg = button?.querySelector("svg");
      expect(svg?.querySelector("circle")).not.toBeNull();
    });
  });

  it("the disabled skeleton placeholder (AdminSidebarSkeleton's own usage) hydrates cleanly too", async () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    const element = withIcons(
      createElement(ThemeProvider, null, createElement(ThemeToggle, { size: "icon-lg", disabled: true })),
    );
    await assertHydratesWithoutMismatch(element);
  });

  it("the REAL toggle (no disabled prop) renders disabled, with the neutral icon, on the server — identical to the skeleton's", () => {
    localStorage.setItem(STORAGE_KEY, "dark");
    const html = renderToString(
      withIcons(createElement(ThemeProvider, null, createElement(ThemeToggle))),
    );
    expect(html).toContain('aria-disabled="true"');
    expect(html).toMatch(/<button[^>]*\bdisabled=""/);
    // The neutral "SunMoon" icon — five `<path>` elements, no `<circle>` — never the
    // resolved "Moon" (one `<path>`) this persisted-dark theme would otherwise pick.
    expect((html.match(/<path /g) ?? []).length).toBe(5);
    expect(html).not.toContain("<circle");
  });
});
