---
applies_to: ["packages/core/src/api/**/*.test.ts", "packages/better-auth/src/**/*.test.ts", "packages/file-storage-convex/src/**/*.test.ts"]
---
# Convex Integration Testing (convex-test)

- Setup: import schema + generated API from the package's test fixture dir
  (`src/api/test/convex/`); define an EXPLICIT modules map — convex-test cannot use
  `import.meta.glob` here (`packages/core/src/api/create/server.test.ts:1-10`).
- Environment: `edge-runtime` + inlined convex-test ESM deps
  (`packages/core/vitest.config.ts:6-11`).
- Execution: `const t = convexTest(schema, modules); await t.run(async ctx => { ... })` with
  `ctx.db.insert/get/delete` inside (`create/server.test.ts:14-24`; nested relationships:
  `packages/core/src/api/populate.test.ts:38-58`).
- ID discipline: never assert ID format. Test type/truthiness only:
  `expect(typeof id).toBe("string"); expect(id.length).toBeGreaterThan(0)`.
  (convex-test IDs are `"{random};{tableName}"`; production IDs are opaque base32 — code
  needing a table name uses the split-on-semicolon heuristic with graceful degradation.)
