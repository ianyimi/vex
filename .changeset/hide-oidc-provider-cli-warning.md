---
"@vexcms/cli": patch
---

`vex dev`/`vex deploy`/`vex generate` no longer print the `@convex-dev/better-auth`
`"[Deprecation] The \"oidc-provider\" plugin is deprecated..."` warning while loading
`vex.config.server.ts`. Evaluating the config (e.g. via `createAuth()`) triggered the
warning at module-eval time; `loadConfig` now filters that one message around the
`jiti.import()` call, mirroring the existing filter in the templates' `convex/http.ts`.
Every other warning still prints.
