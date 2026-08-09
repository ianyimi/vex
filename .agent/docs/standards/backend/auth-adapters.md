---
applies_to: ["packages/better-auth/src/**", "apps/www/convex/auth/**", "apps/www/src/auth/**"]
---
# Better Auth Adapter

- `betterAuthAdapter(props?)` introspects the Better Auth schema via `getAuthTables(config)`
  and converts each table into a Vex `CollectionConfig`; non-user tables get
  `{ protected: true }` (`packages/better-auth/src/adapter.ts:48-82`).
- Field mapping (`betterAuthAttrToVexField`): string→text, boolean→checkbox, date→date.
  System fields get `admin.readOnly: true`; sensitive fields `admin.hidden: true`.
- Better Auth's `modelName` is internal; the Vex config exposes it as `slug`
  (`packages/better-auth/src/adapter.ts:99-107`).
- The Convex DB adapter (`packages/better-auth/src/convex/adapter.ts:12-50`):
  `convexAdapter(ctx, config?)` delegates CRUD through `ctx.runMutation(anyApi.auth.db.dbCreate, ...)`
  with serialized schema JSON; where-clauses are cleaned (Date → timestamp) before sending.
- Host app auth files follow fixed names: `apps/www/src/auth/{client,server,serverUtils,options,permissions}.ts`.
- better-auth peer version rides the catalog (`^1.5.0`) — keep the adapter peer range in
  sync with `pnpm-workspace.yaml#catalog`.
