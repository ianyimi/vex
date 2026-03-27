---
"@vexcms/admin-next": patch
"@vexcms/better-auth": patch
"@vexcms/cli": patch
"@vexcms/core": patch
"create-vexcms": patch
"@vexcms/file-storage-convex": patch
"@vexcms/richtext": patch
"@vexcms/ui": patch
---

- Fix `hasPermission` returning denied for empty fields array (creating globals with no fields)
- Fix `mergeRolePermissions` treating empty fields as denied instead of falling through to boolean
- Fix `resolvePermissionCheck` returning empty object for empty fields
- Fix `defineAccess` validation warning on `admin` permission key (built-in, not a resource)
- Fix `sanitizeConfigForClient` stripping `access` property (contains functions that can't serialize across RSC boundary)
- Fix auto-generated delete mutations not passing document data to `hasPermission` (dynamic callbacks received undefined)
- Fix auto-generated update mutations not fetching existing document for permission checks
- Fix auto-generated create mutations not passing fields data to `hasPermission`
- Add `VexPlugin` type and plugin execution in `defineConfig`
- Add `buildSiteMetadata` for framework-agnostic SEO metadata merging
- Add `VexGlobal` slug type parameter for defineAccess autocomplete on globals
- Add `admin` permission resource on roles for admin panel access control
- Add `checkAdminAccess` function
- Add `normalizeSlug` pattern (strips leading slashes, treats / and /home as home)

- Fix sidebar hydration mismatch (localStorage read moved to useEffect)
- Add external link button to live preview toolbar

- Fix `useLocalStorage` hydration mismatch (defer localStorage read to useEffect)
- Fix `GlobalEditView` creating documents with empty fields (now uses generateFormDefaultValues)
- Add per-document delete permission check in CollectionsView (greyed out delete button)
- Add duplicate document button to CollectionEditView
- Add globals to dashboard view
- Add "View Site" link on dashboard
- Add server-side prefetch support (initialData props on all views)
- Convert GlobalEditView to TanStack Query

- Fix `convex/tsconfig.json` path aliases being overwritten by Convex during project provisioning (file watcher patches it back)
- Add `ensureSchemaFileExists` placeholder for first-run bootstrap
- Add `patchConvexTsconfig` to ensure ~/\* and @convex/\* aliases exist

- Add marketing-site template (8 blocks, SSR prefetch, ThemeStyle, icon picker, access config)
- Add `convex/tsconfig.json` with path aliases to base template
- Add `culori` and `motion` dependencies to base template
- Add anonymous auth plugin for demo site template
- Fix missing ThemeImport, accordion, colorConvert files in template
- Fix collections index removing site_settings (moved to globals)
- Update admin layout with checkAdminAccess enforcement
- Update proxy.ts and serverUtils.ts for \_\_Secure- cookie prefix
- Remove legacy permissions.ts, replace with defineAccess

- Deploy marketing site with SSR, SEO metadata, theme CSS injection
- Add WelcomePage bootstrap flow (first user promotion)
- Add admin button in header using checkAdminAccess
- Fix vex.config.ts access import path
- Move ThemeStyle to root layout (covers admin + frontend)

- New demo site with anonymous auth, daily reset cron, permissive access
- Protected page deletion (home, features, pricing, roadmap cannot be deleted)
- Reset countdown banner before midnight UTC
- Auto anonymous sign-in on first visit
