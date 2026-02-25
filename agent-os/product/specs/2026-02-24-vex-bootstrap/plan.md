# Plan: Vex CMS Bootstrap

## Goal

Implement the minimum viable Vex CMS setup: config with LSP support → admin dashboard with sidebar.

## Files

| File | Action | Description |
|------|--------|-------------|
| `packages/tsconfig/base.json` | Modify | Fix module resolution for bundler |
| `packages/core/src/types.ts` | Create | All TypeScript type definitions |
| `packages/core/src/index.ts` | Create | Main exports |
| `packages/core/src/config/defineConfig.ts` | Create | Config wrapper function |
| `packages/core/src/config/defineCollection.ts` | Create | Collection definition function |
| `packages/core/src/fields/index.ts` | Create | Field re-exports |
| `packages/core/src/fields/text.ts` | Create | Text field builder |
| `packages/core/src/fields/number.ts` | Create | Number field builder |
| `packages/core/src/fields/checkbox.ts` | Create | Checkbox field builder |
| `packages/core/src/fields/select.ts` | Create | Select field builder |
| `packages/ui/src/index.ts` | Create | UI exports |
| `packages/ui/src/layout/Layout.tsx` | Create | Layout component |
| `packages/ui/src/layout/Header.tsx` | Create | Header component |
| `packages/admin-next/src/index.ts` | Create | Admin-next exports |
| `packages/admin-next/src/components/AdminPage.tsx` | Create | Runtime router |
| `packages/admin-next/src/components/Sidebar.tsx` | Create | Navigation sidebar |
| `packages/admin-next/src/views/DashboardView.tsx` | Create | Dashboard view |
| `packages/admin-next/src/views/NotFoundView.tsx` | Create | 404 view |
| `apps/test-app/vex.config.ts` | Create | Sample config |
| `apps/test-app/src/app/admin/layout.tsx` | Create | Admin layout |
| `apps/test-app/src/app/admin/[[...path]]/page.tsx` | Create | Catch-all route |

## Verification

1. `pnpm build` completes without errors
2. `vex.config.ts` has working IntelliSense
3. `http://localhost:3010/admin` shows dashboard
4. Sidebar shows collections from config
5. Hot-reload works on config changes

## Spec Document

See `bootstrap-spec.md` for full implementation details with code examples.
