# 35-globals-system — Addendum: `useGlobalForm` + AdminTopNav integration

**Status:** Proposed (not applied)
**Parent spec:** `spec.md` (35-globals-system)
**Fixes:** workspace `typecheck`/`build` failure at `GlobalEditView.tsx:24`; AdminTopNav not reflecting `/admin/globals` routes; missing `GlobalSlug`/`GlobalDocumentBySlug` in the generated `GeneratedVexTypes` augmentation.

---

## Problem statement

1. **Typecheck failure.** `useCollectionForm` reuses `TCollectionSlug extends CollectionSlug` for its `GlobalConfig` branch. A global's slug is never a collection slug, so once `apps/www/src/vex.types.ts` narrows `CollectionSlug` to the literal union, `GlobalConfig<..., "nav">` (or the unnarrowed `GlobalConfig<..., string>`) can never satisfy `GlobalConfig<..., CollectionSlug>`. Editors checking `packages/react` in isolation see no error because that program has no `GeneratedVexTypes` augmentation (`CollectionSlug` = `string` there) — the error only materializes in the `apps/www` program.
2. **TopNav.** Route shape is `activeSlug = segments[1]`, `activeDocID = segments[2]` (`NextAdminLayoutClient.tsx:45-47`). On `/admin/globals/nav`, `activeSlug === "globals"` matches no collection (crumbs stop at "Home") and `activeDocID === "nav"` — a global slug, **not** a Convex ID — is passed into `convexQuery(vexConvexApi.get, { id: ... })`.
3. **Generator gap.** `generateVexTypes.ts` emits `GlobalSlug` / `GlobalDocumentBySlug` as standalone exports but omits them from the `declare module "@vexcms/core"` block, so `GlobalSlug` resolves to its `string` fallback in consuming apps (spec D6 / Step 2 incomplete; the promised `globals.get({ slug: "typo" })` compile error never fires).

Design principle: follow **D21** — parallel independent implementations for globals that call the same field-level utilities. The core mirrors (`getGlobalDefaultValues`, `getGlobalInputSchema`) already exist; the react hook mirrors them the same way. No unified hook, no widened collection helpers.

---

## Change 1 — `useGlobalForm` hook (NEW)

`packages/react/src/hooks/useGlobalForm.ts`

```ts
import { FormOptions, useForm } from "@tanstack/react-form";
import {
  type GlobalSlug,
  type GlobalConfig,
  type GlobalDocumentBySlug,
  type VexDocumentGlobal,
  getGlobalDefaultValues,
  getGlobalInputSchema,
} from "@vexcms/core";
import type { AnyFormApi } from "../components/form/AppFormContext";

/**
 * Creates a TanStack Form instance pre-configured for a VexCMS global.
 *
 * Mirror of `useCollectionForm` (spec 35, D21): same shape, but drives
 * defaults and validation from the global mirrors `getGlobalDefaultValues`
 * / `getGlobalInputSchema`. `TGlobalSlug` is inferred from the `global`
 * argument — after `vex generate`, passing a global narrows the hook's
 * internal types to that global's document shape.
 */
export function useGlobalForm<
  TFieldMeta extends {} = {},
  TGlobalMeta extends {} = {},
  TGlobalSlug extends GlobalSlug = GlobalSlug,
>(
  props: {
    global: GlobalConfig<TFieldMeta, TGlobalMeta, TGlobalSlug>;
    document?: VexDocumentGlobal | null;
  } & FormOptions<
    GlobalDocumentBySlug[TGlobalSlug],
    any, any, any, any, any, any, any, any, any, any, any
  >,
): AnyFormApi {
  const { global, document, validators, ...formOptions } = props;
  return useForm({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultValues: getGlobalDefaultValues({ global, document }) as any,
    ...formOptions,
    validators: {
      onSubmitAsync: getGlobalInputSchema({ global }),
      onBlur: getGlobalInputSchema({ global }),
      ...validators,
    },
  }) as AnyFormApi;
}
```

Barrel: add to `packages/react/src/hooks/index.ts`

```ts
export * from "./useGlobalForm";
```

> Note: `getGlobalDefaultValues` currently types `document` as
> `Record<string, unknown>` (`globals/utils.ts:17-19`) — widen that param to
> `VexDocumentGlobal | null | undefined` (or keep and cast at the callsite);
> pick whichever matches the collection util's convention after Change 3.

---

## Change 2 — Revert `useCollectionForm` to collections-only

`packages/react/src/hooks/useCollectionForm.ts`

```diff
 import {
   type CollectionSlug,
   type CollectionConfig,
   getCollectionDefaultValues,
   getCollectionInputSchema,
   type TDocument,
-  type VexDocumentGlobal,
   DocumentBySlug,
-  GlobalConfig,
 } from "@vexcms/core";
```

```diff
   props: {
-    collection:
-      | CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug>
-      | GlobalConfig<TFieldMeta, TCollectionMeta, TCollectionSlug>;
-    document?: TDocument | VexDocumentGlobal | null;
+    collection: CollectionConfig<TFieldMeta, TCollectionMeta, TCollectionSlug>;
+    document?: TDocument | null;
   } & FormOptions<
```

Hook body unchanged.

---

## Change 3 — Revert the widening in `collections/utils.ts` (D21 compliance)

`packages/core/src/collections/utils.ts`

```diff
 import { z, type ZodType } from "zod";
 import type { CollectionConfig } from "./types";
 import { adminFieldToInputSchema } from "../fields";
 import type { TDocument } from "../api/convex";
-import { GlobalConfig } from "../globals";
-import { VexDocumentGlobal } from "../types";
```

```diff
 export function getCollectionDefaultValues(props: {
-  collection: CollectionConfig | GlobalConfig;
-  document?: TDocument | VexDocumentGlobal | null;
+  collection: CollectionConfig;
+  document?: TDocument | null;
 }) {
```

```diff
-export function getCollectionInputSchema(props: { collection: CollectionConfig | GlobalConfig }) {
+export function getCollectionInputSchema(props: { collection: CollectionConfig }) {
```

The global mirrors in `packages/core/src/globals/utils.ts` are the only
consumers of `GlobalConfig` for defaults/schema — collection helpers return
to their pre-35 signatures.

---

## Change 4 — `GlobalEditView` uses `useGlobalForm`

`packages/react/src/components/views/GlobalEditView.tsx`

```diff
-import { useCollectionForm } from "../../hooks";
+import { useGlobalForm } from "../../hooks";
```

```diff
-  const form = useCollectionForm({
+  const form = useGlobalForm({
     document: globalDoc,
-    collection: global,
+    global,
     onSubmit: async ({ value }: { value: any }) => {
```

This is the line (`GlobalEditView.tsx:24`) that currently fails
`tsc --noEmit` from `apps/www`.

---

## Change 5 — AdminTopNav globals crumbs + ID-query guard

`packages/react/src/components/AdminTopNav.tsx`

Two parts: (a) skip the `vexConvexApi.get` subscription on globals routes —
`activeDocID` is a slug there, not a Convex ID; (b) collapse the triplicated
`isLeft`/`Divider` blocks into a crumbs array so the globals branch doesn't
become copies four and five.

Globals crumbs are fully config-driven (D16: a global's `label` IS the page
title — no `useAsTitle`, no doc fetch, no `mounted` guard needed for them).

```tsx
export default function AdminTopNav(props: AdminLayoutProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const isGlobals = props.activeSlug === "globals";

  const { data: currentDocument } = useQuery({
    // "skip" when there is no activeDocID OR when on a globals route —
    // on /admin/globals/[slug] the third segment is a global slug, not a
    // Convex document ID, so vexConvexApi.get must not run.
    ...convexQuery(
      vexConvexApi.get,
      props.activeDocID && !isGlobals ? { id: props.activeDocID } : "skip",
    ),
  });

  const isLeft = props.config.admin.sidebar.side === "left";
  const adminRoot = addLeadingSlash(props.config.basePath);
  const allCollections = props.config.collections.concat(props.config.mediaCollections);
  const activeCollection = allCollections.find((c) => c.slug === props.activeSlug);
  const activeGlobal =
    isGlobals && props.activeDocID
      ? props.config.globals.find((g) => g.slug === props.activeDocID)
      : undefined;
  // Only use currentDocument after client mount to avoid SSR/client mismatch.
  const doc = mounted ? currentDocument : undefined;

  type Crumb = { key: string; href: string; label: string };
  const crumbs: Crumb[] = [{ key: "home", href: adminRoot, label: "Home" }];
  if (activeCollection) {
    crumbs.push({
      key: "collection",
      href: `${adminRoot}/${activeCollection.slug}`,
      label: activeCollection.labels.plural,
    });
    if (doc) {
      crumbs.push({
        key: "document",
        href: `${adminRoot}/${activeCollection.slug}/${doc._id}`,
        label: doc[activeCollection.admin.useAsTitle] as string,
      });
    }
  } else if (isGlobals) {
    crumbs.push({ key: "globals", href: `${adminRoot}/globals`, label: "Globals" });
    if (activeGlobal) {
      crumbs.push({
        key: "global",
        href: `${adminRoot}/globals/${activeGlobal.slug}`,
        label: activeGlobal.label,
      });
    }
  }

  const nav = crumbs.flatMap((crumb, i) => {
    const isLast = i === crumbs.length - 1;
    const link = (
      <VexLink
        key={crumb.key}
        href={crumb.href}
        className={cn(isLast ? "text-primary" : "hover:text-primary-hover")}
      >
        <span>{crumb.label}</span>
      </VexLink>
    );
    return i === 0 ? [link] : [<Divider key={`div-${crumb.key}`} left={isLeft} size={16} />, link];
  });

  return (
    <div className="flex items-center gap-2" suppressHydrationWarning>
      {isLeft ? nav : nav.reverse()}
    </div>
  );
}
```

Behavior preserved from the current implementation:

- "Home" is `text-primary` only when it is the sole crumb (previously:
  `!activeCollection && !doc`).
- Collection crumb is `text-primary` only when no document crumb follows.
- Divider direction still flips with sidebar side; `nav.reverse()` retained.
- `mounted` guard still gates only the DB-backed document crumb.

Minimal-diff alternative (rejected): append two more `<Fragment>` blocks
mirroring the existing collection/document pattern — works, but yields a
fourth and fifth copy of the `isLeft` branching.

---

## Change 6 — Emit `GlobalSlug` / `GlobalDocumentBySlug` into the augmentation

`packages/core/src/types/generateVexTypes.ts` — the values are already
computed (`globalSlugs` line 74, `globalDocumentsBySlug` line 77); they are
just missing from the `declareModule` template.

```diff
   const declareModule = `declare module "@vexcms/core" {
     \tinterface GeneratedVexTypes {
     \t\tCollectionSlug: ${collectionSlugs}
+    \t\tGlobalSlug: ${globalSlugs}
     \t\tMediaCollectionSlug: ${mediaCollectionSlugs}
     \t\tStorageAdapterSlug: ${storageAdapterSlugs}
     \t\tDocumentBySlug: {\n${documentsBySlug}\n}
+    \t\tGlobalDocumentBySlug: {\n${globalDocumentsBySlug}\n}
     \t\tCollectionsFieldTypeMap: {\n${collectionsFieldTypeMap}\n}
     \t\tGlobalsFieldTypeMap: {\n${globalsFieldTypeMap}\n}
     \t}
   \n}`;
```

Then re-run `vex generate` in `apps/www` and update
`generateVexTypes.test.ts` expectations (spec Step 2 checklist item).

Until this lands, `GlobalSlug` = `string` in consuming apps, which silently
disables slug-typo checking for `globals.get` **and** for the new
`useGlobalForm` — Changes 1–5 compile and work without it, but the type
narrowing the spec promises only activates with this change.

---

## Affected files

| File | Kind |
| --- | --- |
| `packages/react/src/hooks/useGlobalForm.ts` | NEW |
| `packages/react/src/hooks/index.ts` | barrel export |
| `packages/react/src/hooks/useCollectionForm.ts` | revert global arm |
| `packages/core/src/collections/utils.ts` | revert widening (D21) |
| `packages/react/src/components/views/GlobalEditView.tsx` | switch hook |
| `packages/react/src/components/AdminTopNav.tsx` | crumbs + query guard |
| `packages/core/src/types/generateVexTypes.ts` | augmentation emission |
| `packages/core/src/types/generateVexTypes.test.ts` | expectations |
| `apps/www/src/vex.types.ts` | regenerated |

## Out of scope (noted, not done here)

- Reserving `"globals"` as a forbidden collection slug in `defineCollection`
  validation — `NextAdminPage.tsx:71` already gives the route precedence; a
  collection slugged `globals` would be shadowed.

## Verification

1. `pnpm -r typecheck` — previously failed at `GlobalEditView.tsx(24,5)` from
   `apps/www`; must pass.
2. `pnpm --filter www build` — must pass.
3. `pnpm -r test` — must stay green (collection utils revert touches
   `useCollectionForm` consumers only through unchanged signatures).
4. Browser smoke: `/admin/globals` shows `Home › Globals`; `/admin/globals/nav`
   shows `Home › Globals › <nav label>`; collection + document routes render
   crumbs identically to before; no Convex `get` call fires on globals routes.
