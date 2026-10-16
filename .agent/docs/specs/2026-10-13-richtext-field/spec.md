---
status: draft
spec_id: 2026-10-13-richtext-field
touches:
  - "packages/core/src/editor/**"
  - "packages/core/src/fields/richtext/**"
  - "packages/core/src/fields/constants.ts"
  - "packages/core/src/fields/types.ts"
  - "packages/core/src/fields/index.ts"
  - "packages/core/src/fields/validators/index.ts"
  - "packages/core/src/fields/inputSchemas/index.ts"
  - "packages/core/src/types/generateVexTypes*.ts"
  - "packages/core/src/config/**"
  - "packages/core/src/media/config.ts"
  - "packages/core/src/index.ts"
  - "packages/core/README.md"
  - "packages/react/src/index.ts"
  - "packages/react/src/adapter.ts"
  - "packages/react/src/components/fields/index.tsx"
  - "packages/react/src/components/fields/richtext/**"
  - "packages/react/src/testing/**"
  - "packages/richtext-plate/**"
  - "apps/test/package.json"
  - "apps/test/src/vex.config.ts"
  - "apps/test/src/vexcms/collections/posts.ts"
  - "apps/test/convex/posts.ts"
  - "apps/test/src/app/(frontend)/(site)/posts/**"
  - "apps/docs/src/content/docs/fields/richtext.mdx"
  - "apps/docs/src/content/docs/fields/coming-soon.mdx"
  - "scripts/check-packed-manifests.mjs"
  - ".changeset/*.md"
  - ".agent/docs/product/v0.1.0-launch-plan.md"
prompt_version: 1
---

# 2026-10-13-richtext-field — Spec

## Overview

Launch-plan spec **D**. `@vexcms/richtext-plate` ships ~3,200 lines of working Plate
editor and static renderer that nothing can reach: core has no `richtext()` field, the
package imports six core types that do not exist, and four files carry `@ts-nocheck` to
hide it. This spec adds the core types, a root `editor:` adapter on the client config,
the `richtext()` field end to end (schema gen → type gen → admin form → cell), inline
images through the media collection, and dogfoods it in `apps/test`. Now because C
(versions & drafts) has shipped and the field pipeline (F) is frozen.

## Design Decisions

1. **No localization for 0.1.0.** A richtext value is one locale-agnostic
   `RichTextDocument`. B2's ADR was never written; a later nested-map localization shape
   wraps the value rather than changing it, so no richtext data migrates.
2. **Root `editor:` adapter on the client-safe config** (`editor: plateEditor()` in
   `vex.config.ts`, ADR-013). Matches the existing `plateEditor()` design; keeps Plate
   optional for admins without richtext.
3. **`VexEditorAdapter<TComponent extends ComponentHKT>`** typed through `ApplyComponent`,
   mirroring `relationship` `admin.components.preview`. Core stays react-free;
   `@vexcms/react` re-exports it bound to `ReactHKT`.
4. **Convex validator `v.array(v.any())`.** Not `v.string()`: a JSON string forces
   parse/stringify on every read path (admin, drafts, version snapshots, live preview,
   consumer queries) and decouples the stored value from its TS type. Not a full node
   validator: Convex validators cannot express recursive types.
5. **Shallow Zod structural check** in the input schema (element = `type` + `children`,
   leaf = `text`, extra keys pass through). Keeps core independent of Plate's node set.
   `required` means non-empty plain text; `ignoreRequired` honored for draft saves (ADR-011).
6. **Cell renders a plain-text excerpt** via core `richTextToPlainText`, never markup.
7. **Inline images through the media collection** via a `mediaCollectionSlug` field
   option (P-001), reusing the upload field's picker/upload hooks. Absent → image feature
   hidden; an unknown slug throws `VexStorageConfigError` at `defineConfig()`, like `upload().to`.
8. **Missing `editor` renders a visible configuration error** in the field input naming
   `editor: plateEditor()` — not a crash, not a silent fallback.
9. **`@vexcms/richtext-plate` peers on `@vexcms/core` / `@vexcms/react` as
   `workspace:^`** (P-013) with matching devDeps (P-014).
10. **Dogfood in `apps/test` only.** `apps/www` and the marketing template follow after
    iteration, as separate work.

## Out of Scope

- Localization of any kind (B2 ADR).
- `apps/www`, `marketing-site` and `base-nextjs` template adoption.
- Per-field `editor` override; editor adapters other than Plate.
- Server-side HTML/markdown serialization, search indexing of richtext content.
- Relationship/internal-link nodes, custom blocks inside richtext.
- Any versioning or live-preview change (both are field-agnostic).

## Implementation

### Step 1 — Core richtext value + editor adapter types [agent]

Six new types close the two real gaps behind `richtext-plate`'s four `@ts-nocheck`
files: the locale-agnostic document shape (`RichTextDocument`/`RichTextElement`/
`RichTextText`) and the framework-agnostic editor adapter contract
(`VexEditorComponentProps`/`VexRenderComponentProps`/`VexEditorAdapter`), typed
through the existing `ComponentHKT`/`ApplyComponent` machinery exactly as
`relationship`'s `admin.components.preview` is. `VexEditorComponentProps` is sized
to what `PlateEditorField.tsx` actually destructures (value/onChange/readOnly/
name/label/description/placeholder, plus the full media-search/upload prop set
from Design Decision 6) so step 5 can delete `PlateEditorFieldProps`'s redundant
redeclarations instead of adding new ones, and step 6's react Input has a real
contract to wire against. `mediaCollection` is renamed to `mediaCollectionSlug`
here per P-001 — `PlateEditorField.tsx`'s own destructuring is fixed to match in
step 5 along with the rest of its `@ts-nocheck` cleanup.

- [ ] `packages/core/src/fields/richtext/types.ts` — `RichTextText`, `RichTextElement`, `RichTextDocument`
- [ ] `packages/core/src/editor/types.ts` — `VexEditorComponentProps`, `VexRenderComponentProps`, `VexEditorAdapter<TComponent extends ComponentHKT>`
- [ ] `packages/core/src/editor/index.ts` barrel + `packages/core/src/index.ts` export

#### packages/core/src/fields/richtext/types.ts

The canonical richtext value shape. `RichTextElement` and `RichTextText` carry an
index signature because every Plate plugin adds its own node/mark keys (`align`,
`indent`, `bold`, `italic`, …) and `richtext-plate`'s `ImageElement`/`LinkElement`/
`TableElement`/`TableCellElement` (`packages/richtext-plate/src/types.ts`) narrow
`type` and add fields on top of this base via plain interface extension — no
recursive validator is attempted here (Convex validators can't express
recursion; storage stays `v.array(v.any())`, Design Decision 3).

```ts
/**
 * A single text leaf in a {@link RichTextDocument} — the editor's smallest
 * editable unit. `text` is the leaf's literal content; any other key is a
 * mark applied to it (e.g. `bold: true`, `italic: true`) set by whichever
 * editor plugins are enabled.
 */
export interface RichTextText {
  /** The leaf's literal text content. */
  text: string;
  /** Marks applied to this leaf (bold, italic, code, …), set by editor plugins. */
  [mark: string]: unknown;
}

/**
 * A single block or inline node in a {@link RichTextDocument}. `type`
 * identifies the node kind (`"p"`, `"h1"`, `"img"`, `"a"`, `"table"`, …) and
 * `children` holds its nested nodes or text leaves. Any other key is a
 * node-specific property (e.g. an image's `url`, a link's `target`) set by
 * whichever editor plugins are enabled — narrow with a specific element
 * interface (e.g. `richtext-plate`'s `ImageElement`) to access them.
 */
export interface RichTextElement {
  /** The node kind, e.g. `"p"`, `"h1"`, `"img"`, `"a"`, `"table"`. */
  type: string;
  /** Nested nodes or text leaves. */
  children: (RichTextElement | RichTextText)[];
  /** Node-specific properties set by editor plugins. */
  [prop: string]: unknown;
}

/**
 * A complete rich text value — an ordered list of top-level
 * {@link RichTextElement} nodes. Locale-agnostic: a richtext field stores
 * exactly one `RichTextDocument`, never a per-locale map (Design Decision 1).
 * This is the `interfaceType` generated for every `richtext()` field and the
 * value type both `VexEditorComponentProps.value` and
 * `VexRenderComponentProps.content` carry.
 */
export type RichTextDocument = RichTextElement[];
```

#### packages/core/src/editor/types.ts

The framework-agnostic editor adapter contract (ADR-013). Core stays react-free:
`VexEditorAdapter` is generic over `ComponentHKT` and resolved to React's
`ComponentType` only in `@vexcms/react` (step 2), mirroring
`RelationshipFieldAdminInput.components.preview`'s `ApplyComponent<TComponent, …>`
pattern. `VexEditorComponentProps` carries exactly what the react Input passes to
`editor.editorComponent` — the base form-field props plus the full inline-image
contract from Design Decision 6, so a `richtext()` field with no
`mediaCollectionSlug` resolves every media prop to `undefined` and an adapter can
hide its image feature accordingly (Design Decision 6's "absent → image feature
hidden").

```ts
import type { ComponentHKT, ApplyComponent } from "../fields/baseTypes";
import type { RichTextDocument } from "../fields/richtext/types";
import type { MediaCollectionSlug } from "../types/generated";
import type { VexMediaDocument } from "../api/convex";

/**
 * Props the react Input passes to a richtext editor adapter's
 * `editorComponent` for one form field.
 *
 * `mediaCollectionSlug` and the `media*`/`onMedia*`/`generateUploadUrl`/
 * `createMediaDocument` props are present only when the field declares
 * `mediaCollectionSlug` (Design Decision 6); an adapter that doesn't support
 * inline images may ignore all of them.
 */
export interface VexEditorComponentProps {
  /** The field's current value. */
  value: RichTextDocument;
  /** Called with the new value on every edit. */
  onChange: (value: RichTextDocument) => void;
  /** Whether the field is read-only (versions/preview contexts). */
  readOnly?: boolean;
  /** The field's name, used for accessibility attributes. */
  name: string;
  /** The field's label. */
  label?: string;
  /** The field's description/help text. */
  description?: string;
  /** Placeholder text shown when the document is empty. */
  placeholder?: string;
  /** The field's configured inline-image target collection, if any. */
  mediaCollectionSlug?: MediaCollectionSlug;
  /** Search results from the media collection, for the image picker. */
  mediaResults?: VexMediaDocument[];
  /** The image picker's current search term. */
  mediaSearchTerm?: string;
  /** Called when the image picker's search term changes. */
  onMediaSearchChange?: (term: string) => void;
  /** Whether the image picker has more results to page in. */
  mediaCanLoadMore?: boolean;
  /** Called when the image picker should load its next page of results. */
  onMediaLoadMore?: () => void;
  /** Whether the image picker's search results are loading. */
  mediaIsLoading?: boolean;
  /** Called when the user chooses to upload a new file instead of picking one. */
  onUploadNew?: () => void;
  /** Mints a presigned upload URL for a new file, resolving to that URL. */
  generateUploadUrl?: () => Promise<string>;
  /**
   * Creates the uploaded file's media document, resolving to its id and —
   * when the storage adapter resolves one synchronously at doc-creation
   * time (the Convex adapter does, via `ctx.storage.getUrl()`) — its
   * stored URL. An adapter without a synchronous URL omits it; callers
   * fall back to a temporary local URL only as a last resort.
   */
  createMediaDocument?: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<{ mediaId: string; url?: string }>;
}

/**
 * Props a richtext editor adapter's `renderComponent` receives to render a
 * stored value outside the editor (front-end pages, read-only cells).
 */
export interface VexRenderComponentProps {
  /** The document to render. */
  content: RichTextDocument;
  /** Optional wrapper class name. */
  className?: string;
  /**
   * Resolves a media id referenced by an inline image node to its stored
   * URL. Omit to render whatever `url` is already embedded in the node.
   */
  resolveMedia?: (mediaId: string) => Promise<string | undefined>;
}

/**
 * A pluggable rich text editor backend, set as `editor:` on
 * `VexClientConfigInput` (ADR-013). `type` identifies the adapter
 * (`"plate"`); `editorComponent` renders the interactive form field;
 * `renderComponent` renders a stored value read-only. Resolved against a
 * concrete `ComponentHKT` (`ReactHKT` in `@vexcms/react`) the same way
 * `RelationshipFieldAdminInput.components.preview` resolves its component
 * slot.
 */
export interface VexEditorAdapter<
  TComponent extends ComponentHKT = ComponentHKT,
> {
  /** Identifies the adapter, e.g. `"plate"`. */
  type: string;
  /** Renders the interactive editor for one form field. */
  editorComponent: ApplyComponent<TComponent, VexEditorComponentProps>;
  /** Renders a stored value read-only. */
  renderComponent: ApplyComponent<TComponent, VexRenderComponentProps>;
}
```

#### packages/core/src/editor/index.ts

```ts
export * from "./types";
```

#### packages/core/src/index.ts

1 edit — add the barrel beside the other top-level exports; everything else unchanged.

**1 — new `EDITOR` section, after the `FIELD TYPES` section's `export * from "./fields";`.**

```ts
// ============================================================================
// EDITOR
// ============================================================================

export * from "./editor";
```

Verify: pnpm --filter @vexcms/core typecheck && pnpm --filter @vexcms/core test

### Step 2 — `editor` on the client config [dev]

The admin reads the editor adapter at runtime through `useVexConfig().editor`
(`packages/react/src/context/VexConfigContext.tsx`), which returns
`VexClientConfig["editor"]`. Because `VexClientConfigInput`/`VexClientConfig`
carry no package-wide `TComponent` generic — exactly like `collections:
CollectionConfig[]`, which already stores concretely-typed (e.g.
React-bound) collections in a plain array with zero `TComponent` parameter —
`editor` is typed `VexEditorAdapter<ComponentHKT>` at this level, so
`editorComponent`/`renderComponent` erase to `ApplyComponent<ComponentHKT,
_>` (`unknown`). A `plateEditor()` return value (`VexEditorAdapter<ReactHKT>`)
is still assignable into it — `unknown` accepts any concrete component type —
so no generic needs to be added to `VexClientConfigInput` itself. Step 3's
`Input.tsx` narrows `config.editor` back to the React-bound re-export this
step adds to `@vexcms/react` (`import type { VexEditorAdapter } from
"@vexcms/react"`), the same narrowing `RelationshipFieldInput`'s
`admin.components.preview` already requires at the React layer.

- [ ] `packages/core/src/config/types.ts` — `editor?: VexEditorAdapter<TComponent>` on `VexClientConfigInput` / `VexClientConfig`
- [ ] `packages/core/src/config/config.ts` — `defineConfig` passes `editor` through unchanged
- [ ] `packages/core/src/config/config.test.ts` — passthrough + absent case
- [ ] `packages/react/src/index.ts` — `VexEditorAdapter` re-export bound to `ReactHKT`

#### packages/core/src/config/types.ts

2 edits. Everything not shown is unchanged.

**1 — imports.** Add two imports alongside the existing `../collections` /
`../fields`-adjacent imports at the top of the file (`ComponentHKT` is the
same symbol `relationship`'s `admin.components.preview` and every
`CollectionConfig`-family type already bind against; `VexEditorAdapter` comes
from Step 1's new barrel).

```ts
import { ComponentHKT } from "../fields";
import { VexEditorAdapter } from "../editor";
```

**2 — `editor` on `VexClientConfigInput`.** Add after the existing
`types?: TypesConfigInput;` property, at the end of the interface body.

```ts
  /**
   * Root rich-text editor adapter, used by every `richtext()` field in every
   * collection — there is exactly one editor per project (ADR-013), set once
   * here rather than per-field.
   *
   * Type-erased to `ComponentHKT` at this level, the same way
   * `collections: CollectionConfig[]` already erases each collection's own
   * `TComponent` binding — a concrete adapter (e.g. `plateEditor()` from
   * `@vexcms/richtext-plate`, typed `VexEditorAdapter<ReactHKT>`) is still
   * assignable here because its component slots resolve to a real component
   * type, and any real type is assignable into this slot's erased `unknown`.
   *
   * Omitted entirely for a project with no rich-text fields. A collection
   * that declares a `richtext()` field while this is absent renders a
   * configuration error in the admin Input instead of crashing or falling
   * back to a plain textarea (Step 3).
   *
   * @see {@link VexEditorAdapter} for the adapter shape
   * @see {@link RelationshipFieldAdminInput.components.preview} for the same
   *   `ComponentHKT` erasure pattern on a per-field (rather than root) slot
   */
  editor?: VexEditorAdapter<ComponentHKT>;
```

**3 — `editor` on `VexClientConfig`.** Add after the existing
`types: TypesConfig;` property, at the end of the interface body.

```ts
  /**
   * Resolved root editor adapter — present only when the project configured
   * one. `undefined` when the project has no rich-text fields.
   *
   * @see {@link VexEditorAdapter} for the adapter shape
   */
  editor?: VexEditorAdapter<ComponentHKT>;
```

#### packages/core/src/config/config.ts

1 edit. Everything not shown is unchanged.

**1 — `defineConfig` return object.** `editor` has no defaults to apply (unlike
`storage`/`schema`/`types`), so it is passed straight through from the input,
the same way `access: config?.access,` already is. Add the line immediately
after the existing `access: config?.access,` in the returned object.

```ts
    access: config?.access,
    editor: config?.editor,
```

#### packages/core/src/config/config.test.ts

1 edit. Everything not shown is unchanged.

**1 — new `describe` block.** Add a `VexEditorAdapter` type import to the
existing `import type { … } from "../"` block (alongside `MediaCollectionConfig`
etc.), then insert this block between the `defineConfig — revalidate
defaults` and `defineConfig — purity` `describe` blocks.

```ts
describe("defineConfig — editor", () => {
  it("passes a configured editor adapter through unchanged", () => {
    const editor: VexEditorAdapter = {
      type: "plate",
      editorComponent: () => null,
      renderComponent: () => null,
    };
    const config = defineConfig({ editor });
    expect(config.editor).toBe(editor);
  });

  it("leaves editor undefined when omitted", () => {
    const config = defineConfig();
    expect(config.editor).toBeUndefined();
  });
});
```

#### packages/react/src/index.ts

2 edits. Everything not shown is unchanged.

**1 — type-only import from core.** Add `VexEditorAdapter as
CoreVexEditorAdapter` to the existing `import type { … } from "@vexcms/core"`
block that already aliases `RelationshipFieldInput as CoreRelationshipFieldInput`
etc.

```ts
  VexEditorAdapter as CoreVexEditorAdapter,
```

**2 — `VexEditorAdapter` re-export.** Add after the existing `CollectionConfig`
type export and before the `relationship()` function export.

```ts
/**
 * Root editor adapter type with the React component slot bound.
 *
 * Identical to `@vexcms/core`'s `VexEditorAdapter` except `editorComponent`
 * and `renderComponent` are typed as `ComponentType<...>` instead of an
 * opaque `ApplyComponent<ComponentHKT, _>`. `plateEditor()` from
 * `@vexcms/richtext-plate` returns this type; `vex.config.ts` sets
 * `editor: plateEditor()`.
 */
export type VexEditorAdapter = CoreVexEditorAdapter<ReactHKT>;
```

Verify: pnpm --filter @vexcms/core test -- config && pnpm --filter @vexcms/react typecheck

### Step 3 — `richtext()` field: core module, registration, admin components [dev]

> **Spec note:** spec-tasks originally split this into a standalone core module step and a
> registration step. They cannot land separately: `richtext()` reads `ADMIN_FIELDS.richtext`
> (P-003), and `AdminFieldType` derives from `ADMIN_FIELDS` keys (`fields/constants.ts`), so the
> entry immediately breaks react's exhaustive `fieldInputComponents` / `fieldCellComponents` /
> `fieldFixtures` Records. A throwaway local constant would violate P-010. Merged into one step;
> implement in the order shown (core module → core registration → react), running the core
> tests mid-step, and expect `pnpm typecheck` green only at the end of the step.

**Part A — core field module**

This step builds `richtext()` as a standalone field module — factory, Convex
validator, admin-form Zod schema, and the plain-text excerpt helper the data
table cell and the `required` check both depend on — entirely inside
`fields/richtext/`, mirroring `color()`/`text()`/`upload()` file-for-file.
`RichTextFieldInput`/`RichTextField` join the existing `fields/richtext/types.ts`
(Step 1 already added `RichTextText`, `RichTextElement`, `RichTextDocument`
there). The module compiles and its own tests pass without `richtext` joining
`AdminField` yet — see the Spec note above for the one place that assumption
does reach outside this module.

- [ ] `packages/core/src/fields/constants.ts` — real `richtext` entry (moved up from Step 3, see Spec note)
- [ ] `packages/core/src/fields/richtext/types.ts` — add `RichTextFieldInput`, `RichTextField`
- [ ] `packages/core/src/fields/richtext/config.ts` + `config.test.ts` — `richtext()` factory
- [ ] `packages/core/src/fields/richtext/validator.ts` + `validator.test.ts` — `v.array(v.any())`
- [ ] `packages/core/src/fields/richtext/inputSchema.ts` + `inputSchema.test.ts` — shallow node check, `ignoreRequired`
- [ ] `packages/core/src/fields/richtext/utils.ts` + `utils.test.ts` — `richTextToPlainText`
- [ ] `packages/core/src/fields/richtext/index.ts` barrel

#### packages/core/src/fields/constants.ts

1 edit — everything else in this file is unchanged.

**1 — real `richtext` entry.** Replace the commented-out placeholder immediately
after the `upload` entry:

```ts
  richtext: {
    type: "richtext",
    interfaceType: "RichTextDocument",
    validator: "v.array(\nv.any()\n)",
    defaultValue: [],
  },
```

#### packages/core/src/fields/richtext/types.ts

2 edits — Step 1's `RichTextText`, `RichTextElement`, `RichTextDocument` are
unchanged; everything else in this file not shown is unchanged.

**1 — new imports.** Alongside Step 1's node-shape types, add:

```ts
import { ADMIN_FIELDS } from "../constants";
import { BaseField, BaseFieldInput, FieldValidateProps } from "../baseTypes";
import type { VexResourceSlug } from "../../types/generated";
```

**2 — `RichTextFieldInput` and `RichTextField`.** After `RichTextDocument`, add:

````ts
/**
 * Configuration input for a `richtext()` field.
 *
 * Richtext fields store a single locale-agnostic {@link RichTextDocument} — an
 * array of block-level nodes. Shape is validated structurally on save (array of
 * `{ type, children }` elements and `{ text }` leaves, any depth); the specific
 * node catalogue (headings, links, images, tables, …) is owned by whichever
 * `editor` adapter is configured on `VexClientConfig`, never by core.
 *
 * **Defaults applied by `richtext()`:**
 * ```ts
 * {
 *   type:     "richtext",
 *   label:    "",       // inferred from the field key by defineCollection
 *   required: false,    // field is optional by default
 *   defaultValue: [],   // empty document
 *   admin: {
 *     hidden:        false,   // visible in the admin form
 *     readOnly:      false,   // editable by default
 *     position:      "main",  // placed in the main content column, not the sidebar
 *     width:         "full",  // spans the full form width, not half
 *     cellAlignment: "left",  // excerpt aligned left in the data table column
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * // Minimal — label inferred from the key ("Body")
 * body: richtext()
 *
 * // Required — at least one node's plain-text excerpt must be non-empty
 * summary: richtext({ required: true })
 * ```
 *
 * @see {@link BaseFieldInput} for shared properties (`label`, `description`, `required`, `admin`, `index`, `searchIndex`)
 */
export interface RichTextFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseFieldInput<TCollectionSlug, TFieldMeta> {
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Does not affect existing database values.
   */
  defaultValue?: RichTextDocument;
  /** Server-only async validation with `value` typed as `RichTextDocument`. @see {@link FieldValidate} */
  validate?(
    props: FieldValidateProps<TCollectionSlug, RichTextDocument>,
  ): Promise<void> | void;
}

/**
 * Resolved configuration for a `richtext()` field, after all defaults are applied.
 *
 * This is the type framework adapters and field components receive —
 * `fieldDef` in `InputComponentProps<RichTextField>` and
 * `CellComponentProps<RichTextField>` is this type.
 *
 * @see {@link RichTextFieldInput} for the user-facing input type
 * @see {@link richtext} for the config function that produces this type
 */
export interface RichTextField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
> extends BaseField<TCollectionSlug, TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.richtext.type;
  /**
   * Pre-filled value shown in the admin form when creating a new document.
   * Defaults to `[]` — an empty document.
   */
  defaultValue?: RichTextDocument;
  /** Server-only async validation with `value` typed as `RichTextDocument`. @see {@link FieldValidate} */
  validate?(
    props: FieldValidateProps<TCollectionSlug, RichTextDocument>,
  ): Promise<void> | void;
}
````

#### packages/core/src/fields/richtext/config.ts

````ts
import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { VexResourceSlug } from "../../types/generated";
import type { RichTextFieldInput, RichTextField } from "./types";

/**
 * Creates a richtext field with all defaults applied.
 *
 * Richtext fields store a single locale-agnostic rich-text document — body
 * copy, article content, anything requiring headings, marks, and inline
 * media rather than a plain string. Editing requires a configured `editor`
 * adapter on `VexClientConfig` (e.g. `editor: plateEditor()`); the admin
 * `Input` renders a configuration error, not markup, when it is absent.
 *
 * Accepts {@link RichTextFieldInput} (all optional) and returns
 * {@link RichTextField} with all defaults applied.
 *
 * **Defaults applied:**
 * - `label` — `""` (inferred from the field key by `defineCollection`)
 * - `required` — `false`
 * - `defaultValue` — `[]`
 * - `admin.hidden` — `false`
 * - `admin.readOnly` — `false`
 * - `admin.position` — `"main"`
 * - `admin.width` — `"full"`
 * - `admin.cellAlignment` — `"left"`
 *
 * @param options - Richtext field configuration. All properties are optional.
 * @returns Resolved richtext field definition with all defaults applied.
 *
 * @example
 * ```ts
 * import { richtext, defineCollection } from '@vexcms/core'
 *
 * posts: defineCollection({
 *   fields: {
 *     // Minimal — label inferred from key ("Body")
 *     body: richtext(),
 *
 *     // Required field, e.g. an article summary
 *     excerpt: richtext({ required: true }),
 *   }
 * })
 * ```
 *
 * @see {@link RichTextFieldInput} for the full input type
 * @see {@link RichTextField} for the resolved output type
 */
export function richtext<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>(
  options?: RichTextFieldInput<TCollectionSlug, TFieldMeta>,
): RichTextField<TCollectionSlug, TFieldMeta> {
  // TODO: implement
  // 1. Return the resolved field, mirroring `text()`/`color()`:
  //    a. `type: ADMIN_FIELDS.richtext.type`
  //    b. `interfaceType: ADMIN_FIELDS.richtext.interfaceType`
  //    c. `label: ""`, `required: false`, `defaultValue:
  //       ADMIN_FIELDS.richtext.defaultValue`, then `...options` (spread
  //       last so any explicit option wins).
  //    d. `admin:` the standard five-key default block (`hidden: false`,
  //       `readOnly: false`, `position: "main"`, `width: "full"`,
  //       `cellAlignment: "left"`, plus `placeholder: ""`), then
  //       `...options?.admin`.
  //    e. `meta: { ...options?.meta } as TFieldMeta`.
  throw new Error("Not implemented");
}
````

#### packages/core/src/fields/richtext/config.test.ts

```ts
import { describe, it, expect } from "vitest";
import { richtext } from "./config";

describe("richtext", () => {
  it("defaults to an empty document", () => {
    const field = richtext();

    expect(field.type).toBe("richtext");
    expect(field.interfaceType).toBe("RichTextDocument");
    expect(field.required).toBe(false);
    expect(field.defaultValue).toEqual([]);
  });

  it("keeps an explicit defaultValue", () => {
    const document = [{ type: "p", children: [{ text: "Hello" }] }];
    const field = richtext({ defaultValue: document });

    expect(field.defaultValue).toEqual(document);
  });

  it("applies the same admin defaults as every other field", () => {
    const field = richtext();

    expect(field.admin).toEqual({
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
    });
  });

  it("keeps required: true when set", () => {
    const field = richtext({ required: true });

    expect(field.required).toBe(true);
  });
});
```

#### packages/core/src/fields/richtext/validator.ts

````ts
import { ADMIN_FIELDS } from "../constants";
import { applyBaseValidators } from "../validators/utils";
import { fieldValidator, type FieldValidate } from "../baseTypes";
import type { CollectionSlug } from "../../types/generated";
import type { RichTextField, RichTextDocument } from "./types";

/**
 * Converts a richtext field definition to a Convex schema validator string.
 *
 * Richtext documents are stored as `v.array(v.any())` — Convex validators
 * cannot express the recursive element/leaf shape, so the element-level
 * contract (every array entry is either `{ type, children }` or `{ text }`)
 * is enforced only by {@link richTextFieldToInputSchema}, not the database
 * schema. `v.string()` is deliberately NOT used: that would force a
 * JSON.parse/stringify round trip on every read and write path and would
 * still need an `any`-shaped parsed value, with no structural gain.
 *
 * @param props - Input props.
 * @param props.field - The resolved richtext field definition.
 * @returns Convex validator string: `"v.array(\nv.any()\n)"` for required
 * fields, `"v.optional(v.array(\nv.any()\n))"` for optional fields.
 *
 * @example
 * ```ts
 * richTextFieldToValidator({ field: richtext({ required: true }) })   // "v.array(\nv.any()\n)"
 * richTextFieldToValidator({ field: richtext({ required: false }) })  // "v.optional(v.array(\nv.any()\n))"
 * ```
 *
 * @see {@link richTextFieldToInputSchema} for the admin-form Zod schema that enforces node shape
 * @internal Used by schema generation, not typically called directly.
 */
export function richTextFieldToValidator(props: {
  field: RichTextField;
}): string {
  // TODO: implement
  // 1. `return applyBaseValidators({ field: props.field, validator:
  //    ADMIN_FIELDS.richtext.validator });`
  throw new Error("Not implemented");
}

/**
 * Types a `richtext()` field's `validate()` against a real collection and
 * `DataModel`, with `value` fixed to `RichTextDocument`. @see {@link fieldValidator}
 *
 * @param slug - The owning collection's slug, used only to infer `TCollectionSlug`.
 * @param fn - The validate callback, checked against the collection's real document shape and `value` type.
 * @returns The same function, re-typed to the field's loose public `validate` signature.
 */
export function richTextValidator<TCollectionSlug extends CollectionSlug>(
  slug: TCollectionSlug,
  fn: FieldValidate<TCollectionSlug, RichTextDocument, RichTextField>,
): FieldValidate<TCollectionSlug, RichTextDocument> {
  // TODO: implement
  // 1. `return fieldValidator<TCollectionSlug, RichTextDocument,
  //    RichTextField>(slug, fn);`
  throw new Error("Not implemented");
}
````

#### packages/core/src/fields/richtext/validator.test.ts

```ts
import { describe, it, expect } from "vitest";
import { richtext } from "./config";
import { richTextFieldToValidator } from "./validator";

describe("richTextFieldToValidator", () => {
  it("generates the array validator for required fields", () => {
    expect(
      richTextFieldToValidator({ field: richtext({ required: true }) }),
    ).toBe("v.array(\nv.any()\n)");
  });

  it("wraps optional fields in v.optional()", () => {
    expect(
      richTextFieldToValidator({ field: richtext({ required: false }) }),
    ).toBe("v.optional(v.array(\nv.any()\n))");
  });

  it("ignores defaultValue — defaults are a form concern, not a schema one", () => {
    expect(
      richTextFieldToValidator({
        field: richtext({
          required: true,
          defaultValue: [{ type: "p", children: [{ text: "Hi" }] }],
        }),
      }),
    ).toBe("v.array(\nv.any()\n)");
  });
});
```

#### packages/core/src/fields/richtext/inputSchema.ts

````ts
import * as z from "zod";
import type { ZodType } from "zod";
import type { RichTextField, RichTextDocument } from "./types";
import { applyBaseInputSchemaMeta } from "../inputSchemas/utils";
import { richTextToPlainText } from "./utils";

/**
 * Builds a Zod schema for validating a richtext field value in the admin form.
 *
 * Checks shape only, not Plate's full node catalogue: every array item is
 * either an element (`{ type: string, children: [...] }`, recursive) or an
 * inline leaf (`{ text: string }`), with every other key passed through
 * unchanged — Plate attaches feature-specific props (`url`, `bold`,
 * `mediaId`, …) to the same nodes, and this schema only needs to agree with
 * Plate on the two keys core actually reads ({@link richTextToPlainText}'s
 * `text`/`children`). This keeps core independent of whichever `editor`
 * adapter is configured.
 *
 * `required` means at least one node's accumulated plain text
 * ({@link richTextToPlainText}) is non-empty — a document holding only empty
 * paragraphs is shape-valid but fails the required check, the same way an
 * empty string fails `text()`'s required check (CORE-1). Richtext has no own
 * `ignoreRequired` parameter: it is a leaf field type like
 * `uploadFieldToInputSchema`, not a `group`/`array`/`blocks` container with
 * sub-fields to recurse into — a draft-lenient pass reaches it the same way
 * it reaches `upload`, via `adminFieldToInputSchema`'s own
 * `{ ...field, required: false }` override before dispatch (wired when this
 * field joins that switch in Step 3).
 *
 * @param props - Input props.
 * @param props.field - The resolved richtext field definition.
 * @returns A Zod array schema with optionality and the required content check applied.
 *
 * @example
 * ```ts
 * const field = richtext({ required: true })
 * richTextFieldToInputSchema({ field })
 * // rejects [], [{ type: "p", children: [{ text: "" }] }]
 * // accepts [{ type: "p", children: [{ text: "Hello" }] }]
 * ```
 */
export function richTextFieldToInputSchema(props: {
  field: RichTextField;
}): ZodType {
  const { field } = props;
  // TODO: implement
  // 1. Define the leaf/element Zod schemas via `z.lazy` recursion so each
  //    element's `children` can hold either kind, at any depth:
  //    a. `const richTextTextSchema: ZodType = z.looseObject({ text:
  //       z.string() });`
  //    b. `const richTextElementSchema: ZodType = z.lazy(() =>
  //       z.looseObject({ type: z.string(), children:
  //       z.array(z.union([richTextElementSchema, richTextTextSchema])) }));`
  //       → `.looseObject` keeps every Plate-specific key intact rather than
  //       stripping it.
  // 2. `const requiredError = "This field is required.";`
  // 3. `const baseSchema = z.array(richTextElementSchema);`
  // 4. Build `inputSchema`:
  //    a. `!field.required` → `baseSchema.default(field.defaultValue ?? [])`
  //    b. `field.required` → `baseSchema.superRefine((value, ctx) => {
  //       if (richTextToPlainText({ document: value as RichTextDocument
  //       }).length === 0) ctx.addIssue({ code: "custom", message:
  //       requiredError }); })` → no `.default()` on the required branch,
  //       matching every other required field (`applyBaseInputSchemaMeta`'s
  //       `.optional()` gate).
  // 5. → `return applyBaseInputSchemaMeta({ field, inputSchema });`
  // Edge cases:
  // - `[]` → shape-valid, fails the required check in step 4b (empty plain text).
  // - A node missing `children`/`text` → rejected by step 1's shape schemas.
  // - A non-array value → rejected by `z.array` in step 3.
  throw new Error("Not implemented");
}
````

#### packages/core/src/fields/richtext/inputSchema.test.ts

```ts
import { describe, it, expect } from "vitest";
import { richtext } from "./config";
import { richTextFieldToInputSchema } from "./inputSchema";
import type { RichTextDocument } from "./types";

const DOCUMENT: RichTextDocument = [
  { type: "p", children: [{ text: "Hello world" }] },
];

const EMPTY_DOCUMENT: RichTextDocument = [
  { type: "p", children: [{ text: "" }] },
];

describe("richTextFieldToInputSchema", () => {
  it("accepts a well-formed document", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse(DOCUMENT).success).toBe(true);
  });

  it("passes through extra keys Plate attaches to elements and leaves", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });
    const document = [
      {
        type: "img",
        url: "https://example.com/a.png",
        mediaId: "abc123",
        children: [{ text: "", bold: true }],
      },
    ];

    expect(schema.safeParse(document).success).toBe(true);
  });

  it("rejects a node missing children", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse([{ type: "p" }]).success).toBe(false);
  });

  it("rejects a non-array value", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse({ type: "p", children: [] }).success).toBe(false);
  });

  it("rejects an empty document when required", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse([]).success).toBe(false);
  });

  it("rejects a required document whose only content is empty paragraphs (CORE-1)", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: true }),
    });

    expect(schema.safeParse(EMPTY_DOCUMENT).success).toBe(false);
  });

  it("accepts an empty document when not required", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: false }),
    });
    const parsed = schema.safeParse([]);

    expect(parsed.success).toBe(true);
    expect(parsed.data).toEqual([]);
  });

  it("honors a draft-lenient required override the same way Step 3's dispatcher ignoreRequired will", () => {
    const schema = richTextFieldToInputSchema({
      field: richtext({ required: false }),
    });

    expect(schema.safeParse(EMPTY_DOCUMENT).success).toBe(true);
  });
});
```

#### packages/core/src/fields/richtext/utils.ts

````ts
import type { RichTextDocument, RichTextElement, RichTextText } from "./types";

/**
 * Flattens one richtext node (element or leaf) to its plain-text content.
 *
 * Inline children (an element's own `children`) concatenate with no
 * separator — adjacent text runs and inline marks (bold, a link's leaf text)
 * belong to the same visual line and must not gain a space neither side
 * wrote. The space between distinct top-level nodes is added one level up,
 * by {@link richTextToPlainText}.
 *
 * @param node - A `RichTextElement` or `RichTextText` node.
 * @returns The leaf's own text, or an element's children concatenated.
 */
function nodeToPlainText(node: RichTextElement | RichTextText): string {
  // TODO: implement
  // 1. `"text" in node && typeof node.text === "string"` → return
  //    `node.text` — leaf node, nothing further to recurse into.
  // 2. Else (`node` is a `RichTextElement`) → return
  //    `node.children.map(nodeToPlainText).join("")`.
  throw new Error("Not implemented");
}

/**
 * Flattens a richtext document to a plain-text excerpt.
 *
 * Joins every top-level node's own text (via {@link nodeToPlainText}, which
 * concatenates inline children with no separator) with a single space
 * between nodes — the document's blocks — then trims the result and
 * truncates to `maxLength` with a trailing `"…"` when the text is longer.
 * Used by the admin data table cell (never renders markup) and by
 * {@link richTextFieldToInputSchema}'s `required` check (a document whose
 * only content is empty paragraphs has an empty plain-text excerpt).
 *
 * @param props - Input props.
 * @param props.document - The richtext document to flatten.
 * @param props.maxLength - When set, the excerpt is truncated to this many
 *   characters (trailing whitespace trimmed first) with a `"…"` appended.
 *   Omitted → the full excerpt is returned.
 * @returns The plain-text excerpt, or `""` for an empty document.
 *
 * @example
 * ```ts
 * richTextToPlainText({
 *   document: [{ type: "p", children: [{ text: "Hello world" }] }],
 * }) // "Hello world"
 *
 * richTextToPlainText({
 *   document: [{ type: "p", children: [{ text: "Hello world" }] }],
 *   maxLength: 8,
 * }) // "Hello wo…"
 * ```
 */
export function richTextToPlainText(props: {
  document: RichTextDocument;
  maxLength?: number;
}): string {
  // TODO: implement
  // 1. `const text = props.document.map(nodeToPlainText).join(" ").trim();`
  // 2. `props.maxLength === undefined || text.length <= props.maxLength` →
  //    return `text` unchanged.
  // 3. Else → return `` `${text.slice(0, props.maxLength).trimEnd()}…` ``.
  // Edge cases:
  // - Empty document (`[]`) → step 1 produces `""`, returned as-is by step 2.
  // - `maxLength: 0` → step 3 slices to `""`, returns `"…"`.
  throw new Error("Not implemented");
}
````

#### packages/core/src/fields/richtext/utils.test.ts

```ts
import { describe, it, expect } from "vitest";
import { richTextToPlainText } from "./utils";
import type { RichTextDocument } from "./types";

const PARAGRAPH_WITH_LINK: RichTextDocument[number] = {
  type: "p",
  children: [
    { text: "Visit " },
    { type: "a", url: "https://vexcms.dev", children: [{ text: "our site" }] },
    { text: "." },
  ],
};

const DOCUMENT: RichTextDocument = [
  PARAGRAPH_WITH_LINK,
  { type: "p", children: [{ text: "Second paragraph." }] },
];

describe("richTextToPlainText", () => {
  it("joins text leaves within a block with no separator, including nested inline elements", () => {
    expect(richTextToPlainText({ document: [PARAGRAPH_WITH_LINK] })).toBe(
      "Visit our site.",
    );
  });

  it("joins top-level blocks with a single space", () => {
    expect(richTextToPlainText({ document: DOCUMENT })).toBe(
      "Visit our site. Second paragraph.",
    );
  });

  it("returns an empty string for an empty document", () => {
    expect(richTextToPlainText({ document: [] })).toBe("");
  });

  it("returns an empty string for a document whose only content is empty paragraphs", () => {
    expect(
      richTextToPlainText({
        document: [{ type: "p", children: [{ text: "" }] }],
      }),
    ).toBe("");
  });

  it("truncates with a trailing ellipsis, trimming trailing whitespace before it", () => {
    expect(
      richTextToPlainText({ document: [PARAGRAPH_WITH_LINK], maxLength: 8 }),
    ).toBe("Visit ou…");
  });

  it("does not truncate when the excerpt is within maxLength", () => {
    expect(
      richTextToPlainText({ document: [PARAGRAPH_WITH_LINK], maxLength: 100 }),
    ).toBe("Visit our site.");
  });
});
```

#### packages/core/src/fields/richtext/index.ts

```ts
// Re-export the factory function
export * from "./config";
export * from "./types";
export * from "./validator";
export * from "./inputSchema";
export * from "./utils";
```

**Part B — registration and admin components**

Adding `richtext` to `ADMIN_FIELDS`/`AdminField` makes every exhaustive `Record<AdminFieldType, …>`
map and `never`-terminated `switch` in `@vexcms/core` and `@vexcms/react` fail until a case is added
for it — this step is the one atomic change that adds every one of those cases plus the full react
field module (`Input`/`Cell`/`columnDef`/fixtures), so the build stays green start to finish. The
react `Input` is the only guided stub in this step: it is the first place `config.editor` (Step 2) is
actually read, and the "missing `editor`" configuration-error path (Design Decision 7) is real
product behavior worth the developer's own judgement on copy/markup. Everything else here —
registries, the adapter map, the fixture aggregate, `Cell`/`columnDef`, and the interface-generation
fix — is mechanical wiring and ships complete.

`collectionConfigToInterface` (`packages/core/src/collections/interfaceGen.ts`) and
`childInterfaceType` (`packages/core/src/fields/childInterfaceType.ts`) need **no changes**: both
already fall through to `field.interfaceType` for any field type they don't special-case, so a
`richtext` field's `"RichTextDocument"` interface-type string flows through unchanged, at any depth
(top-level, or nested inside `group`/`array`/`blocks`, exactly as `select`'s literal union already
does). The one real gap is `generateVexTypes.ts`'s **static** header import — it names `VexDocument`/
`VexDocumentGlobal` unconditionally but has no way to know a generated interface will reference
`RichTextDocument` too, so every project with a richtext field got an unresolved-symbol error in its
generated `vex.types.ts` until this step's fix.

- [ ] `packages/core/src/fields/types.ts` — `RichTextField` joins `AdminField`
- [ ] `packages/core/src/fields/index.ts` — `export * from "./richtext"`
- [ ] `packages/core/src/fields/validators/index.ts` + `inputSchemas/index.ts` — new cases
- [ ] `packages/core/src/types/generateVexTypes.ts` + `generateVexTypes.test.ts` — conditional `RichTextDocument` import
- [ ] `packages/react/src/components/fields/richtext/` — `Input.tsx`, `Cell.tsx`, `columnDef.tsx`, `testFixture.ts`, `index.ts` + `Input.test.tsx`, `Cell.test.tsx`, `columnDef.test.ts`
- [ ] `packages/react/src/components/fields/index.tsx` — both registries + column-def switch
- [ ] `packages/react/src/adapter.ts` — `reactAdapter.fields.richtext`
- [ ] `packages/react/src/testing/fixtures/index.ts` — aggregate the fixture
- [ ] `packages/react/src/testing/fieldInputContract.ts` — stub `editor` adapter on the shared test config

#### packages/core/src/fields/types.ts

2 edits — everything else unchanged.

**1 — import, beside the existing `import { GroupField } from "./group";`.**

```ts
import { RichTextField } from "./richtext";
```

**2 — `AdminField` union, beside the existing `| GroupField<VexResourceSlug, TFieldMeta>` member.**

```ts
  | GroupField<VexResourceSlug, TFieldMeta>
  | RichTextField<VexResourceSlug, TFieldMeta>;
```

#### packages/core/src/fields/index.ts

1 edit — everything else unchanged.

**1 — new barrel line, beside the existing `export * from "./upload";`.**

```ts
export * from "./richtext";
```

#### packages/core/src/fields/validators/index.ts

2 edits — everything else unchanged.

**1 — import, beside the existing `import { uploadFieldToValidator } from "../upload";`.**

```ts
import { richTextFieldToValidator } from "../richtext";
```

**2 — new `switch` case in `adminFieldToValidator`, beside the existing `case ADMIN_FIELDS.upload.type` arm, before `default`.**

```ts
    case ADMIN_FIELDS.richtext.type:
      return richTextFieldToValidator({ field: props.field });
```

#### packages/core/src/fields/inputSchemas/index.ts

2 edits — everything else unchanged.

**1 — import, beside the existing `import { uploadFieldToInputSchema } from "../upload";`.**

```ts
import { richTextFieldToInputSchema } from "../richtext";
```

**2 — new `switch` case in `adminFieldToInputSchema`, beside the existing `case ADMIN_FIELDS.upload.type` arm, before `default`. `richtext` is a leaf type — no `ignoreRequired` thread-through, same as `upload`; the dispatcher's own `effectiveField` override (top of the function) already honors it.**

```ts
    case ADMIN_FIELDS.richtext.type:
      return richTextFieldToInputSchema({ field: effectiveField });
```

#### packages/core/src/types/generateVexTypes.ts

2 edits — everything else unchanged.

**1 — two new imports, beside the existing `import { fieldsToFieldTypeMap } from "../fields";` and `import type { VexConfig } from "../config/types";`.**

```ts
import { ADMIN_FIELDS } from "../fields";
import type { CollectionConfig } from "../collections/types";
```

**2 — new helper above `generateVexTypes`, and `generateVexTypes` itself reorders `allCollections` before `typesHeader` so the header's import line can be conditional. Shown complete — the whole function's top changes, not just one line.**

```ts
/**
 * Whether any field in `fields`, at any depth, is a `richtext` field —
 * including fields nested inside `group`, `array` items, and `blocks`.
 *
 * `vex.types.ts`'s header imports are static text, built before any
 * collection's interface body is generated. A richtext field anywhere in the
 * config means some generated interface in the file names `RichTextDocument`,
 * so the header needs to import it from `@vexcms/core` — this walk is what
 * decides whether to add that import line.
 *
 * @param fields - The field map to walk (collection-, global-, or
 *   nested-level — the same shape at every depth).
 * @returns `true` when a `richtext` field exists anywhere in the tree.
 */
function hasRichTextField(fields: AdminField[]): boolean {
  return Object.values(fields).some((field) => {
    if (field.type === ADMIN_FIELDS.richtext.type) return true;
    if (field.type === ADMIN_FIELDS.group.type) return hasRichTextField(field.fields);
    if (field.type === ADMIN_FIELDS.array.type) {
      return field.items.type === ADMIN_FIELDS.group.type
        ? hasRichTextField(field.items.fields)
        : field.items.type === ADMIN_FIELDS.richtext.type;
    }
    if (field.type === ADMIN_FIELDS.blocks.type) {
      return field.blocks.some((block) => hasRichTextField(block.fields));
    }
    return false;
  });
}

export function generateVexTypes(props: { config: VexConfig }): string {
  const { config } = props;
  const allCollections = config.collections.concat(config.mediaCollections);
  const needsRichTextImport =
    allCollections.some((c) => hasRichTextField(c.fields)) ||
    config.globals.some((g) => hasRichTextField(g.fields));

  const typesHeader = `// ⚠️ AUTO-GENERATED BY VEX CMS — DO NOT EDIT ⚠️
    // Run 'vex dev' or 'vex generate' to update this file.\n
    /* eslint-disable perfectionist/sort-union-types */
    /* eslint-disable perfectionist/sort-interfaces */
    /* eslint-disable perfectionist/sort-modules */
    /* eslint-disable perfectionist/sort-object-types */
    /* eslint-disable @typescript-eslint/no-empty-object-type */\n\n
    import type { DataModel, Id } from "@convex/_generated/dataModel"
    import type { VexDocument, VexDocumentGlobal${needsRichTextImport ? ", RichTextDocument" : ""} } from "@vexcms/core"\n
  `;

  const hasCollections = allCollections.length > 0;
  const hasGlobals = config.globals.length > 0;

  const interfaceBlocks = allCollections
    .map((collection) => collectionConfigToInterface({ collection }))
    .concat(config.globals.map((global) => globalConfigToInterface({ global })));
```

Everything below this point (`collectionSlugs` through the function's final `return [...]`) is
unchanged — it already reads `allCollections`/`hasCollections`/`hasGlobals`/`interfaceBlocks` from
local variables, which still exist with the same names and values after the reorder above.

#### packages/core/src/types/generateVexTypes.test.ts

1 edit — new `describe` block, everything else unchanged. Inserted after the existing `describe("generateVexTypes — header", ...)` block.

```ts
import { group } from "../fields/group/config";
import { richtext } from "../fields/richtext/config";

// ─── richtext import ───────────────────────────────────────────────────────

describe("generateVexTypes — richtext import", () => {
  it("does NOT import RichTextDocument when no field uses it", () => {
    const config = defineServerConfig({
      config: defineConfig({
        collections: [
          defineCollection({
            slug: "posts",
            fields: { title: text({ required: true }) },
          }),
        ],
      }),
    });
    const output = generateVexTypes({ config });
    expect(output).not.toContain("RichTextDocument");
  });

  it("imports RichTextDocument from @vexcms/core when a collection field is richtext", () => {
    const config = defineServerConfig({
      config: defineConfig({
        collections: [
          defineCollection({
            slug: "posts",
            fields: { body: richtext({ required: true, label: "Body" }) },
          }),
        ],
      }),
    });
    const output = generateVexTypes({ config });
    expect(output).toContain(
      'import type { DataModel, Id } from "@convex/_generated/dataModel"',
    );
    expect(output).toContain(
      'import type { VexDocument, VexDocumentGlobal, RichTextDocument } from "@vexcms/core"',
    );
    expect(output).toContain("body: RichTextDocument");
  });

  it("imports RichTextDocument when a richtext field is nested inside a group", () => {
    const config = defineServerConfig({
      config: defineConfig({
        collections: [
          defineCollection({
            slug: "pages",
            fields: {
              hero: group({
                label: "Hero",
                fields: { body: richtext({ label: "Body" }) },
              }),
            },
          }),
        ],
      }),
    });
    const output = generateVexTypes({ config });
    expect(output).toContain("RichTextDocument");
  });
});
```

#### packages/react/src/components/fields/richtext/Input.tsx

New file. Guided stub — the developer implements the render body; everything else in this step ships
complete.

````tsx
"use client";

import type { ComponentType } from "react";
import {
  type RichTextDocument,
  type RichTextField,
  type VexEditorComponentProps,
} from "@vexcms/core";
import { createFieldInput } from "../../form/createFieldInput";
import { FormDescription } from "../../form/FormDescription";
import { FormError } from "../../form/FormError";
import { useVexConfig } from "../../../context/VexConfigContext";

/**
 * Rich text field input component for the admin edit form.
 *
 * Reads the configured editor adapter from `useVexConfig().editor` and
 * renders its `editorComponent` — VexCMS ships no editor of its own
 * (`@vexcms/richtext-plate`'s `plateEditor()` is the reference adapter); a
 * project with a `richtext()` field but no `editor:` entry in `vex.config.ts`
 * sees a configuration error here, never a crash or a silent plain-text
 * fallback (Design Decision 7).
 *
 * Renders inside a `role="group" aria-labelledby` wrapper (LABEL-1), like
 * `array`/`group`/`blocks`/`upload`: the editor adapter's root element is
 * never a single native form control a `<label htmlFor>` could point at.
 *
 * Must be rendered inside `<AppForm>`, or receive an explicit `field` prop
 * (`TypedFieldApi<RichTextDocument>`) from a `<form.Field>` render prop.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <RichTextFieldInput name="body" fieldDef={bodyField} readOnly={false} />
 * </AppForm>
 * ```
 */
export const RichTextFieldInput = createFieldInput<
  RichTextDocument,
  {},
  RichTextField
>(({ name, readOnly, fieldDef, field, index, submissionAttempts }) => {
  // TODO: implement
  // 1. `const config = useVexConfig();`
  // 2. When `config.editor` is undefined:
  //    → render a `role="group" aria-labelledby={`${name}-label`}` wrapper
  //      containing the field's own label markup plus a `role="alert"`
  //      message naming `editor: plateEditor()` and this field's key, then
  //      `return` early. Never throw — a missing editor is a configuration
  //      mistake the admin panel should still render around.
  // 3. Resolve the editor component:
  //    `const EditorComponent = config.editor.editorComponent as ComponentType<VexEditorComponentProps>;`
  //    → the cast is required: `config.editor`'s component slot resolves
  //      through the opaque `ComponentHKT` default unless `VexClientConfig`
  //      threads a concrete `TComponent`, the same reason
  //      `components/fields/index.tsx`'s `fieldInputComponents`/
  //      `fieldCellComponents` registries cast every entry to
  //      `ComponentType<...>`.
  // 4. Render the `role="group" aria-labelledby` wrapper containing:
  //    a. the field's own label markup (id `${name}-label`)
  //    b. `<EditorComponent
  //         value={field.state.value ?? fieldDef.defaultValue}
  //         onChange={(next) => field.handleChange(next)}
  //         readOnly={readOnly || fieldDef.admin.readOnly}
  //         name={name}
  //         label={fieldDef.label}
  //         description={fieldDef.description}
  //         placeholder={fieldDef.admin.placeholder}
  //       />`
  //       → media props (`mediaCollectionSlug`, `mediaResults`,
  //         `onMediaSearchChange`, `generateUploadUrl`,
  //         `createMediaDocument`, …) are wired in Step 5 from
  //         `fieldDef.mediaCollectionSlug` and the existing upload/
  //         MediaPicker hooks; every one of them is optional on
  //         `VexEditorComponentProps` and may be omitted here — an
  //         adapter with no media props sees them as `undefined` and
  //         hides its image feature (Design Decision 6)
  //    c. `<FormDescription field={fieldDef} />`
  //    d. `<FormError field={field} submissionAttempts={submissionAttempts} />`
  // Edge cases:
  // - `config.editor` undefined → configuration error naming
  //   `editor: plateEditor()`, never a crash or silent fallback.
  // - `fieldDef.admin.readOnly` OR the `readOnly` prop disables editing (OR
  //   composition, matching every other field type).
  // - `index` (array-item numbering) is accepted for signature parity with
  //   every other field input but has no richtext-specific behavior yet —
  //   forward it to the label markup exactly as `FormLabel` does elsewhere.
  throw new Error("Not implemented");
});
````

#### packages/react/src/components/fields/richtext/Cell.tsx

New file, complete.

````tsx
import {
  addLeadingSlash,
  richTextToPlainText,
  TDocument,
  type CellComponentProps,
  type RichTextField,
} from "@vexcms/core";
import { VexLink } from "../../ui";
import { useVexConfig } from "../../../context/VexConfigContext";

/** Max characters shown in the cell's visible excerpt — matches `text/Cell.tsx`'s own cutoff. */
const RICHTEXT_CELL_EXCERPT_LENGTH = 77;

/**
 * Rich text field cell component for the data-table list view.
 *
 * Renders a plain-text excerpt of the stored document — never markup (Design
 * Decision 5) — via `richTextToPlainText`. The visible text is cut to
 * {@link RICHTEXT_CELL_EXCERPT_LENGTH} characters; the full plain-text
 * conversion is kept on the `title` attribute for hover, same contract as
 * `text/Cell.tsx`. An empty or missing document shows an em-dash.
 *
 * @param props - Component props.
 * @param props.value - Raw `RichTextDocument` from the document (may be null/undefined).
 * @param props.fieldDef - Resolved `RichTextField` definition.
 * @returns The cell component for this field type, or an em-dash placeholder for an empty value.
 *
 * @example
 * ```tsx
 * <RichTextFieldCell value={doc.body} fieldDef={bodyField} row={row} isTitleField={false} />
 * ```
 */
export function RichTextFieldCell<TData extends TDocument = TDocument>(
  props: CellComponentProps<RichTextField, TData>,
) {
  const config = useVexConfig();
  const basePath = addLeadingSlash(config.basePath);
  const fullText = props.value
    ? richTextToPlainText({ document: props.value })
    : "";
  if (!fullText) return <span>—</span>;
  const excerpt =
    fullText.length > RICHTEXT_CELL_EXCERPT_LENGTH
      ? richTextToPlainText({
          document: props.value as NonNullable<typeof props.value>,
          maxLength: RICHTEXT_CELL_EXCERPT_LENGTH,
        })
      : fullText;
  const content = <span title={fullText}>{excerpt}</span>;
  if (!props.isTitleField) return content;
  return (
    <VexLink
      href={`${basePath}/${props.collection.slug}/${props.row.original._id}`}
    >
      {content}
    </VexLink>
  );
}
````

#### packages/react/src/components/fields/richtext/columnDef.tsx

New file, complete.

````tsx
import type { ColumnDef } from "@tanstack/react-table";
import type {
  CollectionConfig,
  RichTextDocument,
  RichTextField,
  TDocument,
} from "@vexcms/core";
import { RichTextFieldCell } from "./Cell";

/**
 * Creates a TanStack Table column definition for a richtext field.
 *
 * Generates column config with proper typing, cell renderer, alignment, and
 * metadata. Uses `RichTextFieldCell` for rendering — a plain-text excerpt.
 * Sorting is disabled: a `RichTextDocument` has no meaningful lexicographic
 * order as stored (an array of nodes, not a string).
 *
 * @param props - Column generation props.
 * @param props.fieldDef - Resolved richtext field definition.
 * @param props.fieldKey - Field key from `collection.fields`.
 * @param props.isTitleField - Whether this is the title field (`useAsTitle`).
 * @param props.collection - Parent collection config, forwarded to `RichTextFieldCell`.
 * @returns TanStack Table column definition typed to `ColumnDef<TDocument, RichTextDocument>`.
 *
 * @example
 * ```ts
 * const column = richTextFieldToColumnDef({
 *   fieldDef: collection.fields.body,
 *   fieldKey: "body",
 *   isTitleField: false,
 *   collection,
 * });
 * ```
 */
export function richTextFieldToColumnDef<
  TData extends TDocument = TDocument,
>(props: {
  fieldDef: RichTextField;
  fieldKey: string;
  collection: CollectionConfig;
  isTitleField?: boolean;
}): ColumnDef<TData, RichTextDocument> {
  return {
    id: props.fieldKey,
    accessorKey: props.fieldKey,
    header: props.fieldDef.label || props.fieldKey,

    cell: ({ row }) => {
      const value = row.getValue(props.fieldKey) as
        RichTextDocument | undefined;
      return (
        <RichTextFieldCell
          value={value ?? []}
          row={row}
          collection={props.collection}
          fieldDef={props.fieldDef}
          fieldKey={props.fieldKey}
          isTitleField={props.isTitleField ?? false}
        />
      );
    },

    enableSorting: false,
    enableHiding: true,

    meta: {
      label: props.fieldDef.label || props.fieldKey,
      align: props.fieldDef.admin.cellAlignment,
      isTitleField: props.isTitleField ?? false,
    },
  };
}
````

#### packages/react/src/components/fields/richtext/testFixture.ts

New file, complete.

```ts
import {
  ADMIN_FIELDS,
  richtext,
  type RichTextDocument,
  type RichTextField,
} from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/** A representative two-paragraph document — enough to exercise the cell's plain-text excerpt. */
const VALID_DOCUMENT: RichTextDocument = [
  { type: "p", children: [{ text: "Hello world" }] },
  { type: "p", children: [{ text: "Second paragraph." }] },
];

/** Fixture for the `richtext` field type — `required: true` makes `invalid` (`undefined`) a real validation failure. */
export const richTextFieldFixture: FieldFixture<
  RichTextField,
  RichTextDocument
> = {
  fieldType: ADMIN_FIELDS.richtext.type,
  fieldDef: richtext({ label: "Body", required: true }),
  valid: VALID_DOCUMENT,
  invalid: undefined,
  empty: [],
};
```

#### packages/react/src/components/fields/richtext/index.ts

New file, complete.

```ts
export * from "./Input";
export * from "./Cell";
export * from "./columnDef";
```

#### packages/react/src/components/fields/index.tsx

5 edits — everything else unchanged.

**1 — import, beside the existing `import { BlocksFieldCell, BlocksFieldInput, blocksFieldToColumnDef } from "./blocks";`.**

```ts
import {
  RichTextFieldCell,
  RichTextFieldInput,
  richTextFieldToColumnDef,
} from "./richtext";
```

**2 — barrel export, beside the existing `export * from "./blocks";`.**

```ts
export * from "./richtext";
```

**3 — `fieldInputComponents`, beside the existing `[ADMIN_FIELDS.upload.type]: UploadFieldInput as ComponentType<...>` entry, before the closing `};`.**

```ts
  [ADMIN_FIELDS.richtext.type]: RichTextFieldInput as ComponentType<
    InputComponentProps<BaseFieldMeta, AdminField>
  >,
```

**4 — `fieldCellComponents`, beside the existing `[ADMIN_FIELDS.upload.type]: UploadFieldCell as ComponentType<CellComponentProps<AdminField>>,` entry, before the closing `};`.**

```ts
  [ADMIN_FIELDS.richtext.type]: RichTextFieldCell as ComponentType<CellComponentProps<AdminField>>,
```

**5 — `getCollectionColumnDefs`'s `switch`, beside the existing `case ADMIN_FIELDS.upload.type` arm, before `default`.**

```ts
      case ADMIN_FIELDS.richtext.type:
        columnDefs.push(
          richTextFieldToColumnDef<TData>({
            fieldDef,
            fieldKey,
            isTitleField,
            collection,
          }),
        );
        break;

```

#### packages/react/src/adapter.ts

2 edits — everything else unchanged.

**1 — import, beside the existing `UploadFieldInput, UploadFieldCell,` in the `./components` import.**

```ts
  RichTextFieldInput,
  RichTextFieldCell,
```

**2 — `reactAdapter.fields`, beside the existing `[ADMIN_FIELDS.upload.type]: { input: UploadFieldInput, cell: UploadFieldCell },` entry, before the closing `},` of `fields`.**

```ts
    [ADMIN_FIELDS.richtext.type]: {
      input: RichTextFieldInput,
      cell: RichTextFieldCell,
    },
```

#### packages/react/src/testing/fixtures/index.ts

2 edits — everything else unchanged.

**1 — import, beside the existing `import { blocksFieldFixture } from "../../components/fields/blocks/testFixture";`.**

```ts
import { richTextFieldFixture } from "../../components/fields/richtext/testFixture";
```

**2 — `fieldFixtures`, beside the existing `blocks: blocksFieldFixture,` entry.**

```ts
  richtext: richTextFieldFixture,
```

#### packages/react/src/testing/fieldInputContract.ts

3 edits — everything else unchanged. Richtext is the first field type whose Input reads
`useVexConfig().editor`, so the shared stub config every fixture mounts against needs one — the same
reason `stubClientConfig` already carries `mediaCollections: [images]` for `upload` and `collections`
for `relationship` (see that const's own doc comment).

**1 — import additions: `ChangeEvent` on the existing `react` import, plus the editor types and `ReactHKT`.**

```ts
import {
  type ChangeEvent,
  type ComponentType,
  type ReactNode,
  createElement,
  useState,
} from "react";
```

```ts
import type { ReactHKT } from "../adapter";
```

Add `VexEditorAdapter`, `VexEditorComponentProps`, `VexRenderComponentProps`, and
`RichTextDocument` to the existing `from "@vexcms/core"` import's named list, beside `AdminField`.

**2 — new stub editor, placed immediately above the existing `stubClientConfig` declaration.**

```ts
/**
 * Minimal `VexEditorAdapter` mounted for every field under this shared
 * contract suite via `stubClientConfig.editor`. Renders a single `<textarea>`
 * holding the first text leaf's content — enough for `richtext`'s generic
 * label/required/readOnly assertions (resolved through the field's own
 * `role="group"` wrapper, like `array`/`blocks`/`upload`, never through this
 * textarea's own identity) to exercise a real control instead of hitting the
 * "missing `editor`" configuration-error branch every OTHER fixture here
 * never triggers. `richtext/Input.test.tsx`'s own `extra` block drives the
 * full node-array round trip through this same textarea directly, and
 * separately asserts the configuration-error branch using its own
 * editor-less config (not this one).
 */
function StubRichTextEditor(props: VexEditorComponentProps) {
  const firstChild = props.value[0]?.children[0];
  const text = firstChild && "text" in firstChild ? firstChild.text : "";
  return createElement("textarea", {
    "aria-label": props.label ?? props.name,
    disabled: props.readOnly,
    placeholder: props.placeholder,
    value: text,
    onChange: (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next: RichTextDocument = [
        { type: "p", children: [{ text: event.target.value }] },
      ];
      props.onChange(next);
    },
  });
}

/** Test-only `VexEditorAdapter` — {@link StubRichTextEditor} plus a plain-text `renderComponent`. Exported so `richtext/Input.test.tsx` can compose its own configs for the editor-present and editor-absent cases. */
export const stubEditorAdapter: VexEditorAdapter<ReactHKT> = {
  type: "stub",
  editorComponent: StubRichTextEditor,
  renderComponent: (props: VexRenderComponentProps) =>
    createElement("span", null, JSON.stringify(props.content)),
};
```

**3 — `stubClientConfig`, add `editor: stubEditorAdapter` to the existing `defineConfig({...})` call.**

```ts
const stubClientConfig: VexClientConfig = defineConfig({
  editor: stubEditorAdapter,
  collections: [
```

(Everything from `defineCollection({` through the call's closing `});` is unchanged.)

#### packages/react/src/components/fields/richtext/Input.test.tsx

New file, complete.

```tsx
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "@tanstack/react-form";
import {
  defineConfig,
  type CollectionConfig,
  type RichTextField,
  type VexClientConfig,
} from "@vexcms/core";
import { AppForm } from "../../form/AppForm";
import { VexConfigContext } from "../../../context/VexConfigContext";
import { testCollection } from "../../../testing/harness/accessFixtures";
import {
  getControl,
  runFieldInputContractSuite,
  stubEditorAdapter,
} from "../../../testing/fieldInputContract";
import { richTextFieldFixture } from "./testFixture";
import { RichTextFieldInput } from "./Input";

/** The stub-editor config every OTHER fixture in this file's shared suite also mounts against. */
const configWithEditor: VexClientConfig = defineConfig({
  editor: stubEditorAdapter,
});

/** A config with no `editor:` entry — exercises the Design Decision 7 configuration-error branch. */
const configWithoutEditor: VexClientConfig = defineConfig({});

/** Mounts `RichTextFieldInput` behind a real `useForm` + `<AppForm>`, inside an explicit `VexConfigContext`. */
function RichTextHarness(props: {
  fieldDef: RichTextField;
  collection: CollectionConfig;
  initialValue: unknown;
  config: VexClientConfig;
}) {
  const form = useForm({ defaultValues: { testField: props.initialValue } });
  return (
    <VexConfigContext.Provider value={props.config}>
      <AppForm form={form}>
        <RichTextFieldInput
          name="testField"
          fieldDef={props.fieldDef}
          collection={props.collection}
          readOnly={false}
        />
      </AppForm>
    </VexConfigContext.Provider>
  );
}

runFieldInputContractSuite({
  fixture: richTextFieldFixture,
  Component: RichTextFieldInput,
  extra: (options) => {
    const collection = options.collection ?? testCollection;
    const label = options.fixture.fieldDef.label;

    describe("richtext: missing editor adapter", () => {
      it('renders a role="alert" configuration error naming editor: plateEditor() instead of crashing', () => {
        render(
          <RichTextHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
            config={configWithoutEditor}
          />,
        );
        const alert = screen.getByRole("alert");
        expect(alert).toHaveTextContent("editor: plateEditor()");
      });
    });

    describe("richtext: the configured editor adapter renders and round-trips a value", () => {
      it("typing into the stub editor's control updates it to the typed text", async () => {
        const user = userEvent.setup();
        const { container } = render(
          <RichTextHarness
            fieldDef={options.fixture.fieldDef}
            collection={collection}
            initialValue={options.fixture.empty}
            config={configWithEditor}
          />,
        );
        const group = getControl(container, label);
        const textarea = within(group).getByRole("textbox");
        await user.type(textarea, "Hello world");
        expect(textarea).toHaveValue("Hello world");
      });

      it("readOnly disables the configured editor's control", () => {
        const form = useForm({
          defaultValues: { testField: options.fixture.valid },
        });
        const { container } = render(
          <VexConfigContext.Provider value={configWithEditor}>
            <AppForm form={form}>
              <RichTextFieldInput
                name="testField"
                fieldDef={options.fixture.fieldDef}
                collection={collection}
                readOnly={true}
              />
            </AppForm>
          </VexConfigContext.Provider>,
        );
        const group = getControl(container, label);
        const textarea = within(group).getByRole("textbox");
        expect(textarea).toBeDisabled();
      });
    });
  },
});
```

#### packages/react/src/components/fields/richtext/Cell.test.tsx

New file, complete.

```tsx
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TDocument } from "@vexcms/core";
import {
  makeCellRow,
  runFieldCellContractSuite,
  withCellConfig,
} from "../../../testing/fieldCellContract";
import { testCollection } from "../../../testing/harness/accessFixtures";
import { RichTextFieldCell } from "./Cell";
import { richTextFieldFixture } from "./testFixture";

runFieldCellContractSuite({
  fixture: richTextFieldFixture,
  Component: RichTextFieldCell,
  extra: (options) => {
    const collection = options.collection ?? testCollection;

    describe("richtext: own rendering", () => {
      it("renders a plain-text excerpt joining the document's text leaves, never markup", () => {
        const row = makeCellRow<TDocument>({
          fieldKey: "field",
          value: options.fixture.valid,
        });
        const { container } = render(
          withCellConfig(
            <RichTextFieldCell
              value={options.fixture.valid}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container.querySelector("p, h1, strong, em")).toBeNull();
        expect(container).toHaveTextContent("Hello world");
        expect(container).toHaveTextContent("Second paragraph.");
      });

      it("renders the em-dash placeholder for an empty document", () => {
        const row = makeCellRow<TDocument>({ fieldKey: "field", value: [] });
        const { container } = render(
          withCellConfig(
            <RichTextFieldCell
              value={[]}
              row={row}
              fieldDef={options.fixture.fieldDef}
              fieldKey="field"
              isTitleField={false}
              collection={collection}
            />,
          ),
        );
        expect(container).toHaveTextContent("—");
      });
    });
  },
});
```

#### packages/react/src/components/fields/richtext/columnDef.test.ts

New file, complete.

```ts
import { runColumnDefSuite } from "../../../testing/columnDefSuite";
import { richTextFieldFixture } from "./testFixture";

runColumnDefSuite({ fixture: richTextFieldFixture });
```

Verify: pnpm typecheck && pnpm --filter @vexcms/core test && pnpm --filter @vexcms/react test -- fields/richtext

### Step 4 — `richtext-plate` typed against core, exported from root [dev]

This step closes the editor package's four `@ts-nocheck` holes now that Steps 1–2
exist. Each file's hidden errors were enumerated by copying the real sources into
a scratch `tsc --noEmit` run against stub `.d.ts` files mirroring Step 1's
`packages/core/src/editor/types.ts` and Step 2's bound `VexEditorAdapter` alias
exactly, with the package's own `node_modules` symlinked in so `platejs`/`@platejs/*`
resolved for real — zero errors with the fixes below applied, and reverting the
`mediaCollectionSlug` rename alone reproduces real `TS2339`/`TS2561` errors,
confirming the harness actually checks something. Two files beyond the four
`@ts-nocheck` targets need edits too: `useImageUpload.ts` and `ImageUpload.tsx`
are not `@ts-nocheck`'d, but `PlateEditorField.tsx`'s now-real
`VexEditorComponentProps` renames `mediaCollection` → `mediaCollectionSlug`
(Step 1) and types `mediaResults` as `VexMediaDocument[]` (which has `src`, not
`url`) — both files call into or get called from the fixed file, so leaving them
alone would leave the LSP dirty. `@vexcms/react` turns out to be required, not
optional: Step 2's `VexEditorAdapter` is a `ReactHKT`-bound alias that lives in
`@vexcms/react`, not a generic export from `@vexcms/core`, so `plateEditor()`
imports it from there as a type-only import (zero runtime cost — no
`tsup.config.ts` `external` entry needed).

- [ ] remove `@ts-nocheck` from `types.ts`, `editor/PlateEditorField.tsx`, `editor/plateEditor.ts`, `render/RichText.tsx`; fix every error they hid
- [ ] `editor/components/image/useImageUpload.ts` + `editor/components/image/ImageUpload.tsx` — rename `mediaCollection` → `mediaCollectionSlug` and adopt `@vexcms/core`'s `VexMediaDocument` (`src`, not `url`) in place of each file's own duplicate `MediaDoc` interface (P-010), so the types `PlateEditorField.tsx` now passes them actually compile
- [ ] `src/index.ts` exports `plateEditor`, `RichText`, feature types
- [ ] `tsconfig.check.json` — drop the `exclude` list (see Spec note)
- [ ] `package.json` — `@vexcms/core` / `@vexcms/react` as `workspace:^` peers + `workspace:*`/`catalog:` devDependencies (P-013/P-014)

> **Spec note:** `tsconfig.check.json` currently `exclude`s exactly the four
> `@ts-nocheck` files from `pnpm --filter @vexcms/richtext-plate typecheck` — a
> gate that has never actually run on them (AP-013's exact failure shape: it
> exits 0 having checked nothing). Removing `@ts-nocheck` without also emptying
> this `exclude` list would make this step's own `Verify` line lie. There's no
> real alternative: the list's only purpose was carving out the not-yet-typed
> files, which no longer exist after this step, so it comes out whole rather
> than shrinking.

#### packages/richtext-plate/src/types.ts

1 edit — everything not shown is unchanged.

**1 — delete the `@ts-nocheck` directive (line 1).** `RichTextElement` now
exists in `@vexcms/core` (Step 1), and its `[prop: string]: unknown` index
signature already accepts every field `ImageElement`/`LinkElement`/`TableElement`/
`TableRowElement`/`TableCellElement` add — nothing else in this file changes.

```ts
// Re-export canonical types from core
export type {
  RichTextDocument,
  RichTextElement,
  RichTextText,
} from "@vexcms/core";
```

#### packages/richtext-plate/src/render/RichText.tsx

1 edit — everything not shown is unchanged.

**1 — delete the `@ts-nocheck` directive (line 1).** `VexRenderComponentProps`
now exists in `@vexcms/core` (Step 1) and matches this file's destructure
exactly; `getStaticComponents()`'s `Record<string, FC<any>>` return already
satisfies platejs's `components?: NodeComponents` (`Record<string, React.FC<any>>`)
option on `createStaticEditor`. Nothing else in this file changes.

```tsx
import type { VexRenderComponentProps } from "@vexcms/core";
```

#### packages/richtext-plate/src/editor/plateEditor.ts

2 edits — everything not shown is unchanged.

**1 — imports.** `VexEditorAdapter` is a `ReactHKT`-bound type alias that lives
in `@vexcms/react` (Step 2), not a generic export from `@vexcms/core` — so
`plateEditor()` keeps returning the bare `VexEditorAdapter` name (no `<ReactHKT>`
at the call site; the alias already resolves `editorComponent`/`renderComponent`
to React's `ComponentType`), imported from the other package. This is a
type-only import: nothing is emitted, so `tsup.config.ts`'s `external` array
doesn't need a `@vexcms/react` entry.

```ts
import type { VexEditorComponentProps } from "@vexcms/core";
import type { VexEditorAdapter } from "@vexcms/react";
```

**2 — JSDoc example, inside `plateEditor()`'s doc comment.** The example
imported from the non-existent `@vexcms/richtext/editor`; now that `src/index.ts`
exports `plateEditor` from the package root, point at the real package and the
real entry point.

```ts
 * import { plateEditor } from "@vexcms/richtext-plate";
```

#### packages/richtext-plate/src/editor/PlateEditorField.tsx

3 edits — everything not shown is unchanged.

**1 — delete the `@ts-nocheck` directive (line 1) and the now-redundant local
`MediaDoc` interface and `PlateEditorFieldProps` field redeclarations.**
`VexEditorComponentProps` (Step 1) already carries `mediaResults` (typed
`VexMediaDocument[]`), `mediaSearchTerm`, `onMediaSearchChange`,
`mediaCanLoadMore`, `onMediaLoadMore`, `mediaIsLoading`, `onUploadNew`,
`generateUploadUrl`, and `createMediaDocument` — `PlateEditorFieldProps` only
needs to add `features`. The local `MediaDoc` interface becomes unused
(`noUnusedLocals`) once nothing redeclares `mediaResults` against it, so it's
deleted rather than left dead.

```tsx
"use client";

import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import {
  Plate,
  PlateContent,
  createPlateEditor,
  useEditorRef,
} from "platejs/react";
import type { VexEditorComponentProps, RichTextDocument } from "@vexcms/core";
import type { VexEditorFeature } from "./features/types";
import { createPluginsFromFeatures } from "./plugins/createPlugins";
import { Toolbar } from "./components/Toolbar";
import { EditorContainer } from "./components/EditorContainer";
import { ImageUpload } from "./components/image/ImageUpload";
import { useImageUpload } from "./components/image/useImageUpload";
import { TableToolbar } from "./components/TableToolbar";

interface PlateEditorFieldProps extends VexEditorComponentProps {
  features: VexEditorFeature[];
}
```

**2 — the destructured prop, in `PlateEditorField`'s parameter list.** Renamed
to match `VexEditorComponentProps.mediaCollectionSlug` (P-001; Step 1).

```tsx
  mediaCollectionSlug,
  mediaResults,
```

**3 — the `useImageUpload` call, inside `PlateEditorField`'s body.** Same
rename, passed through to the hook (see `useImageUpload.ts` below).

```tsx
const { uploadFile } = useImageUpload({
  mediaCollectionSlug,
  generateUploadUrl,
  createMediaDocument,
});
```

#### packages/richtext-plate/src/editor/components/image/useImageUpload.ts

2 edits — everything not shown is unchanged.

**1 — `UseImageUploadProps` interface and import.**

```ts
import { useCallback } from "react";
import type {
  MediaCollectionSlug,
  VexEditorComponentProps,
} from "@vexcms/core";

interface UseImageUploadProps {
  mediaCollectionSlug?: MediaCollectionSlug;
  generateUploadUrl?: () => Promise<string>;
  createMediaDocument?: VexEditorComponentProps["createMediaDocument"];
}
```

**2 — `useImageUpload`'s body (every `mediaCollection` reference renamed to
`mediaCollectionSlug`) and its doc comment.**

```ts
/**
 * Hook that provides a function to upload an image file to the media collection.
 *
 * @param props - Media collection slug and the upload URL / document creation
 *   callbacks used to perform the upload.
 * @returns `uploadFile` — the upload function, or `null` when
 *   `mediaCollectionSlug`, `generateUploadUrl`, and `createMediaDocument` are
 *   not all provided — and `isEnabled`, which reports whether uploads are
 *   configured.
 */
export function useImageUpload(props: UseImageUploadProps) {
  const { mediaCollectionSlug, generateUploadUrl, createMediaDocument } = props;

  const isEnabled = !!(
    mediaCollectionSlug &&
    generateUploadUrl &&
    createMediaDocument
  );

  const uploadFile = useCallback(
    async (file: File): Promise<UploadResult> => {
      if (!mediaCollectionSlug || !generateUploadUrl || !createMediaDocument) {
        throw new Error("Media collection not configured");
      }

      const uploadUrl = await generateUploadUrl();

      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      const { storageId } = (await uploadResponse.json()) as {
        storageId: string;
      };

      let width: number | undefined;
      let height: number | undefined;
      if (file.type.startsWith("image/")) {
        try {
          const dims = await getImageDimensions(file);
          width = dims.width;
          height = dims.height;
        } catch {
          width = undefined;
        }
      }

      const { mediaId } = await createMediaDocument({
        collectionSlug: mediaCollectionSlug,
        fields: {
          storageId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          url: "",
          alt: "",
          width: width ?? 0,
          height: height ?? 0,
        },
      });

      const tempUrl = URL.createObjectURL(file);

      return {
        url: tempUrl,
        mediaId,
        width,
        height,
      };
    },
    [mediaCollectionSlug, generateUploadUrl, createMediaDocument],
  );

  return { uploadFile: isEnabled ? uploadFile : null, isEnabled };
}
```

#### packages/richtext-plate/src/editor/components/image/ImageUpload.tsx

4 edits — everything not shown is unchanged. `VexMediaDocument` (`@vexcms/core`)
replaces this file's local `MediaDoc` interface — same intent, but with `src`
for the file's stored URL instead of `url`, and `alt: string` required rather
than optional (P-010: one declaration of the shape, not a drifting duplicate).

**1 — imports and `ImageUploadProps`.**

```tsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import type { VexMediaDocument } from "@vexcms/core";

interface ImageUploadProps {
  onClose: () => void;
  onInsertUrl: (props: { url: string; alt?: string }) => void;
  onInsertMedia?: (props: {
    url: string;
    mediaId: string;
    alt?: string;
  }) => void;
  onUploadNew?: () => void;
  mediaResults?: VexMediaDocument[];
  mediaSearchTerm?: string;
  onMediaSearchChange?: (term: string) => void;
  mediaCanLoadMore?: boolean;
  onMediaLoadMore?: () => void;
  mediaIsLoading?: boolean;
}
```

**2 — `MediaTab`'s prop types, in its parameter destructure's type annotation.**

```tsx
  results: VexMediaDocument[];
  searchTerm?: string;
  onSearchChange?: (s: string) => void;
  canLoadMore?: boolean;
  onLoadMore?: () => void;
  isLoading?: boolean;
  onSelect: (doc: VexMediaDocument) => void;
  onUploadNew?: () => void;
}) {
```

**3 — the result thumbnail's `<img>`, inside `MediaTab`'s `imageResults.map`.**

```tsx
            <img
              src={doc.src}
              alt={doc.alt || doc.filename}
```

**4 — `onSelect`, inside `ImageUpload`'s `<MediaTab>` call.**

```tsx
          onSelect={(doc) => {
            // Parent's onInsertMedia handles closing — don't call onClose here
            props.onInsertMedia?.({ url: doc.src, mediaId: doc._id, alt: doc.alt });
          }}
```

#### packages/richtext-plate/src/index.ts

Complete file — was type-only re-exports; now also the package's root runtime
entry point for `plateEditor` and `RichText` (`import { plateEditor } from
"@vexcms/richtext-plate"` in `vex.config.ts`, Design Decision 2), alongside
the existing `./editor` and `./render` subpath exports.

```ts
export { plateEditor } from "./editor/plateEditor";
export { RichText } from "./render/RichText";
export type {
  ImageElement,
  LinkElement,
  TableElement,
  TableRowElement,
  TableCellElement,
} from "./types";
export type { VexEditorFeature } from "./editor/features/types";
```

#### packages/richtext-plate/tsconfig.check.json

Complete file (see Spec note above for why the `exclude` list comes out
entirely rather than shrinking).

```json
{
  "extends": "./tsconfig.json"
}
```

#### packages/richtext-plate/package.json

3 edits — everything not shown is unchanged.

**1 — `dependencies`: `@vexcms/core` moves out (now a peer + devDependency, edits 2–3).**

```json
  "dependencies": {
    "@platejs/basic-nodes": "catalog:",
    "@platejs/code-block": "catalog:",
    "@platejs/link": "catalog:",
    "@platejs/list": "catalog:",
    "@platejs/media": "catalog:",
    "@platejs/table": "catalog:",
    "platejs": "catalog:"
  },
```

**2 — `peerDependencies`: `@vexcms/core` and `@vexcms/react` join as `workspace:^` (P-013), matching `@vexcms/better-auth`/`@vexcms/cli`/`@vexcms/file-storage-convex`'s existing pattern for `@vexcms/core`.**

```json
  "peerDependencies": {
    "@vexcms/core": "workspace:^",
    "@vexcms/react": "workspace:^",
    "react": "catalog:peers",
    "react-dom": "catalog:peers"
  },
```

**3 — `devDependencies`: matching `workspace:*` pins so the peers resolve to a single in-repo copy during development (P-014).**

```json
  "devDependencies": {
    "@types/node": "catalog:",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "@vexcms/core": "workspace:*",
    "@vexcms/react": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
    "react": "catalog:",
    "react-dom": "catalog:",
    "tailwindcss": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:"
  },
```

Verify: pnpm --filter @vexcms/richtext-plate typecheck && pnpm --filter @vexcms/richtext-plate build && ! grep -r "@ts-nocheck" packages/richtext-plate/src

### Step 5 — Inline images through the media collection [dev]

> **Spec note:** Two open items, both resolved during this step's authoring rather than
> worked around silently (P-023):
>
> 1. **`createMediaDocument`'s return shape.** The real Convex mutation
>    (`vexConvexApi.media.createMediaDocument`) returns only the new document's id —
>    `VexMediaCreateMediaDocumentReturn = string` (`packages/core/src/api/convex.ts`) — shared
>    with the upload field, out of scope to change. But the server already resolves the
>    stored `src` at doc-creation time (`ctx.storage.getUrl()` in
>    `packages/file-storage-convex/src/adapter/methods.ts`), so the real fix for
>    `useImageUpload.ts`'s temporary-blob-URL bug is to resolve that URL client-side via the
>    dedicated `vexConvexApi.media.getUrl` query right after creating the document, and hand
>    both back. Coordinated with Step 1 (owns `VexEditorComponentProps`): `createMediaDocument`
>    there now resolves `Promise<{ mediaId: string; url?: string }>` instead of `Promise<string>`
>    — `local://richtext-step-1.md` already reflects this.
> 2. **`RichTextFieldInput`/`RichTextField`'s exact member layout** is Step 3's deliverable and
>    wasn't available while this section was authored (concurrent authorship). The
>    `mediaCollectionSlug` edits below are described by anchor + intent ("add alongside the
>    field's other optional, field-specific options") rather than by a guessed line — reconcile
>    against whatever Step 3 actually shipped.
>
> Also: `mediaCollectionSlug` joins `upload().to` in `validateAndMergeStorageConfig`'s
> media-reference check (`packages/core/src/media/config.ts`). An absent slug is fine (no inline
> images); a slug naming no declared media collection throws `VexStorageConfigError` at
> `defineConfig()` time, so a typo fails loudly instead of silently hiding the image feature.

This step closes the inline-image loop `richtext-plate`'s editor already has a UI for: a field
opts in with `mediaCollectionSlug`, the react `Input` wires the same search/pagination/upload
primitives `MediaLibraryGrid`/`MediaUploadForm` already use (no new data layer), and
`useImageUpload.ts`'s returned `url` becomes the real stored URL instead of a
`URL.createObjectURL` blob that doesn't survive a page reload. Absent `mediaCollectionSlug`,
every media prop resolves to `undefined` and `PlateEditorField` drops the `"image"` feature
from its plugin set.

- [ ] `RichTextFieldInput.mediaCollectionSlug?: MediaCollectionSlug` (core types + factory + test)
- [ ] react richtext `Input.tsx` wires media search/pagination, `generateUploadUrl`, `createMediaDocument` from the existing upload/MediaPicker hooks
- [ ] `useImageUpload.ts` — fix returned `url` to the stored media URL (not a temp blob URL)
- [ ] image feature hidden when `mediaCollectionSlug` is absent
- [ ] `packages/core/src/media/config.ts` + `packages/core/src/config/config.test.ts` — unknown `mediaCollectionSlug` throws `VexStorageConfigError`

#### packages/core/src/fields/richtext/types.ts

1 edit to each of `RichTextFieldInput` and `RichTextField` — everything else Step 3 landed is
unchanged.

**1 — `RichTextFieldInput`, alongside its other optional field-specific options.**

````ts
  /**
   * The slug of the media collection inline images upload into. Absent means
   * the richtext editor's image feature is hidden entirely — no dropzone, no
   * paste/drag-and-drop upload, no "insert image" toolbar button — rather
   * than rendering a feature that would immediately fail every upload.
   *
   * Must match a media collection declared on `defineConfig({ mediaCollections })`,
   * exactly like `upload()`'s `to`; an unknown slug throws `VexStorageConfigError`
   * at `defineConfig()` time. Unlike `to`, it is optional — a richtext field
   * without inline images is a normal, supported field.
   *
   * @example
   * ```ts
   * richtext({ label: "Body", mediaCollectionSlug: "images" })
   * ```
   */
  mediaCollectionSlug?: MediaCollectionSlug;
````

**2 — `RichTextField`, same member, resolved (always present, possibly `undefined`).**

```ts
  /** The field's configured inline-image target collection, if any. */
  mediaCollectionSlug?: MediaCollectionSlug;
```

Both need `import type { MediaCollectionSlug } from "../../types/generated";` added to the
file's import list if Step 3 didn't already pull it in (the upload field's `types.ts` imports it
the same way).

#### packages/core/src/fields/richtext/config.ts

No code change. Step 3's `richtext()` factory already carries `mediaCollectionSlug` through its
existing `...options` spread; slug validation happens at `defineConfig()` time (see
`packages/core/src/media/config.ts` below), not in the factory, matching `upload()`.

#### packages/core/src/fields/richtext/config.test.ts

2 new test cases, appended to the existing `describe("richtext")` block (or equivalent) Step 3
landed — everything else in the file is unchanged.

```ts
it("passes mediaCollectionSlug through when provided", () => {
  const field = richtext({ label: "Body", mediaCollectionSlug: "images" });
  expect(field.mediaCollectionSlug).toBe("images");
});

it("leaves mediaCollectionSlug undefined when omitted", () => {
  const field = richtext({ label: "Body" });
  expect(field.mediaCollectionSlug).toBeUndefined();
});
```

#### packages/core/src/media/config.ts

2 edits — everything not shown is unchanged.

**1 — `validateAndMergeStorageConfig`'s JSDoc `Checks:` list, item 1.**

```ts
 * 1. Every `upload().to` and `richtext().mediaCollectionSlug` slug names a declared media collection.
```

**2 — the field loop and its error, replacing the `missing` collection block through the `if (missing.size > 0)` throw.**

```ts
const missing = new Set<string>();
for (const collection of collections) {
  for (const field of Object.values(collection.fields)) {
    if (field.type === ADMIN_FIELDS.upload.type && !mediaSlugs.has(field.to)) {
      missing.add(field.to);
    }
    if (
      field.type === ADMIN_FIELDS.richtext.type &&
      field.mediaCollectionSlug !== undefined &&
      !mediaSlugs.has(field.mediaCollectionSlug)
    ) {
      missing.add(field.mediaCollectionSlug);
    }
  }
}
if (missing.size > 0) {
  throw new VexStorageConfigError(
    `upload() and richtext() fields reference missing media collections: ${[...missing].join(", ")}. ` +
      `Declare them on defineConfig({ mediaCollections: [...] }) using a storage package's defineMediaCollection(). ` +
      `Available media collections: ${[...mediaSlugs].join(", ") || "none"}.`,
  );
}
```

Top-level fields only, the same depth `upload()` is checked at today; nested-field coverage is
a pre-existing gap for both and out of scope here.

#### packages/core/src/config/config.test.ts

2 edits — everything not shown is unchanged.

**1 — add `richtext` to the existing `from "../"` value import, beside `upload`.**

```ts
  richtext,
```

**2 — three cases appended inside `describe("defineConfig with media collections")`, after the slug-collision case.**

```ts
it("throws when a richtext field's mediaCollectionSlug is not declared", () => {
  expect(() =>
    defineConfig({
      collections: [
        defineCollection({
          slug: "posts",
          fields: { body: richtext({ mediaCollectionSlug: "images" }) },
        }),
      ],
    }),
  ).toThrow(VexStorageConfigError);
});

it("accepts a richtext field whose mediaCollectionSlug is declared", () => {
  const config = defineConfig({
    mediaCollections: [makeMockMediaCollection("images")],
    collections: [
      defineCollection({
        slug: "posts",
        fields: { body: richtext({ mediaCollectionSlug: "images" }) },
      }),
    ],
  });
  expect(config.mediaCollections[0].slug).toBe("images");
});

it("accepts a richtext field without mediaCollectionSlug and no media collections", () => {
  const config = defineConfig({
    collections: [
      defineCollection({
        slug: "posts",
        fields: { body: richtext() },
      }),
    ],
  });
  expect(config.mediaCollections).toEqual([]);
});
```

#### packages/react/src/components/fields/richtext/Input.tsx

4 edits — Step 3 lands the skeleton (editor-adapter lookup, the Design-Decision-7
configuration-error branch for a missing `config.editor`, and a `createFieldInput` body that
renders `<EditorComponent value={field.state.value} onChange={field.handleChange} readOnly={…}
name={name} label={fieldDef.label} description={fieldDef.admin.description}
placeholder={fieldDef.admin.placeholder} />`). This step's media wiring touches the imports, adds
several hooks before the render, and extends that `<EditorComponent>` call with the media props
— different enough from Step 3's version to show the full body rather than a line-numbered diff
against code this step's author never saw.

**1 — imports.**

```ts
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useConvexMutation, convexQuery } from "@convex-dev/react-query";
import { useDebounceValue } from "@ts-hooks-kit/core";
import {
  vexConvexApi,
  type RichTextField,
  type VexMediaDocument,
} from "@vexcms/core";
import { useVexMutation } from "../../../hooks";
```

**2 — component body, replacing Step 3's full function.**

```tsx
export const RichTextFieldInput = createFieldInput<
  RichTextDocument,
  {},
  RichTextField
>(({ name, fieldDef, field, readOnly }) => {
  // TODO: implement
  // 1. `const config = useVexConfig();` and `const isReadOnly = readOnly ||
  //    fieldDef.admin.readOnly;` (OR-composition, LABEL-1) — same as Step 3.
  // 2. `const EditorComponent = config.editor?.editorComponent;`
  //    a. Falsy → Step 3's configuration-error element. Return it here unchanged; nothing
  //       below this point runs without an editor to render into.
  // 3. Resolve the target media collection — OPTIONAL, unlike `upload()`'s required `to`:
  //    `const targetCollectionConfig = fieldDef.mediaCollectionSlug
  //       ? config.mediaCollections.find((mc) => mc.slug === fieldDef.mediaCollectionSlug)
  //       : undefined;`
  //    `const adapterName = targetCollectionConfig?.meta.storageAdapter;`
  //    → `undefined` only for a field with no `mediaCollectionSlug`; an unknown slug already
  //      threw `VexStorageConfigError` at `defineConfig()` time.
  // 4. Media search state, mirroring `MediaLibraryGrid` exactly:
  //    `const [mediaSearchTerm, setMediaSearchTerm] = useState("");`
  //    `const [debouncedSearch] = useDebounceValue(mediaSearchTerm, 200);`
  //    `const [mediaLimit, setMediaLimit] = useState(24);`
  // 5. Two `useQuery` calls, same `find`/`search` split as `MediaLibraryGrid`, each ALSO
  //    gated on `!!targetCollectionConfig` (never issued with no media collection configured):
  //    `useQuery({ ...convexQuery(vexConvexApi.find, { collection: targetCollectionConfig?.slug
  //    ?? "", limit: mediaLimit }), enabled: !!targetCollectionConfig && debouncedSearch.length
  //    === 0 })` → `{ data: allResults = [], isPending: allPending }`.
  //    `useQuery({ ...convexQuery(vexConvexApi.search, !targetCollectionConfig ||
  //    debouncedSearch.length === 0 ? "skip" : { collection: targetCollectionConfig.slug, query:
  //    debouncedSearch, searchField: targetCollectionConfig.admin.useAsTitle, limit: mediaLimit,
  //    searchIndexName: \`search_${targetCollectionConfig.admin.useAsTitle}\` }) })` → `{ data:
  //    searchResults = [], isPending: searchPending }`.
  //    → `const mediaResults = (debouncedSearch.length > 0 ? searchResults : allResults) as
  //      VexMediaDocument[];`
  //    → `const mediaIsLoading = debouncedSearch.length > 0 ? searchPending : allPending;`
  // 6. The two upload mutations, copied from `MediaUploadForm.tsx`'s own setup, plus a query
  //    client for step 8:
  //    `const { mutateAsync: generateUploadUrl } = useMutation({ mutationFn:
  //    useConvexMutation(vexConvexApi.media.generateUploadUrl) });`
  //    `const { mutateAsync: createMediaDoc } = useVexMutation({ collection:
  //    targetCollectionConfig?.slug ?? "", getChanges: ({ args, result }) => [{ after: { ...args,
  //    _id: result } }], mutationFn: vexConvexApi.media.createMediaDocument, operation:
  //    "create" });`
  //    `const queryClient = useQueryClient();`
  // 7. `async function handleGenerateUploadUrl(): Promise<string>`
  //    a. `!adapterName || !targetCollectionConfig` → `throw new Error("Media collection not
  //       configured")`.
  //    b. → `const { url } = await generateUploadUrl({ adapter: adapterName, collection:
  //       targetCollectionConfig.slug });` → return `url`.
  // 8. `async function handleCreateMediaDocument(props: { collectionSlug: string; fields:
  //    Record<string, unknown> }): Promise<{ mediaId: string; url?: string }>`
  //    a. `!adapterName` → `throw new Error("Media collection not configured")`.
  //    b. `const mediaId = await createMediaDoc({ adapter: adapterName, collectionSlug:
  //       props.collectionSlug, storageId: props.fields.storageId as string, filename:
  //       props.fields.filename as string, mimeType: props.fields.mimeType as string, size:
  //       props.fields.size as number, alt: props.fields.alt as string | undefined });` → the
  //       real mutation, id only.
  //    c. `const { url } = await queryClient.fetchQuery(convexQuery(vexConvexApi.media.getUrl,
  //       { adapter: adapterName, mediaId }));` → resolves the SAME `src` the server computed
  //       at doc-creation time via the dedicated `getUrl` endpoint.
  //    d. → return `{ mediaId, url }`.
  // 9. Render: Step 3's `<EditorComponent>` call, with these props added —
  //    `mediaCollectionSlug={fieldDef.mediaCollectionSlug}`
  //    `mediaResults={mediaResults}`
  //    `mediaSearchTerm={mediaSearchTerm}`
  //    `onMediaSearchChange={setMediaSearchTerm}`
  //    `mediaCanLoadMore={mediaResults.length >= mediaLimit}`
  //    `onMediaLoadMore={() => setMediaLimit((limit) => limit + 24)}`
  //    `mediaIsLoading={mediaIsLoading}`
  //    `generateUploadUrl={targetCollectionConfig ? handleGenerateUploadUrl : undefined}`
  //    `createMediaDocument={targetCollectionConfig ? handleCreateMediaDocument : undefined}`
  //    — every one of these resolves to `undefined` when `mediaCollectionSlug` is absent,
  //      which is how Design Decision 6's "image feature hidden" reaches the editor; the
  //      feature-list filtering itself lives in `PlateEditorField.tsx` below.
  // Edge cases:
  // - `mediaCollectionSlug` absent → `targetCollectionConfig` is `undefined`, every media prop
  //   is `undefined`, image feature stays hidden.
  // - Search term typed then cleared → `debouncedSearch` returns to `""`; the `find` query
  //   re-enables and the `search` query's args become `"skip"` in the same render, so
  //   `mediaResults` re-derives from `allResults` with no stale search results lingering.
  throw new Error("Not implemented");
});
```

#### packages/richtext-plate/src/editor/components/image/useImageUpload.ts

2 edits — everything else (`getImageDimensions`, the hook's `isEnabled`/return shape) is
unchanged.

**1 — `UseImageUploadProps`, renaming `mediaCollection` to `mediaCollectionSlug` (P-001) and
widening `createMediaDocument`'s return per the Spec note above.**

```ts
interface UseImageUploadProps {
  mediaCollectionSlug?: MediaCollectionSlug;
  generateUploadUrl?: () => Promise<string>;
  createMediaDocument?: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<{ mediaId: string; url?: string }>;
}
```

Add `import type { MediaCollectionSlug } from "@vexcms/core";` to the file's imports, and rename
every other `mediaCollection` reference in the file (the `useImageUpload` function's own
destructuring and `isEnabled` check) to `mediaCollectionSlug`.

**2 — the `uploadFile` callback body, replacing steps 6–7 of the existing implementation
(dimension detection in step 5 is unchanged).**

```ts
const uploadFile = useCallback(
  async (file: File): Promise<UploadResult> => {
    // TODO: implement
    // 1. `!mediaCollectionSlug || !generateUploadUrl || !createMediaDocument` → throw
    //    `new Error("Media collection not configured")`. Unchanged.
    // 2. `const uploadUrl = await generateUploadUrl();` Unchanged.
    // 3. `const uploadResponse = await fetch(uploadUrl, { method: "POST", body: file, headers:
    //    { "Content-Type": file.type } });` `!uploadResponse.ok` → throw `new
    //    Error(\`Upload failed: ${uploadResponse.statusText}\`)`. Unchanged.
    // 4. `const { storageId } = (await uploadResponse.json()) as { storageId: string };`
    //    Unchanged.
    // 5. Image dimensions via `getImageDimensions(file)` in a `try`/`catch` — unchanged.
    // 6. `const { mediaId, url } = await createMediaDocument({ collectionSlug:
    //    mediaCollectionSlug, fields: { storageId, filename: file.name, mimeType: file.type,
    //    size: file.size, alt: "", width: width ?? 0, height: height ?? 0 } });`
    //    → `url` is the SAME `src` the server already computed from `storageId` via
    //      `ctx.storage.getUrl()` at document-creation time — no longer invented client-side.
    // 7. → `return { url: url ?? URL.createObjectURL(file), mediaId, width, height };`
    //    → `URL.createObjectURL` is now a FALLBACK ONLY, for an adapter whose
    //      `createMediaDocument` can't resolve a URL synchronously (`url` is optional
    //      precisely for that case) — not the normal path.
    // Edge cases:
    // - `createMediaDocument` resolves `url: undefined` → falls back to the blob URL exactly
    //   as before; the image still inserts immediately, it just won't survive a reload until
    //   `VexRenderComponentProps.resolveMedia` re-resolves it on the read path.
    throw new Error("Not implemented");
  },
  [mediaCollectionSlug, generateUploadUrl, createMediaDocument],
);
```

Update the hook's JSDoc `@param`/`@returns` to describe `mediaCollectionSlug` (renamed) and the
new `{ mediaId, url? }` shape `createMediaDocument` resolves.

#### packages/richtext-plate/src/editor/PlateEditorField.tsx

1 edit — everything else Step 4 landed (the `@ts-nocheck` removal, the `mediaCollection` →
`mediaCollectionSlug` rename across this file's own destructuring) is unchanged.

**1 — replace the `useMemo` building `plugins`/`components` and the `hasImageFeature` line with
a feature list that drops `"image"` when no media collection is configured.**

```tsx
const effectiveFeatures = useMemo(
  () =>
    mediaCollectionSlug
      ? features
      : features.filter((feature) => feature.key !== "image"),
  [features, mediaCollectionSlug],
);

const { plugins, components } = useMemo(
  () => createPluginsFromFeatures(effectiveFeatures),
  [effectiveFeatures],
);
```

Every later reference to `features` for feature detection (`hasImageFeature = features.some((f)
=> f.key === "image")`) reads `effectiveFeatures` instead — `effectiveFeatures` is never `true`
for `"image"` once `mediaCollectionSlug` is absent, so the toolbar's image button, the paste
handler, and the drop handler (all gated on `hasImageFeature`/`uploadFile` being non-null) never
activate. `useImageUpload` itself already degrades to `uploadFile: null` with no
`mediaCollectionSlug` (its `isEnabled` check), so the two gates agree.

Verify: pnpm --filter @vexcms/react test -- fields/richtext && pnpm --filter @vexcms/richtext-plate typecheck

### Step 6 — Dogfood in `apps/test` [dev]

> **Spec note:** `apps/test/src/vexcms/collections/posts.ts` is a draft/publish
> **test fixture** for the versioning-drafts spec — it has no public
> front-end route today. `apps/test/src/app/(frontend)/(site)/[slug]/page.tsx`
> only renders the `pages` collection (`RenderBlocks` over `blocks`); there is
> no `apps/test/convex/posts.ts` and no `posts` page under `app/`. "front-end
> post page renders `body` with `RichText`" (spec-tasks Step 6) therefore
> cannot be a one-field edit to an existing route — it requires adding both
> the Convex query and the route. Two ways to satisfy the step's real goal
> (prove schema gen → type gen → admin form → cell → front-end render):
>
> 1. **(chosen)** Add a minimal `convex/posts.ts::getBySlug` (public,
>    `access: { bypass: true }`, same pattern as `convex/pages.ts`) and a new
>    `app/(frontend)/(site)/posts/[slug]/page.tsx` that renders `body`
>    through `RichText`. Small, additive, does not touch the
>    versioning-drafts access rules under test.
> 2. Point the dogfood field at `pages.content` (the existing unused "legacy
>    content field") instead, since `pages` already has a public route. Not
>    chosen: `content` is explicitly kept for legacy string documents
>    (`pages.ts` comment), and repurposing it as richtext would be a
>    different, undocumented migration on a field the spec never named.
>
> `RichTextFieldInput.mediaCollectionSlug` is set to `images`
> (`TABLE_SLUG_IMAGES`), the only media collection registered in
> `apps/test`. `RichText`'s `resolveMedia` prop is **not** wired here:
> `useImageUpload.ts` (Step 5) already stores the persisted media URL on the
> image node (`ImageElement.url`) at save time, so there is nothing left to
> resolve at render time — passing `resolveMedia` would be dead code.

Wires the finished `richtext` field end to end in the real app: the
`posts` collection's `body` field switches from `text()` to `richtext()`
with inline images enabled, `vex.config.ts` registers `plateEditor()` as
the root editor adapter, `vex generate`/`vex dev --once` regenerate
`vex.types.ts` and the Convex schema, and a new `/posts/[slug]` route
renders the saved document server-side through `@vexcms/richtext-plate`'s
static `RichText` renderer. `posts` carries no seeded rows (`convex/seed.ts`
never inserts into the `posts` table — its only `posts` reference is an
unrelated marketing code sample string), so there is no existing string
`body` data to migrate in a fresh deployment. A **local dev deployment**
that already has `posts` documents from earlier manual testing (ordinary
when exercising the versioning-drafts draft/publish flow by hand) does:
`vex dev --once` pushes a schema with `body: v.array(v.any())`, and an
existing string `body` row fails that validator. Delete those rows (Convex
dashboard, dev deployment only — they are disposable manual-test fixtures,
not seed data) before regenerating.

- [ ] `apps/test/package.json` — `@vexcms/richtext-plate: workspace:*`
- [ ] `apps/test/src/vex.config.ts` — `editor: plateEditor()`
- [ ] `apps/test/src/vexcms/collections/posts.ts` — `body: richtext({ label: "Body", mediaCollectionSlug: "images" })`
- [ ] regenerate schema + types (`vex generate`, `vex dev --once`)
- [ ] front-end post page renders `body` with `RichText`

#### apps/test/package.json

1 edit; everything not shown is unchanged.

1. Dependency, alphabetically after `@vexcms/react`:

```json
    "@vexcms/react": "workspace:*",
    "@vexcms/richtext-plate": "workspace:*",
    "better-auth": "catalog:",
```

2. Script, after `"typecheck"` (mirrors `apps/www/package.json`'s
   `vex:generate`):

```json
    "typecheck": "tsc --noEmit",
    "vex:generate": "vex dev --once",
```

#### apps/test/src/vex.config.ts

2 edits; everything not shown is unchanged.

1. Import, after the `uploadFile` import:

```ts
import { betterAuthCollections } from "@vexcms/better-auth/client";
import { defineConfig } from "@vexcms/core";
import { uploadFile } from "@vexcms/file-storage-convex/client";
import { plateEditor } from "@vexcms/richtext-plate/editor";
```

2. Root `editor` key on the `defineConfig` call, before `admin:` (decision 2
   — `editor` is a root config key, not nested under `admin`):

```ts
const vexConfig = defineConfig({
  access,
  authCollections: betterAuthCollections(authSchema),
  editor: plateEditor(),
  admin: {
```

#### apps/test/src/vexcms/collections/posts.ts

2 edits; everything not shown is unchanged.

1. Imports:

```ts
import { defineCollection, relationship, richtext, text } from "@vexcms/core";

import {
  TABLE_SLUG_ARTICLES,
  TABLE_SLUG_IMAGES,
  TABLE_SLUG_POSTS,
} from "~/db/constants";
```

2. `body` field:

```ts
    body: richtext({
      label: "Body",
      description: "Rich text — the field to edit when testing a plain draft save.",
      mediaCollectionSlug: TABLE_SLUG_IMAGES,
    }),
```

#### apps/test/convex/posts.ts

New file — mirrors `apps/test/convex/pages.ts`'s `getBySlug`, trimmed to
what the dogfood route needs (no `generateStaticParams`/sitemap entry for
`posts`; this is a test surface, not a crawled route).

```ts
import { v } from "convex/values";

import { TABLE_SLUG_POSTS } from "~/db/constants";
import { find } from "~/vexcms/api";

import { query } from "./_generated/server";

/**
 * Returns the post document matching the given slug.
 *
 * Uses the `by_slug` index for efficient lookup. Returns an empty array if
 * no post with that slug exists (caller handles 404 via `notFound()`).
 *
 * Access is bypassed: this is read at build/request time by anonymous
 * visitors on the dogfood post page, who carry no session and would
 * otherwise be filtered out by `posts`' editorial permissions
 * (`~/auth/access.ts`), which exist to test role-scoped drafts, not to gate
 * public reads of a published post.
 *
 * @param data.slug - URL slug to look up (e.g. `"hello-world"`)
 * @returns Array containing the matching `Post` document, or empty if not found.
 */
export const getBySlug = query({
  args: v.object({
    slug: v.string(),
  }),
  handler: async (ctx, { slug }) => {
    return await find({
      ctx,
      collection: TABLE_SLUG_POSTS,
      withIndex: {
        name: "by_slug",
        range: (q) => q.eq("slug", slug),
      },
      limit: 1,
      access: {
        bypass: true,
      },
    });
  },
});
```

#### apps/test/src/app/(frontend)/(site)/posts/[slug]/page.tsx

New file. Sits inside the `(site)` route group, so `SiteLayout`'s header
and footer wrap it for free. No `generateStaticParams`: posts are rendered
on demand, not prebuilt (no public post listing/sitemap entry exists —
dev-only test surface).

```tsx
import { api } from "@convex/_generated/api";
import { RichText } from "@vexcms/richtext-plate/render";
import { notFound } from "next/navigation";

import { Container } from "~/components/Container";
import { vex } from "~/lib/vex";

/**
 * One public post, resolved by slug.
 *
 * Dogfoods the `richtext` field end to end: `posts.body` is saved by the
 * Plate editor in the admin panel (`editor: plateEditor()` in
 * `vex.config.ts`) and rendered here through `RichText`, the same static
 * renderer `plateEditor()` wires as its `renderComponent`. Inline images
 * need no URL resolution at render time — `useImageUpload.ts` already
 * stores the persisted media URL on each image node when the editor saves.
 */
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [post] = await vex.query(api.posts.getBySlug, { slug });

  if (!post) {
    notFound();
  }

  return (
    <Container className="py-16">
      <h1 className="text-4xl font-semibold tracking-tight">{post.title}</h1>
      <RichText className="prose mt-8 max-w-[46rem]" content={post.body} />
    </Container>
  );
}
```

Verify: `pnpm --filter test typecheck && pnpm --filter test build`; manual
(P-024 — attach to the already-running `apps/test` dev server on port 3020
and the paired `convex dev`/`vex dev`, never start one): in the running
admin at `/admin`, open a `posts` document, edit `Body` with the Plate
editor (confirm an inline image insert resolves through the `images`
media collection), save a draft, then publish; visit
`http://localhost:3020/posts/<slug>` and confirm the published body
renders as formatted rich text (not raw JSON, not plain text).

### Step 7 — Docs, README, packed-tarball probe, changeset [agent]

> **Spec note:** `scripts/verify-scaffold.mjs` scaffolds `create-vexcms`'s two
> templates, and per Design Decision 9 dogfooding stays in `apps/test` only —
> the templates get no richtext wiring in this spec, so that script cannot
> exercise `richtext()`/`plateEditor()`/`RichText` without scope creep into
> template work. The packed-tarball consumer probe is instead added as two new
> CLI modes (`--richtext`, `--richtext --richtext-negative`) on
> `scripts/check-packed-manifests.mjs`, which already packs every publishable
> package per-directory (AP-017) and is the script this repo's own "probe
> against the published tarball" pattern lives in. The Verify line below
> reflects that script, not `verify-scaffold.mjs`.

This step closes out D (`.agent/docs/product/v0.1.0-launch-plan.md`): the
public docs stop telling readers `richtext` doesn't exist, `@vexcms/richtext-plate`'s
README stops hedging on a field that didn't exist when it was written, a new
packed-tarball probe proves a real consumer can install and typecheck against
the three published packages (core, react, richtext-plate) rather than the
workspace, and a changeset records the three `patch` bumps this spec produces.

- [ ] `apps/docs/src/content/docs/fields/richtext.mdx` new; `coming-soon.mdx` drops richtext
- [ ] `packages/core/README.md` — remove the three "no richtext" statements
- [ ] `packages/richtext-plate/README.md` — install + `editor: plateEditor()` + `RichText` render
- [ ] packed-tarball consumer probe importing `richtext()`, `plateEditor`, `RichText`
- [ ] `.changeset/*.md` — `patch` for core, react, richtext-plate (P-025)
- [ ] launch plan: D status → done

#### apps/docs/src/content/docs/fields/richtext.mdx

New page, mirroring `color.mdx`/`upload.mdx`'s structure (frontmatter, intro
paragraph, config-options table, schema output, usage, a field-specific
section, Admin UI). Sits alongside the other field pages; the docs sidebar
autogenerates from `fields/**` (`astro.config.mjs:56`) so no manual sidebar
edit is needed — the page is picked up by its filename alone.

````mdx
---
title: richtext field
description: Stores a structured rich-text document, edited through a pluggable WYSIWYG editor adapter and rendered through a matching server-safe renderer — powered by Plate.js via @vexcms/richtext-plate.
---

A `richtext()` field stores a `RichTextDocument` — an array of element nodes
(paragraphs, headings, lists, tables, images, …) with nested text leaves,
the same shape the [Plate.js](https://platejs.org) editor and static renderer
both operate on directly. There is no per-locale shape for 0.1.0: a richtext
value is a single, locale-agnostic document.

Unlike every other field type, `richtext` doesn't ship its own admin UI.
Editing and rendering are supplied by an **editor adapter** — an object
shaped `{ type, editorComponent, renderComponent }` — registered once on the
root client config via `editor:`, not per field. `@vexcms/richtext-plate`'s
`plateEditor()` is the built-in adapter; any package implementing
`VexEditorAdapter` works the same way.

Common uses: post bodies, page content, anywhere prose needs headings, lists,
links, images, or tables rather than the plain string a [`text`](/fields/text/)
field stores.

## Config options

| Option                | Type                  | Default  | Description                                                                                                                                                  |
| --------------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `label`               | `string`              | `""`     | Display label in the admin panel. Inferred from the field key by `defineCollection` when left empty.                                                         |
| `required`            | `boolean`             | `false`  | When `true`, at least one node in the document must contain non-empty plain text. Honors draft saves (`ignoreRequired`) the same way every other field does. |
| `mediaCollectionSlug` | `MediaCollectionSlug` | —        | Media collection the editor's image feature uploads into and picks from. Omit to hide the image feature entirely — there is no field-level fallback.         |
| `defaultValue`        | `RichTextDocument`    | `[]`     | Pre-filled document shown when creating a new document.                                                                                                      |
| `description`         | `string`              | —        | Helper text shown below the field input.                                                                                                                     |
| `admin.hidden`        | `boolean`             | `false`  | Hides the field from the admin edit form entirely.                                                                                                           |
| `admin.readOnly`      | `boolean`             | `false`  | Renders the editor as non-interactive.                                                                                                                       |
| `admin.position`      | `"main" \| "sidebar"` | `"main"` | Column in the admin edit layout where this field appears.                                                                                                    |
| `admin.width`         | `"full" \| "half"`    | `"full"` | Grid width of the field in the edit form.                                                                                                                    |

There is no `admin.cellAlignment` — the list-view cell shows a plain-text
excerpt, which is always left-aligned.

## Schema output

Convex cannot express a recursive validator for an arbitrarily nested document
tree, so the generated schema stores the document as an opaque array and the
field's own input validation (Zod, at save time) does the real shape checking.

```ts
// Optional (default — required: false)
body: v.optional(v.array(v.any()));

// Required
body: v.array(v.any());
```

## Usage

```ts
import { defineConfig, defineCollection, richtext } from "@vexcms/core";
import { plateEditor } from "@vexcms/richtext-plate/editor";

const posts = defineCollection({
  slug: "posts",
  fields: {
    // Image feature enabled, uploading into the "images" media collection
    body: richtext({
      label: "Body",
      required: true,
      mediaCollectionSlug: "images",
    }),
  },
});

export default defineConfig({
  collections: [posts],
  // Registered once, root-level — every richtext field in the config uses it
  editor: plateEditor(),
});
```

Rendering on the front end uses the adapter's matching `RichText` component
directly, independent of the admin config:

```tsx
import { RichText } from "@vexcms/richtext-plate/render";

export function PostBody({ body }: { body: Doc<"posts">["body"] }) {
  return <RichText content={body} className="prose" />;
}
```

## The editor adapter

`editor` is a root-level option on the **client** config (`defineConfig`), not
a per-field option — every `richtext` field in the collection set shares the
one registered adapter. This mirrors how `relationship` fields consume
`admin.components.preview`: the field declares what kind of data it holds,
and a separate client-safe component slot supplies how it's rendered.

If a collection has a `richtext` field but no `editor` is registered, the
admin panel does not crash and does not silently fall back to a plain
textarea — the field's Input renders a visible configuration error naming
`editor: plateEditor()` as the fix.

`@vexcms/core` is framework-agnostic and has no dependency on React or any
specific editor; `VexEditorAdapter` is the contract any editor package
implements. `@vexcms/richtext-plate` is the one VexCMS ships, built on
Plate.js with 13 configurable features (bold, italic, headings, lists, links,
images, tables, and more) — see its own
[README](https://www.npmjs.com/package/@vexcms/richtext-plate) for the full
feature list and customization API.

## Admin UI

The field renders whatever `editorComponent` the registered adapter supplies
— for `plateEditor()`, a full WYSIWYG toolbar editor with contextual
mark/block controls and a separate table toolbar when the cursor is inside a
table. With `mediaCollectionSlug` set, the image feature's upload and
media-library picker are wired to that collection; omitting it hides the
image feature rather than showing a broken one. In the list-view table, the
cell shows a plain-text excerpt derived from the document's text nodes, never
rendered markup.
````

#### apps/docs/src/content/docs/fields/coming-soon.mdx

Full replacement — 6 edits: `description` drops `richtext`, the intro count
goes from six to five, the table loses the `richtext` row, and the trailing
paragraph drops its `prose stores markdown...text field` sentence (it was
about the gap this spec closes). Everything else unchanged.

```mdx
---
title: Coming soon
description: Field types on the near-term VexCMS roadmap — json, email, textarea, tabs, and ui.
sidebar:
  badge:
    text: Soon
    variant: tip
---

Five field types are next on the roadmap. None of them ship yet — this page
exists so you know what's coming before you work around a gap.

| Field      | What it will do                                                 |
| ---------- | --------------------------------------------------------------- |
| `json`     | Arbitrary structured JSON data                                  |
| `email`    | Email string with format validation                             |
| `textarea` | Multi-line text input                                           |
| `tabs`     | Organizes sibling fields into a tabbed admin layout             |
| `ui`       | Non-persisted display/action fields for custom admin components |

In the meantime: structured data composes from [`group`](/fields/group/) and
[`array`](/fields/array/). Track progress on the [roadmap](/roadmap/).
```

#### packages/core/README.md

3 edits — the three places the launch plan's Acceptance section
(`core/README.md:21-24, 40-41, 81-83`) named as stating three times that no
`richtext` field exists. Everything else unchanged.

1. **Install block** (the `# Optional — rich text editor package...` comment)
   — replaces the two-line "there is no field to attach it to" caveat with a
   one-line description of what it now attaches to:

```bash
pnpm add @vexcms/core@alpha @vexcms/cli@alpha @vexcms/next@alpha @vexcms/react@alpha @vexcms/better-auth@alpha @vexcms/file-storage-convex@alpha
# Rich text editor package — attaches to a `richtext()` field via `editor: plateEditor()`
pnpm add @vexcms/richtext-plate@alpha
```

2. **Configuration API example** — the `body: text({ label: "Body" })` line
   and its "on the roadmap, does not exist yet" comment become a working
   `richtext()` call, and the example's import list gains `richtext`:

```typescript
import { defineConfig, defineCollection, text, richtext, select } from "@vexcms/core"

const posts = defineCollection({
  slug: "posts",
  labels: { singular: "Post", plural: "Posts" },
  fields: {
    title: text({ label: "Title", required: true }),
    // Rich prose uses the `richtext` field; see the Field Types section below.
    body: richtext({ label: "Body" }),
    category: select({
      label: "Category",
      // ...unchanged
```

3. **Field Types section** — count goes from 12 to 13, the table gains a
   `richtext` row, and the trailing "There is no `richtext`, `json`, ..."
   sentence drops `richtext` from its list:

```md
### Field Types

13 built-in field types with full TypeScript inference:

| Field          | Description                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `text`         | String with optional min/max length; multiline for long prose                                                                        |
| `url`          | URL string                                                                                                                           |
| `number`       | Numeric with optional min/max/step                                                                                                   |
| `checkbox`     | Boolean toggle                                                                                                                       |
| `select`       | Single or multi-value enum with options; `defaultValue` is always an array                                                           |
| `date`         | Date stored as epoch milliseconds                                                                                                    |
| `color`        | Colour value, used by the theming system                                                                                             |
| `upload`       | Reference to media collection documents; stores an array of media ids                                                                |
| `relationship` | Reference to another collection; stores `Id<collection>[]`                                                                           |
| `group`        | Named group of nested fields, stored as an object                                                                                    |
| `array`        | Wraps any field type in an array                                                                                                     |
| `blocks`       | Ordered array of block instances (discriminated union)                                                                               |
| `richtext`     | Structured rich-text document, edited and rendered through a pluggable `editor` adapter (`@vexcms/richtext-plate`'s `plateEditor()`) |

There is no `json`, `email`, `textarea`, `tabs`, `ui` or `imageUrl` field. Those
are roadmap items, not shipped API.
```

#### packages/richtext-plate/README.md

3 edits. Everything else (Exports table, Customizing Features, Editor
Features table, Image Handling, Toolbar, Frontend Rendering, Rendered
Elements, Server Safety, Peer Dependencies) unchanged.

1. **Top `[!NOTE]` callout** replaced with a one-paragraph install note (the
   caveat about a field and `editor` option that didn't exist is gone — both
   exist now):

```md
Install `@vexcms/richtext-plate` alongside a `richtext()` field: register
`plateEditor()` once as `defineConfig()`'s root `editor:` option, and every
`richtext` field in the collection set uses it.
```

2. **"Editor Setup" section** — the "there is no `richtext` field yet, this is
   what it's expected to look like" framing is replaced with the real,
   working wiring:

```md
## Editor Setup

`plateEditor()` builds the `VexEditorAdapter` (`{ type: "plate", editorComponent, renderComponent }`) this package produces for a rich-text field editor. Register it once, root-level, on the client config:

\`\`\`typescript
import { defineConfig, defineCollection, richtext } from "@vexcms/core"
import { plateEditor } from "@vexcms/richtext-plate/editor"

const posts = defineCollection({
slug: "posts",
fields: {
body: richtext({ label: "Body", required: true, mediaCollectionSlug: "images" }),
},
})

export default defineConfig({
collections: [posts],
editor: plateEditor(),
})
\`\`\`
```

3. **"Architecture" section's "Adapter pattern" bullet** — drops "a future
   editor-adapter contract... not yet shipped by `@vexcms/core`":

```md
- **Adapter pattern** — `plateEditor()` returns a `VexEditorAdapter` (`{ type, editorComponent, renderComponent }`), the same contract `@vexcms/core` exports and the admin panel's `richtext` Input consumes via `defineConfig()`'s `editor` option — pluggable against other implementations (Tiptap, Lexical, etc.) that implement the same contract
```

#### scripts/check-packed-manifests.mjs

8 edits to the existing dependency-invariant gate, adding the packed-tarball
consumer probe as two new CLI modes alongside its existing `sweep`/`packed`
checks. Everything else (both existing checks, `readWorkspaceManifests`,
`allowedSpec`) unchanged.

1. **Import** — adds `spawnSync` to the existing `node:child_process` import:

```js
import { execFileSync, spawnSync } from "node:child_process";
```

2. **New constant**, after `checkPacked`'s closing brace — the three packages
   this probe installs and typechecks against:

```js
const RICHTEXT_CONSUMER_PACKAGES = [
  "@vexcms/core",
  "@vexcms/react",
  "@vexcms/richtext-plate",
];
```

3. **`readCatalogVersion(name)`** — regex-reads one literal version out of
   `pnpm-workspace.yaml`'s top-level `catalog:` block (`react`, `react-dom`,
   `typescript`, `@types/react`, `@types/react-dom`), without adding a YAML
   parser dependency to a zero-dependency script:

```js
/**
 * Reads one literal version string out of `pnpm-workspace.yaml`'s top-level
 * `catalog:` block by name — enough for the handful of keys the richtext
 * consumer probe's throwaway `package.json` needs (`react`, `react-dom`,
 * `typescript`, `@types/react`, `@types/react-dom`), without adding a YAML
 * dependency to a zero-dependency script.
 *
 * @param {string} name catalog key, e.g. `"react"` or `"@types/react"`
 * @returns {string} the version string recorded in the catalog
 */
function readCatalogVersion(name) {
  const text = fs.readFileSync(path.join(root, "pnpm-workspace.yaml"), "utf-8");
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(
    new RegExp(`^\\s*"?${escaped}"?:\\s*"?([^"\\n]+?)"?\\s*$`, "m"),
  );
  if (!match) {
    throw new Error(`pnpm-workspace.yaml catalog has no entry for "${name}"`);
  }
  return match[1];
}
```

4. **`packPackage(pkgDir, outDir)`** — packs one package into its own
   destination directory (AP-017: every package shares one version, so a
   shared destination makes "which `.tgz` is this package's" ambiguous):

```js
/**
 * Packs a single package directory into its own destination directory and
 * returns the resulting tarball's absolute path — a package-exclusive `outDir`
 * is required (AP-017): every workspace package shares one version, so a
 * shared destination makes "which .tgz is this package's" ambiguous.
 *
 * @param {string} pkgDir
 * @param {string} outDir pre-existing, package-exclusive destination
 * @returns {string}
 */
function packPackage(pkgDir, outDir) {
  execFileSync("pnpm", ["pack", "--pack-destination", outDir], {
    cwd: pkgDir,
    stdio: "pipe",
  });
  const tarballs = fs
    .readdirSync(outDir)
    .filter((file) => file.endsWith(".tgz"));
  if (tarballs.length !== 1) {
    throw new Error(
      `expected exactly 1 tarball in ${outDir}, got ${tarballs.length}: ${tarballs.join(", ")}`,
    );
  }
  return path.join(outDir, tarballs[0]);
}
```

5. **`runRichtextConsumerProbe({ negative })`** — the probe itself. Packs the
   three packages (one destination dir each, AP-017), scaffolds a throwaway
   consumer `package.json`/`tsconfig.json`/`probe.tsx` in a fourth, equally
   isolated directory depending on the three tarballs via `file:` plus the
   catalog's `react`/`react-dom`/`typescript` versions, runs `pnpm install`
   (no `pnpm-workspace.yaml` present in that directory, so pnpm resolves it as
   a standalone project against the registry and the three local tarballs —
   never this repo's workspace), then `tsc --noEmit` against a probe file
   importing `richtext()`, `plateEditor()`, and `RichText` the way a real
   project would. `negative: true` runs the AP-013 self-test: after a normal
   successful install, it deletes the `export * from "./richtext";` line from
   the _installed_ tarball's own
   `node_modules/@vexcms/core/dist/fields/index.d.ts` and reruns `tsc`, which
   must now fail — proving the probe can actually detect a missing export
   rather than passing vacuously, mirroring `verify-scaffold.mjs`'s own
   `--negative`/`--negative-routes` self-tests and their "exit 1 on correct
   detection, meant to be wrapped in `!`" convention:

```js
/**
 * Packed-tarball consumer probe for the richtext stack — D's acceptance
 * criterion that "a consumer typechecks against the published tarball" (the
 * WP-0 probe pattern `scripts/verify-scaffold.mjs` already uses for the
 * create-vexcms templates). Packs `@vexcms/core`, `@vexcms/react`, and
 * `@vexcms/richtext-plate` — each into its own destination directory
 * (AP-017) — then scaffolds a throwaway consumer package in a fourth,
 * equally isolated directory that depends on the three tarballs via `file:`
 * plus the catalog's own `react`/`react-dom`/`typescript` versions, installs
 * with plain `pnpm install` (no workspace file present, so pnpm treats it as
 * a standalone project resolving everything from the registry and the three
 * local tarballs), and runs `tsc --noEmit` against a probe file that imports
 * `richtext()`, `plateEditor()`, and `RichText` the same way a real project
 * would.
 *
 * `negative: true` runs the AP-013 self-test instead: after a normal
 * successful install, it comments out the `export * from "./richtext";`
 * line from the *installed* tarball's own
 * `node_modules/@vexcms/core/dist/fields/index.d.ts` (never the repo source
 * — this is a copy inside the throwaway consumer directory) and reruns
 * `tsc`, which must now fail. A probe that cannot detect a missing export
 * proves nothing when it passes, so this is what proves this one is not
 * vacuously green.
 *
 * @param {{ negative?: boolean }} [options]
 * @returns {number} exit code for the real probe: 0 passing, 1 failing. For
 *   `negative: true`: 1 when the self-test correctly detected the missing
 *   export (meant to be wrapped in `!` by the caller, matching
 *   `verify-scaffold.mjs --negative-routes`'s convention) and 0 when it did
 *   not — returning 1 unconditionally would let a broken probe pass forever.
 */
function runRichtextConsumerProbe({ negative = false } = {}) {
  const manifests = readWorkspaceManifests().filter(
    ({ relPath, pkg }) =>
      relPath.startsWith("packages/") &&
      RICHTEXT_CONSUMER_PACKAGES.includes(pkg.name),
  );
  const missingBuild = manifests.filter(
    ({ relPath }) =>
      !fs.existsSync(path.join(root, path.dirname(relPath), "dist")),
  );
  if (
    manifests.length !== RICHTEXT_CONSUMER_PACKAGES.length ||
    missingBuild.length > 0
  ) {
    throw new Error(
      `richtext consumer probe requires built dist/ for ${RICHTEXT_CONSUMER_PACKAGES.join(", ")}.\n` +
        `  Run: pnpm --filter "@vexcms/core" --filter "@vexcms/react" --filter "@vexcms/richtext-plate" build`,
    );
  }

  const packRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "vex-richtext-probe-pack-"),
  );
  const consumerDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "vex-richtext-probe-consumer-"),
  );

  try {
    const tarballs = new Map();
    for (const { relPath, pkg } of manifests) {
      const pkgDir = path.join(root, path.dirname(relPath));
      const outDir = path.join(packRoot, path.basename(pkgDir));
      fs.mkdirSync(outDir, { recursive: true });
      tarballs.set(pkg.name, packPackage(pkgDir, outDir));
    }

    fs.writeFileSync(
      path.join(consumerDir, "package.json"),
      JSON.stringify(
        {
          name: "vex-richtext-consumer-probe",
          version: "0.0.0",
          private: true,
          dependencies: {
            "@vexcms/core": `file:${tarballs.get("@vexcms/core")}`,
            "@vexcms/react": `file:${tarballs.get("@vexcms/react")}`,
            "@vexcms/richtext-plate": `file:${tarballs.get("@vexcms/richtext-plate")}`,
            react: readCatalogVersion("react"),
            "react-dom": readCatalogVersion("react-dom"),
          },
          devDependencies: {
            typescript: readCatalogVersion("typescript"),
            "@types/react": readCatalogVersion("@types/react"),
            "@types/react-dom": readCatalogVersion("@types/react-dom"),
          },
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      path.join(consumerDir, "tsconfig.json"),
      JSON.stringify(
        {
          compilerOptions: {
            target: "ES2022",
            module: "ESNext",
            moduleResolution: "Bundler",
            jsx: "react-jsx",
            strict: true,
            skipLibCheck: true,
            esModuleInterop: true,
            noEmit: true,
          },
          include: ["probe.tsx"],
        },
        null,
        2,
      ),
    );

    fs.writeFileSync(
      path.join(consumerDir, "probe.tsx"),
      [
        'import { richtext } from "@vexcms/core";',
        'import type { VexEditorAdapter } from "@vexcms/core";',
        'import { plateEditor } from "@vexcms/richtext-plate/editor";',
        'import { RichText } from "@vexcms/richtext-plate/render";',
        "",
        'const field = richtext({ label: "Body" });',
        "const editor: VexEditorAdapter = plateEditor();",
        "",
        "export function Probe() {",
        "  return <RichText content={[]} />;",
        "}",
        "",
        "void field;",
        "void editor;",
        "",
      ].join("\n"),
    );

    const install = spawnSync("pnpm", ["install", "--no-frozen-lockfile"], {
      cwd: consumerDir,
      stdio: "pipe",
    });
    if (install.status !== 0) {
      console.error(install.stdout?.toString());
      console.error(install.stderr?.toString());
      throw new Error(
        "pnpm install failed in the richtext consumer probe directory",
      );
    }

    if (negative) {
      const barrelPath = path.join(
        consumerDir,
        "node_modules/@vexcms/core/dist/fields/index.d.ts",
      );
      const barrel = fs.readFileSync(barrelPath, "utf-8");
      if (!barrel.includes('export * from "./richtext";')) {
        throw new Error(
          `${barrelPath} has no 'export * from "./richtext";' line to remove`,
        );
      }
      fs.writeFileSync(
        barrelPath,
        barrel.replace('export * from "./richtext";\n', ""),
      );
    }

    const tsc = spawnSync(
      "node_modules/.bin/tsc",
      ["--noEmit", "-p", "tsconfig.json"],
      {
        cwd: consumerDir,
        stdio: "pipe",
      },
    );

    if (!negative) {
      if (tsc.status !== 0) {
        console.error(tsc.stdout?.toString());
        console.error(tsc.stderr?.toString());
        console.error(
          "✗ richtext consumer probe: tsc failed against the published tarballs",
        );
        return 1;
      }
      console.log(
        "✓ richtext consumer probe: tsc passed against the published tarballs",
      );
      return 0;
    }

    if (tsc.status === 0) {
      console.error(
        "\n✗ CRITICAL: tsc succeeded after the `richtext` export was removed from the " +
          "installed @vexcms/core tarball. The consumer probe cannot be trusted to catch a " +
          "real missing-export regression.",
      );
      return 0;
    }
    console.log(
      "\n✓ negative self-test passed: tsc correctly failed once `richtext` was removed " +
        "from the installed tarball's declarations.",
    );
    return 1;
  } finally {
    fs.rmSync(packRoot, { recursive: true, force: true });
    fs.rmSync(consumerDir, { recursive: true, force: true });
  }
}
```

6. **CLI wiring**, replacing the old bare `const selected = process.argv...`
   block — `--richtext` (optionally with `--richtext-negative`) short-circuits
   before the generic `sweep`/`packed` check selection, the same way
   `verify-scaffold.mjs`'s `negative`/`negativeRoutes` flags short-circuit
   `main()`:

```js
const cliArgs = process.argv.slice(2);
const richtext = cliArgs.includes("--richtext");
const richtextNegative = cliArgs.includes("--richtext-negative");

if (richtext) {
  process.exit(runRichtextConsumerProbe({ negative: richtextNegative }));
}

const selected = cliArgs
  .filter((arg) => arg.startsWith("--"))
  .map((arg) => arg.slice(2));
```

The rest of the file (the `checks`/`if (checks.length === 0)`/summary-loop
block) is unchanged — `--richtext`/`--richtext-negative` never reach it.

#### .changeset/richtext-field.md

New changeset, `patch` for the three packages this spec touches, following
the repo's established multi-package frontmatter format (see
`config-client-server-split.md`):

```md
---
"@vexcms/core": patch
"@vexcms/react": patch
"@vexcms/richtext-plate": patch
---

Ships the `richtext` field end to end.

`@vexcms/core` adds a `richtext()` field factory (stored as `v.array(v.any())`,
shallow Zod validation on save, a `richTextToPlainText` excerpt helper), the
`RichTextDocument`/`RichTextElement`/`RichTextText` types, and a root-level
`editor` option on `defineConfig()` that takes a `VexEditorAdapter` — the same
`ComponentHKT`-typed adapter pattern `relationship`'s `admin.components.preview`
already uses, so core stays framework-agnostic.

`@vexcms/react` registers `richtext` in both field registries with an Input
that renders the configured `editor` adapter's editor component (and a visible
configuration error, not a crash or a silent textarea, when `editor` is
missing), a Cell that shows a plain-text excerpt, and wires the field's
`mediaCollectionSlug` option to the same media-picker hooks the `upload` field
uses for inline image uploads.

`@vexcms/richtext-plate` drops all four `@ts-nocheck` pragmas, exports
`plateEditor`, `RichText`, and its feature types from the package root, and
`plateEditor()` now returns a real `VexEditorAdapter<ReactHKT>` consumable by
`defineConfig()` — closing the gap its own README has called out since launch.
```

#### .agent/docs/product/v0.1.0-launch-plan.md

2 edits. Everything else unchanged.

1. **D's row** in the ordering table:

```md
| 6 | **D** — Richtext field | The published `richtext-plate` package becomes usable | ☑ done — spec `2026-10-13-richtext-field` |
```

2. **D's section header**:

```md
## D — Richtext field — ☑ done, spec `2026-10-13-richtext-field`
```

Verify: `node scripts/check-packed-manifests.mjs --richtext` passes; `! node scripts/check-packed-manifests.mjs --richtext --richtext-negative` passes (confirms the probe actually detects a missing export, per AP-013); `pnpm --filter docs build`

## Verification

- `pnpm typecheck && pnpm test` — green across the workspace.
- `pnpm --filter @vexcms/richtext-plate build` and `grep -r "@ts-nocheck" packages/richtext-plate/src` — no matches.
- `node scripts/check-packed-manifests.mjs --richtext` passes; the negative variant fails (AP-013).
- Manual in the developer's running `apps/test` (P-024 — attach, never start servers): create a post, write formatted body text, insert an uploaded image, save draft, publish, reload the admin (image persists), open the public post page (renders via `RichText`), check the list-view cell shows a plain-text excerpt.
