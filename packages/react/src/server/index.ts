// The package's SERVER-safe entry — deliberately carries NO `"use client"`
// directive anywhere in its own chain (unlike `src/index.ts`, the main
// barrel, which does — see its own comment for why). Everything exported
// here must stay genuinely server-renderable: no hooks, no browser-only
// APIs, no client state, and — the harder constraint `AdminNotFound`'s own
// round trip through here proved (confirmed by a production build) —
// no import, even transitively, of anything that depends on a
// `createContext`-backed hook: tsup bundles this entry's entire reachable
// graph into ONE output file, so a client component's own `"use client"`
// directive gets flattened away the moment its code is co-bundled here,
// and Next's production build (not `next dev`) fails on the result.
// `ThemeScript` is the one member (see its own doc comment for the exact
// symptom this split fixes) — a plain `<script>`-returning function with
// zero imports beyond raw JSX, nothing left to accidentally co-bundle.
export * from "./ThemeScript";
