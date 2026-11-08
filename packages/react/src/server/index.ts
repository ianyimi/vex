// The package's SERVER-safe entry — deliberately carries NO `"use client"`
// directive anywhere in its own chain (unlike `src/index.ts`, the main
// barrel, which does — see its own comment for why). Everything exported
// here must stay genuinely server-renderable: no hooks, no browser-only
// APIs, no client state. The dist is one output file per source module
// (`preserveModules`), not a single bundle, but this entry must still never
// import a `"use client"` module, even transitively: Next's production
// build fails the moment a server-rendered tree reaches a client
// component's hook through here. `ThemeScript` is the one UI member (see
// its own doc comment for the exact symptom this split fixes) — a plain
// `<script>`-returning function with zero imports beyond raw JSX.
// `resolveIconNodes` reaches `ui/iconKey.ts`, which is directive-free for
// the same reason.
export * from "./ThemeScript";
export * from "./resolveIconNodes";
