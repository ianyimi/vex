import { buildThemeCss } from "./utils";

/**
 * Compile-time pin: `buildThemeCss` accepts a CLOSED generated per-collection
 * document (no `[key: string]: unknown` index signature, same shape `vex
 * generate` emits for e.g. `interface Theme extends VexDocumentShape`) with
 * zero cast at the call site.
 *
 * Before this fix, `theme` was typed `Record<string, unknown>` — a closed
 * interface is never assignable to a mapped type like `Record`, even though
 * every one of its properties IS `unknown`-compatible (a real TypeScript
 * quirk, not a soundness gap). Every consumer reading a generated document
 * (`apps/test`/`apps/www`'s `ThemeStyle.tsx`/`ThemeLive.tsx`) needed
 * `theme as Record<string, unknown>` to call this. `theme: object` accepts
 * both the closed generated shape and the open `VexDocument` fallback; the
 * `Record<string, unknown>` cast moved inside `buildThemeCss` itself, where
 * it belongs per P-030.
 *
 * `pnpm typecheck` IS the assertion, no test runner involved.
 */
interface ClosedThemeDocument {
  _id: string;
  _creationTime: number;
  light?: Record<string, unknown>;
  dark?: Record<string, unknown>;
  radius?: string;
}

declare const closedTheme: ClosedThemeDocument;

/** Compile-time pin value — see the file-level comment above. */
export const buildThemeCssAcceptsClosedDocumentPin = buildThemeCss({
  theme: closedTheme,
  scope: "site",
});
