# Vex CMS Bootstrap — Shaping Notes

## Scope

**What we're building**: The minimum viable setup to prove the config → admin UI pipeline works.

A developer should be able to:
1. Create `vex.config.ts` with full IntelliSense
2. Import admin components into their Next.js app
3. See collections from config rendered in the admin sidebar/dashboard

## Decisions

### Field API: Builder Functions

**Decision**: Use `text()`, `number()`, etc. instead of object notation `{ type: 'text' }`

**Why**:
- More composable - can create field presets
- Better tree-shaking - unused fields don't ship
- Matches existing specs (05-schema-field-system-spec.md)
- Type inference is cleaner with function overloads

**PayloadCMS reference**: They use object notation but we're departing from this.

### Config: Sync defineConfig

**Decision**: Sync `defineConfig()` instead of async `buildConfig()`

**Why**:
- Simpler DX
- No async complexity at config time
- Easy to convert later if needed

**What we lose**: Async plugins, dynamic imports at config time. These can be added later.

### Module Resolution: Bundler

**Decision**: Use `"moduleResolution": "bundler"` in base tsconfig

**Why**:
- Allows extensionless imports (`./types` not `./types.js`)
- Standard for tsup-bundled libraries
- Current `NodeNext` setting causes build errors

### Admin UI: Dashboard + Sidebar Only

**Decision**: Minimal UI - just prove routing works

**Why**:
- Faster to verify the pipeline works
- Collection list/edit views require Convex handlers
- Keeps this spec focused

## Context

### PayloadCMS Research

Reviewed PayloadCMS source code:
- `packages/payload/src/config/types.ts` - Main config types
- `packages/payload/src/collections/config/types.ts` - Collection types
- `packages/payload/src/fields/config/types.ts` - Field types

Key patterns adopted:
- `defineConfig({ collections, globals, admin })` structure
- `{ slug, fields, labels, admin }` collection config
- `_docType` for document type inference
- Runtime routing via AdminPage component

Key patterns skipped:
- `buildConfig` async (too complex for now)
- Database adapters (Convex only)
- Import map generation (simpler component resolution)
- Plugin system (future phase)

### Existing Specs Referenced

- **05-schema-field-system-spec.md**: Defines field types, VexField structure
- **vex.config.example.ts**: Target config shape for Phase 1
- **03-admin-shell-spec.md**: Admin UI component structure
- **setup-guide.md**: Existing initial setup guide

## Standards Applied

This spec doesn't introduce new patterns - it implements the foundation defined in existing specs.

## Visuals

None - admin UI will use default Tailwind styling with minimal design.

## References

### PayloadCMS Source
- Config types: https://github.com/payloadcms/payload/blob/main/packages/payload/src/config/types.ts
- Collection types: https://github.com/payloadcms/payload/blob/main/packages/payload/src/collections/config/types.ts

### Existing Vex Specs
- `agent-os/product/05-schema-field-system-spec.md`
- `agent-os/product/vex.config.example.ts`
- `agent-os/product/specs/2026-02-23-initial-project-setup/setup-guide.md`
