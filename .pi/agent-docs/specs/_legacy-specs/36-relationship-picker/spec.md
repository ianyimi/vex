# Spec 36 — Relationship Field Picker & Site Settings Enhancement

## Overview

Builds a `RelationshipField` form component for the admin panel — a combobox/select that queries documents from the target collection with search filtering and infinite scroll pagination. Supports both single (`hasMany: false`) and multi-select (`hasMany: true`) variants. Also enhances the site_settings collection with SEO fields.

## Design Decisions

- **Combobox pattern:** Uses a popover with a search input and scrollable list. Single mode works like a select. Multi mode works like the existing `MultiSelectField` with tag chips.
- **Display labels from `useAsTitle`:** The picker shows `admin.useAsTitle` field values as labels. Falls back to `_id` if no `useAsTitle` is configured on the target collection.
- **Search via collection search index:** Uses the auto-generated search index on the `useAsTitle` field (e.g., `search_title`). If no search index exists, falls back to client-side filtering of loaded results.
- **Infinite scroll:** Loads documents in pages (25 per batch). Scrolling near the bottom triggers loading more via Convex pagination.
- **Collection config lookup:** The component receives the `to` slug and looks up the target collection from the VEX config to find `useAsTitle` and the search index name.
- **Popover container:** Uses the `container` prop pattern (from the popover-in-dialog fix) to render correctly inside dialogs.
- **Site settings stays as a collection** for now — converting to a global is a separate spec.

## Out of Scope

- Relationship field with inline document creation ("Create new" button in picker)
- Relationship field filtering by document status (draft/published)
- Converting site_settings to a VEX global
- Relationship field validation (ensuring referenced document exists)

## Target Directory Structure

```
packages/ui/src/
├── components/
│   └── form/
│       └── fields/
│           └── RelationshipField.tsx     # NEW — single + hasMany picker

apps/www/src/
└── vexcms/
    └── collections/
        └── site_settings.ts              # MODIFIED — add SEO fields
```

## Implementation Order

1. **Step 1:** RelationshipField component (single select) — after this, single relationships render as a searchable combobox
2. **Step 2:** hasMany variant — after this, multi-select relationships render with tag chips
3. **Step 3:** Wire into AppForm's `renderFieldByType` — after this, both variants work everywhere
4. **Step 4:** Enhanced site_settings with SEO fields — after this, site settings has meta title, description, og:image
5. **Step 5:** Tests + build verification

---

## Step 1: RelationshipField Component (Single Select)

- [ ] Create `packages/ui/src/components/form/fields/RelationshipField.tsx`
- [ ] Implement searchable combobox with infinite scroll
- [ ] Query documents from target collection via `anyApi.vex.api[slug].list`
- [ ] Search via `anyApi.vex.api[slug].search` when search index exists
- [ ] Display `useAsTitle` field value as label, fall back to `_id`
- [ ] Handle popover-in-dialog via container prop

### `File: packages/ui/src/components/form/fields/RelationshipField.tsx`

```tsx
"use client";

// TODO: implement
//
// 1. Component receives: field, fieldDef (RelationshipFieldDef), name, config (ClientVexConfig)
//
// 2. Look up the target collection from config:
//    const targetCollection = config.collections.find(c => c.slug === fieldDef.to)
//      ?? config.media?.collections.find(c => c.slug === fieldDef.to)
//      ?? config.auth?.collections.find(c => c.slug === fieldDef.to)
//    const useAsTitle = targetCollection?.admin?.useAsTitle as string | undefined
//
// 3. Query documents from the target collection:
//    - Use useQuery with anyApi.vex.api[fieldDef.to].list for paginated loading
//    - Use anyApi.vex.api[fieldDef.to].search for search filtering (if search index exists)
//    - Load 25 documents per batch
//
// 4. Single select UI:
//    - Popover trigger shows selected document's title or "Select..."
//    - Popover content: search input + scrollable document list
//    - Each item shows useAsTitle value (or _id)
//    - Clicking an item sets field.handleChange(doc._id)
//    - Infinite scroll: detect scroll near bottom, load more
//
// 5. Auto-detect dialog container:
//    const triggerRef = useRef<HTMLButtonElement>(null)
//    const container = triggerRef.current?.closest('[data-slot="dialog-content"]')
//    Pass container to PopoverContent
//
// Edge cases:
// - Target collection has no documents → show "No documents found"
// - Selected document was deleted → show _id with "(deleted)" indicator
// - No useAsTitle configured → show _id as label
// - No search index → filter loaded results client-side
```

---

## Step 2: hasMany Variant

- [ ] Add multi-select support to RelationshipField
- [ ] Show selected items as removable tag chips (like MultiSelectField)
- [ ] Allow selecting/deselecting multiple documents
- [ ] Field value is an array of document IDs

```tsx
// TODO: implement
//
// When fieldDef.hasMany is true:
// 1. Field value is string[] (array of IDs)
// 2. Trigger shows tag chips for each selected document
// 3. Each chip shows useAsTitle label + X remove button
// 4. Popover shows checkboxes next to each document
// 5. Selecting/deselecting toggles the ID in the array
// 6. field.handleChange([...currentIds, newId]) to add
// 7. field.handleChange(currentIds.filter(id => id !== removedId)) to remove
```

---

## Step 3: Wire into AppForm

- [ ] Export RelationshipField from `packages/ui/src/components/form/fields/index.ts`
- [ ] Add `case "relationship":` to `renderFieldByType` in AppForm
- [ ] Pass `config` prop to RelationshipField (needs config from AppForm props)
- [ ] Rebuild ui + admin-next packages

### Changes to `AppForm.tsx`

The `renderFieldByType` function needs access to the VEX config to pass to `RelationshipField`. The config is already available in the `CollectionEditView` and `CreateDocumentDialog` — it needs to be threaded through `AppForm` props.

Add `config?: ClientVexConfig` to `AppFormProps`, then:

```typescript
case "relationship":
  return wrap(
    <RelationshipField
      field={renderField}
      fieldDef={renderFieldDef}
      name={renderName}
      config={config}
    />,
  );
```

---

## Step 4: Enhanced Site Settings

- [ ] Add SEO fields to `apps/www/src/vexcms/collections/site_settings.ts`
- [ ] Verify schema generates correctly

### Changes to `site_settings.ts`

Add these fields:

```typescript
metaTitle: text({ label: "Meta Title", admin: { description: "Default <title> tag for the site" } }),
metaDescription: text({ label: "Meta Description", admin: { description: "Default meta description for SEO" } }),
ogImage: upload({ label: "OG Image", to: TABLE_SLUG_MEDIA, admin: { description: "Default Open Graph image for social sharing" } }),
twitterHandle: text({ label: "Twitter Handle", admin: { description: "@handle for Twitter cards" } }),
googleAnalyticsId: text({ label: "Google Analytics ID", admin: { description: "GA4 measurement ID (G-XXXXXXXXXX)" } }),
```

---

## Step 5: Tests + Build Verification

- [ ] Add relationship field to existing test files (fieldToTypeString, generateFormSchema, generateFormDefaultValues)
- [ ] Verify relationship field already has schema value type tests
- [ ] Run `pnpm --filter @vexcms/core test` — all pass
- [ ] Run `pnpm --filter @vexcms/ui build` — passes
- [ ] Run `pnpm --filter @vexcms/admin-next build` — passes
- [ ] Run `pnpm build` — full monorepo build
- [ ] Test in www app: create site_settings with active theme relationship, verify picker works

## Success Criteria

- [ ] Single relationship field renders as searchable combobox with document titles
- [ ] hasMany relationship field renders as multi-select with tag chips
- [ ] Search filtering works via collection search index
- [ ] Infinite scroll loads more documents on scroll
- [ ] Picker works inside CreateDocumentDialog (popover-in-dialog)
- [ ] Picker works inside tabs (recursive rendering)
- [ ] Selected document shows useAsTitle label (falls back to _id)
- [ ] Site settings has SEO fields (meta title, description, OG image, etc.)
- [ ] All existing tests pass — no regressions
- [ ] `pnpm build` succeeds
