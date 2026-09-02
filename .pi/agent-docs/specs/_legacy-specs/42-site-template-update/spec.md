# 42 — Site Template Update

## Overview

Sync the `create-cli` marketing-site template with the www app's current patterns. This brings all 8 blocks, SSR prefetch, ThemeStyle, icon picker, access enforcement, public queries, and the full collection/globals setup into the template. The base-nextjs template already has the access config — no changes needed there.

## Design Decisions

- **Copy everything except seed data** — block definitions ship with generic `defaultValue` content (not vexcms-specific marketing copy). No `convex/seed.ts`.
- **Block default values are generic** — e.g. "Your Heading Here" instead of "The CMS built for Convex". Users customize via the admin panel.
- **base-nextjs template unchanged** — it already has access config, and SSR prefetch doesn't apply without preset collections.
- **marketing-site template overlays base-nextjs** — only files that differ from base are included.

## Out of Scope

- New blocks or features
- SEO metadata (Spec 41 handles that)
- Documentation
- Changes to base-nextjs template

## What Needs to Be Copied/Updated

This is a file sync operation. Each step lists the files to copy from `apps/www/` to `packages/create-cli/templates/marketing-site/`, with notes on what to change (genericize content).

## Implementation Order

1. **Step 1: Block system files** — constants, config, index, all 8 block directories
2. **Step 2: Components** — IconPickerField, ThemeStyle, ThemeInjector, SiteHeader, SiteFooter, PageContent, PreviewPageContent, motion-primitives
3. **Step 3: Convex public queries** — headers.ts, footers.ts, theme.ts
4. **Step 4: Page routes** — layout, page, [slug], preview layout + page
5. **Step 5: Collections, globals, access, vex.config** — full collection setup
6. **Step 6: Verify build**

---

## Step 1: Block system files

- [ ] Copy `src/vexcms/blocks/constants.ts` (all 8 slugs)
- [ ] Copy `src/vexcms/blocks/config.ts` (pageBlocks array with all 8)
- [ ] Copy `src/vexcms/blocks/index.ts` (blockComponents map)
- [ ] Copy `src/vexcms/blocks/Hero/` directory (config.ts + index.tsx)
- [ ] Copy `src/vexcms/blocks/Features/` directory
- [ ] Copy `src/vexcms/blocks/CTA/` directory
- [ ] Copy `src/vexcms/blocks/FAQ/` directory
- [ ] Copy `src/vexcms/blocks/Header/` directory
- [ ] Copy `src/vexcms/blocks/Footer/` directory
- [ ] Copy `src/vexcms/blocks/HowItWorks/` directory
- [ ] Copy `src/vexcms/blocks/Roadmap/` directory

**Genericize default values** in each block config:

| Block | Change |
|-------|--------|
| Hero | heading: "Welcome to Your Site", subheading: generic, CTAs: generic hrefs |
| Features | heading: "Features", items: generic feature names |
| CTA | heading: "Get Started Today" |
| FAQ | heading: "FAQ", items: generic questions |
| Header | menuItems: Features, FAQ, Docs. actionButtons: generic |
| Footer | links: generic, socialLinks: generic |
| HowItWorks | heading: "How It Works", steps: generic dev workflow |
| Roadmap | heading: "Roadmap", items: generic feature names with shipped/coming-soon/planned |

Each block config file should import `IconPickerField` from `~/components/admin/IconPickerField` for the icon fields (Features, HowItWorks, Footer), same as the www app.

---

## Step 2: Components

- [ ] Copy `src/components/admin/IconPickerField.tsx`
- [ ] Copy `src/components/ThemeStyle.tsx`
- [ ] Copy `src/components/ThemeInjector.tsx`
- [ ] Copy `src/components/SiteHeader.tsx`
- [ ] Copy `src/components/SiteFooter.tsx`
- [ ] Copy `src/components/PageSkeleton.tsx` (if exists)
- [ ] Copy `src/app/(frontend)/PageContent.tsx`
- [ ] Copy `src/app/(frontend)/preview/[slug]/PreviewPageContent.tsx`
- [ ] Copy `src/components/motion-primitives/` directory (TextEffect, AnimatedGroup)

All components are copied as-is — they use relative imports (`~/`) that resolve the same way in the template.

---

## Step 3: Convex public queries

- [ ] Copy `convex/headers.ts` — `getFirst` query
- [ ] Copy `convex/footers.ts` — `getFirst` query
- [ ] Copy `convex/theme.ts` — `getActive` + `getActivePreview` queries

These are small standalone query files. Copy as-is.

---

## Step 4: Page routes

- [ ] Copy `src/app/(frontend)/layout.tsx` — fetchQuery for header/footer, ThemeStyle
- [ ] Copy `src/app/(frontend)/page.tsx` — fetchQuery for home page, PageContent
- [ ] Update or create `src/app/(frontend)/[slug]/page.tsx` — fetchQuery + PageContent
- [ ] Copy `src/app/(frontend)/preview/layout.tsx` — ThemeStyle drafts + ThemeInjector
- [ ] Copy `src/app/(frontend)/preview/[slug]/page.tsx` — fetchQuery + PreviewPageContent

Copy as-is from www app. These use the TanStack Query + initialData pattern.

---

## Step 5: Collections, globals, access, vex.config

- [ ] Verify `src/vexcms/collections/pages.ts` — should match www (with SEO fields if Spec 41 is done, without if not)
- [ ] Verify `src/vexcms/collections/headers.ts` — should match www
- [ ] Verify `src/vexcms/collections/footers.ts` — should match www
- [ ] Verify `src/vexcms/collections/themes.ts` — should match www
- [ ] Copy `src/vexcms/globals/siteSettings.ts` (if not already present as `site_settings.ts`)
- [ ] Copy `src/vexcms/globals/index.ts`
- [ ] Update `src/vexcms/collections/index.ts` to export all collections + globals
- [ ] Update `src/vexcms/access.ts` to include all resources (pages, headers, footers, themes, users, media, siteSettings)
- [ ] Update `vex.config.ts` with access, globals, full collections array
- [ ] Update `src/app/admin/layout.tsx` with `checkAdminAccess` enforcement
- [ ] Update `src/app/admin/AdminLayoutWrapper.tsx` to import access from `~/vexcms/access`
- [ ] Update `src/db/constants/index.ts` with all table slug constants

---

## Step 6: Verify

- [ ] The marketing-site template can be scaffolded via `create-vexcms`
- [ ] `pnpm build` succeeds on a freshly scaffolded project
- [ ] Admin panel loads with all collections and globals in sidebar
- [ ] All 8 blocks appear in the block picker when editing a page
- [ ] Page routes render correctly (home, [slug], preview)
- [ ] ThemeStyle server component injects CSS without flash
- [ ] Access enforcement redirects unauthorized users from admin

---

## Success Criteria

- [ ] All 8 block types available in the marketing-site template
- [ ] SSR prefetch pattern (fetchQuery + TanStack Query initialData) on all public routes
- [ ] ThemeStyle + ThemeInjector for theme CSS injection
- [ ] IconPickerField works for icon fields in blocks
- [ ] Access config with `checkAdminAccess` enforcement in admin layout
- [ ] Public queries for header, footer, theme exist in convex/
- [ ] No seed.ts or vexcms-specific marketing content in the template
- [ ] base-nextjs template is unchanged
- [ ] Freshly scaffolded project builds successfully
