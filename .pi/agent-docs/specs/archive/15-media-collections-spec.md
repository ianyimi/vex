# 15 — Media Collections, File Storage Adapter & Upload UI

## Overview

Adds media collection support to Vex CMS: a `media` config field on `VexConfig` containing `collections` (media-specific collections with auto-injected file metadata fields) and `storageAdapter` (a pluggable file storage interface). Includes a new `upload()` field type for referencing and uploading media from regular collections, a `defineMediaCollection()` builder, a `@vexcms/file-storage-convex` package, and full admin UI for browsing/searching existing media and uploading new files via a modal overlay.

## Design Decisions

- **`defineMediaCollection()` builder**: Auto-injects default fields (storageId, filename, mimeType, size, url, alt, width, height) and a `by_mimeType` index. Users can override some defaults (alt, width, height, url) but not system fields (storageId, filename, mimeType, size). Auto-adds `admin.useAsTitle: "filename"` if not set by user, so a search index is auto-generated on filename.
- **`upload()` field type**: Lives in `packages/core/src/fields/media/`. Stores `v.id("media_collection_slug")` — a reference to a media document. Has `to` (media collection slug), `accept` (MIME type restrictions), `maxSize` (bytes). The admin UI renders a two-part control: a popover picker for existing media + a button to open a "create new" modal.
- **Config shape**: `media` is an object with `collections` and `storageAdapter` fields.
- **All file types accepted**: Media collections are not limited to images/videos. The `by_mimeType` index enables filtering by file type at query time. The `upload()` field's `accept` option restricts file types per-field.
- **Locked fields**: `storageId`, `filename`, `mimeType`, and `size` cannot be overridden by user config.
- **Adapter-driven storageId type**: `FileStorageAdapter` includes a `storageIdValueType` property (e.g., `'v.id("_storage")'` for Convex, `'v.string()'` for generic). Schema generation reads this to determine the storageId column type.
- **Separate package for Convex adapter**: `@vexcms/file-storage-convex` follows `@vexcms/better-auth` pattern.
- **Modal upload flow**: "Create new media" opens as a dialog overlay triggered by a `newMedia` URL param via nuqs. After upload completes, modal closes and the new media document ID is passed back to the upload field.
- **All fields use `processFieldValueTypeOptions`**: The existing `relationship` and `json` field schemaValueType functions bypass the shared `processFieldValueTypeOptions` util and duplicate optional-wrapping logic inline. This spec fixes that tech debt by adding a `skipDefaultValidation` option to the util, then refactoring `relationship`, `json`, and the new `upload` field to all use it. Every field's schemaValueType function must go through this shared util as its final step — no field should implement its own required/optional wrapping logic.

## Out of Scope

- Bulk/multi-file upload
- Image transformation/optimization/CDN
- Media library browser (standalone gallery page)
- Upload progress bar
- Migration support or codemods for converting `imageUrl` fields to `upload` fields

## Target Directory Structure

```
packages/core/src/
├── types/
│   ├── fields.ts            # + UploadFieldMeta, UploadFieldOptions
│   ├── media.ts             # NEW — MediaConfig, MediaConfigInput, FileStorageAdapter, MediaCollectionConfig
│   └── index.ts             # + re-export media types, media on VexConfig
├── fields/
│   ├── media/               # NEW
│   │   ├── index.ts         # re-export
│   │   ├── config.ts        # upload() field builder
│   │   ├── schemaValueType.ts        # uploadToValueTypeString
│   │   └── schemaValueType.test.ts   # tests
│   ├── constants.ts         # (no change)
│   └── index.ts             # + export upload
├── config/
│   ├── defineMediaCollection.ts       # NEW
│   └── defineMediaCollection.test.ts  # NEW
├── valueTypes/
│   ├── processAdminOptions.ts       # MODIFIED — add skipDefaultValidation option
│   ├── processAdminOptions.test.ts  # MODIFIED — add skipDefaultValidation tests
│   ├── extract.ts           # + upload case in switch
│   ├── extract.test.ts      # + upload field tests
│   ├── generate.ts          # + media collection generation
│   ├── generate.test.ts     # + media collection tests
│   ├── slugs.ts             # + mediaCollection slug source
│   └── slugs.test.ts        # + media slug tests
├── formSchema/
│   ├── generateFormSchema.ts      # + upload case
│   └── generateFormSchema.test.ts # + upload case test
├── errors/
│   └── index.ts             # + VexMediaConfigError
└── index.ts                 # + new exports

packages/file-storage-convex/  # NEW PACKAGE
├── package.json
├── tsconfig.json
├── tsconfig.build.json
├── tsup.config.ts
├── vitest.config.ts
└── src/
    ├── index.ts             # convexFileStorage() factory
    └── index.test.ts        # tests

packages/ui/src/
├── components/
│   ├── form/
│   │   ├── fields/
│   │   │   ├── UploadField.tsx          # NEW — picker + upload button
│   │   │   └── index.ts                # + export UploadField
│   │   └── AppForm.tsx                  # + upload case in switch
│   └── ui/
│       ├── media-picker.tsx             # NEW — popover search with infinite scroll
│       ├── upload-dropzone.tsx          # NEW — drag-and-drop file input
│       ├── create-media-modal.tsx       # NEW — modal overlay for new media upload
│       └── index.tsx                    # + export new components

packages/admin-next/src/
├── hooks/
│   └── useMediaPicker.ts               # NEW — paginated search + selection logic
└── views/
    └── CollectionEditView.tsx           # + CreateMediaModal integration

apps/test-app/convex/vex/
├── collections.ts           # + generateUploadUrl, createMediaDocument, paginatedSearchDocuments
└── model/
    └── collections.ts       # + model functions for media operations
```

## Implementation Order

1. **Step 1: Package scaffolding** — Create `@vexcms/file-storage-convex` package. After: `pnpm install` works.
2. **Step 2: Media types** — `FileStorageAdapter`, `MediaConfig`, error class in `@vexcms/core`. After: types importable.
3. **Step 3: Refactor `processFieldValueTypeOptions`** — Add `skipDefaultValidation` flag, refactor `relationship` and `json` schemaValueType to use the shared util instead of inline logic. After: all existing fields still pass tests, tech debt eliminated.
4. **Step 4: Upload field type** — `UploadFieldMeta`, `UploadFieldOptions`, `upload()` builder, schema value type using `processFieldValueTypeOptions` + tests. After: `upload()` field works in isolation.
5. **Step 5: `defineMediaCollection()` + tests** — Builder with auto-injected fields, locked field validation, `useAsTitle` default. After: media collections definable.
6. **Step 6: VexConfig integration** — `media` field on config, `defineConfig()` validation, slug registry. After: config accepts media.
7. **Step 7: Schema generation** — `generateVexSchema()` for media collections, `fieldToValueType()` + `fieldMetaToZod()` for upload, adapter-driven storageId type. After: full schema generation works.
8. **Step 8: Convex file storage adapter** — `convexFileStorage()` implementation. After: adapter package complete.
9. **Step 9: Convex functions** — `generateUploadUrl`, `createMediaDocument`, `paginatedSearchDocuments` mutations/queries. After: server-side media operations work.
10. **Step 10: Media picker component** — Popover with search, image thumbnails, infinite scroll. After: picker UI works standalone.
11. **Step 11: Upload dropzone component** — Drag-and-drop file input with accept/maxSize validation. After: file selection works.
12. **Step 12: Create media modal** — nuqs-driven modal overlay composing dropzone + form fields, orchestrates upload flow. After: full upload flow works.
13. **Step 13: UploadField form component** — Wires picker + modal into the form system, AppForm switch case. After: upload field renders in edit view.
14. **Step 14: Core exports + test app example** — All exports, example config.

---

## Step 1: Package Scaffolding — `@vexcms/file-storage-convex`

- [ ] Create `packages/file-storage-convex/` directory
- [ ] Create `package.json`
- [ ] Create `tsconfig.json`
- [ ] Create `tsconfig.build.json`
- [ ] Create `tsup.config.ts`
- [ ] Create `vitest.config.ts`
- [ ] Create `src/index.ts` with placeholder export
- [ ] Run `pnpm install`
- [ ] Run `pnpm --filter @vexcms/file-storage-convex build`

**`File: packages/file-storage-convex/package.json`**

```json
{
  "name": "@vexcms/file-storage-convex",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "convex": "catalog:",
    "@vexcms/core": "workspace:*"
  },
  "devDependencies": {
    "@vexcms/core": "workspace:*",
    "@vexcms/tsconfig": "workspace:*",
    "convex": "catalog:",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

**`File: packages/file-storage-convex/tsconfig.json`**

```json
{
  "extends": "@vexcms/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": {
      "@vexcms/core": ["../../packages/core/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

**`File: packages/file-storage-convex/tsconfig.build.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "paths": {}
  }
}
```

**`File: packages/file-storage-convex/tsup.config.ts`**

```typescript
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  tsconfig: "tsconfig.build.json",
  dts: true,
  sourcemap: true,
  clean: true,
  external: ["convex", "@vexcms/core"],
});
```

**`File: packages/file-storage-convex/vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: false,
  },
});
```

**`File: packages/file-storage-convex/src/index.ts`**

Placeholder so the package builds. Replaced in Step 7.

```typescript
export {};
```

---

## Step 2: Media Types

- [ ] Create `packages/core/src/types/media.ts`
- [ ] Update `packages/core/src/types/index.ts` to re-export media types and add `media` to `VexConfig`/`VexConfigInput`
- [ ] Add `VexMediaConfigError` to `packages/core/src/errors/index.ts`
- [ ] Verify `pnpm --filter @vexcms/core typecheck` passes

**`File: packages/core/src/types/media.ts`**

```typescript
import type { VexField } from "./fields";
import type { AnyVexCollection, CollectionAdminConfig } from "./collections";

/**
 * Interface that file storage plugins must implement.
 * Each method operates on the storage provider (e.g., Convex file storage, S3, Cloudinary).
 */
export interface FileStorageAdapter {
  /** Identifier for the storage provider (e.g., "convex", "s3", "cloudinary"). */
  readonly name: string;

  /**
   * The Convex value type string for the storageId field in media collections.
   * Determines the schema type at generation time.
   *
   * - Convex adapter: `'v.id("_storage")'` — typed reference to Convex file storage
   * - Generic adapters: `'v.string()'` — plain string for external storage URLs/IDs
   */
  readonly storageIdValueType: string;

  /**
   * Get a presigned upload URL from the storage provider.
   * Called by the admin panel before uploading a file.
   *
   * @returns A URL string that accepts file uploads via PUT/POST.
   */
  getUploadUrl: () => Promise<string>;

  /**
   * Resolve a storage ID to an accessible URL.
   *
   * @param props.storageId - The storage provider's file identifier.
   * @returns A URL string for accessing the file, or null if the file doesn't exist.
   */
  getUrl: (props: { storageId: string }) => Promise<string | null>;

  /**
   * Delete a file from the storage provider.
   *
   * @param props.storageId - The storage provider's file identifier.
   */
  deleteFile: (props: { storageId: string }) => Promise<void>;
}

/**
 * Fields that are auto-injected into every media collection and cannot be overridden.
 */
export const LOCKED_MEDIA_FIELDS = [
  "storageId",
  "filename",
  "mimeType",
  "size",
] as const;
export type LockedMediaField = (typeof LOCKED_MEDIA_FIELDS)[number];

/**
 * Fields that are auto-injected but CAN be overridden by the user.
 */
export const OVERRIDABLE_MEDIA_FIELDS = [
  "url",
  "alt",
  "width",
  "height",
] as const;
export type OverridableMediaField = (typeof OVERRIDABLE_MEDIA_FIELDS)[number];

/**
 * Configuration for a media collection.
 * The `fields` record contains ONLY user-defined additional fields or overrides
 * of overridable defaults. Locked fields are auto-injected by `defineMediaCollection()`.
 */
export interface MediaCollectionConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  fields?: TFields;
  tableName?: string;
  labels?: { singular?: string; plural?: string };
  admin?: CollectionAdminConfig<TFields, never>;
}

/**
 * The resolved media configuration on VexConfig.
 */
export interface MediaConfig {
  collections: AnyVexCollection[];
  storageAdapter: FileStorageAdapter;
}

/**
 * Input shape for the `media` field on VexConfigInput.
 */
export interface MediaConfigInput {
  collections: AnyVexCollection[];
  storageAdapter: FileStorageAdapter;
}
```

**`File: packages/core/src/types/index.ts`** — Updated with media field on config.

```typescript
import { AnyVexCollection } from "./collections";
import { VexGlobal } from "./globals";
import type { VexAuthAdapter } from "./auth";
import { AdminConfig, AdminConfigInput } from "./admin";
import { SchemaConfig, SchemaConfigInput } from "./schema";
import type { MediaConfig, MediaConfigInput } from "./media";

export * from "./fields";
export * from "./collections";
export * from "./globals";
export * from "./auth";
export * from "./admin";
export * from "./schema";
export * from "./media";

export interface VexConfig {
  basePath: string;
  collections: AnyVexCollection[];
  globals: VexGlobal[];
  admin: AdminConfig;
  auth: VexAuthAdapter;
  schema: SchemaConfig;
  media?: MediaConfig;
}

export interface VexConfigInput {
  basePath?: string;
  collections?: AnyVexCollection[];
  globals?: VexGlobal<any>[];
  admin?: AdminConfigInput;
  auth: VexAuthAdapter;
  schema?: SchemaConfigInput;
  media?: MediaConfigInput;
}
```

**`File: packages/core/src/errors/index.ts`** — Append `VexMediaConfigError`.

```typescript
/**
 * Thrown when media configuration is invalid.
 */
export class VexMediaConfigError extends VexError {
  constructor(detail: string) {
    super(`Media configuration error: ${detail}`);
    this.name = "VexMediaConfigError";
  }
}
```

---

## Step 3: Refactor `processFieldValueTypeOptions` + Fix Existing Tech Debt

- [ ] Update `packages/core/src/valueTypes/processAdminOptions.ts` — add `skipDefaultValidation` option
- [ ] Update `packages/core/src/valueTypes/processAdminOptions.test.ts` — add tests for `skipDefaultValidation`
- [ ] Refactor `packages/core/src/fields/relationship/schemaValueType.ts` — use `processFieldValueTypeOptions` instead of inline logic
- [ ] Refactor `packages/core/src/fields/json/schemaValueType.ts` — use `processFieldValueTypeOptions` instead of inline logic
- [ ] Run `pnpm --filter @vexcms/core test` — all existing tests must still pass

**`File: packages/core/src/valueTypes/processAdminOptions.ts`** — Add `skipDefaultValidation`.

The current function always validates `defaultValue` existence and type when `required=true`. Fields like `relationship`, `json`, and the new `upload` don't have defaultValues — they're reference types set at document creation time. Adding `skipDefaultValidation` lets these fields use the shared util for optional-wrapping without needing to provide a fake defaultValue.

```typescript
import type { BaseFieldMeta } from "../types";
import { VexFieldValidationError } from "../errors";

/**
 * Validates a field's configuration and wraps in v.optional() if not required.
 * This is the SINGLE place where required/optional logic lives — every field's
 * schemaValueType function must use this as its final step.
 *
 * @param props.meta - The field metadata
 * @param props.collectionSlug - Collection slug (for error messages)
 * @param props.fieldName - Field name (for error messages)
 * @param props.expectedType - Expected typeof for defaultValue (e.g., "string", "number")
 * @param props.valueType - The unwrapped value type string (e.g., 'v.string()', 'v.id("users")')
 * @param props.skipDefaultValidation - When true, skip defaultValue existence/type checks.
 *   Use for reference-type fields (relationship, upload, json) that don't have defaultValues.
 *
 * @returns The value type string, wrapped in v.optional() if not required.
 */
export function processFieldValueTypeOptions(props: {
  meta: BaseFieldMeta & { defaultValue?: unknown };
  collectionSlug: string;
  fieldName: string;
  expectedType: string;
  valueType: string;
  skipDefaultValidation?: boolean;
}): string {
  if (!props.meta.required) {
    return `v.optional(${props.valueType})`;
  }

  if (!props.skipDefaultValidation) {
    if (props.meta.defaultValue === undefined) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        "No defaultValue Provided",
      );
    }
    if (!(typeof props.meta.defaultValue === props.expectedType)) {
      throw new VexFieldValidationError(
        props.collectionSlug,
        props.fieldName,
        `Invalid defaultValue Provided. Expected: ${props.expectedType}, Received: ${typeof props.meta.defaultValue}`,
      );
    }
  }

  return props.valueType;
}
```

**`File: packages/core/src/valueTypes/processAdminOptions.test.ts`** — Add tests for `skipDefaultValidation`.

Add to the existing test file:

```typescript
describe("skipDefaultValidation", () => {
  it("returns valueType when required=true and skipDefaultValidation=true (no defaultValue needed)", () => {
    const result = processFieldValueTypeOptions({
      meta: { type: "relationship", required: true },
      collectionSlug: "posts",
      fieldName: "author",
      expectedType: "string",
      valueType: 'v.id("users")',
      skipDefaultValidation: true,
    });
    expect(result).toBe('v.id("users")');
  });

  it("returns v.optional(valueType) when required=false and skipDefaultValidation=true", () => {
    const result = processFieldValueTypeOptions({
      meta: { type: "relationship" },
      collectionSlug: "posts",
      fieldName: "author",
      expectedType: "string",
      valueType: 'v.id("users")',
      skipDefaultValidation: true,
    });
    expect(result).toBe('v.optional(v.id("users"))');
  });

  it("does NOT throw when required=true, no defaultValue, and skipDefaultValidation=true", () => {
    expect(() =>
      processFieldValueTypeOptions({
        meta: { type: "json", required: true },
        collectionSlug: "posts",
        fieldName: "metadata",
        expectedType: "object",
        valueType: "v.any()",
        skipDefaultValidation: true,
      }),
    ).not.toThrow();
  });

  it("still throws when required=true, no defaultValue, and skipDefaultValidation is false/undefined", () => {
    expect(() =>
      processFieldValueTypeOptions({
        meta: { type: "text", required: true },
        collectionSlug: "posts",
        fieldName: "title",
        expectedType: "string",
        valueType: "v.string()",
      }),
    ).toThrow("No defaultValue Provided");
  });
});
```

**`File: packages/core/src/fields/relationship/schemaValueType.ts`** — Refactored to use `processFieldValueTypeOptions`.

```typescript
import type { RelationshipFieldMeta } from "../../types";
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";

/**
 * Converts relationship field metadata to a Convex value type string.
 *
 * Uses processFieldValueTypeOptions with skipDefaultValidation=true
 * since relationship fields don't have defaultValues — they're references
 * set at document creation time.
 *
 * @returns
 * - hasMany + required: `v.array(v.id("tableName"))`
 * - hasMany + !required: `v.optional(v.array(v.id("tableName")))`
 * - !hasMany + required: `v.id("tableName")`
 * - !hasMany + !required: `v.optional(v.id("tableName"))`
 */
export function relationshipToValueTypeString(props: {
  meta: RelationshipFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  const idType = `v.id("${props.meta.to}")`;
  const baseValueType = props.meta.hasMany ? `v.array(${idType})` : idType;

  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: baseValueType,
    skipDefaultValidation: true,
  });
}
```

**`File: packages/core/src/fields/json/schemaValueType.ts`** — Refactored to use `processFieldValueTypeOptions`.

```typescript
import type { JsonFieldMeta } from "../../types";
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";
import { JSON_VALUETYPE } from "../constants";

/**
 * Converts json field metadata to a Convex value type string.
 *
 * Uses processFieldValueTypeOptions with skipDefaultValidation=true
 * since json fields store arbitrary data and don't have typed defaultValues.
 *
 * @returns
 * - required: `"v.any()"`
 * - !required: `"v.optional(v.any())"`
 */
export function jsonToValueTypeString(props: {
  meta: JsonFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "object",
    valueType: JSON_VALUETYPE,
    skipDefaultValidation: true,
  });
}
```

All existing `relationship` and `json` tests must pass unchanged — the behavior is identical, just centralized.

---

## Step 4: Upload Field Type

- [ ] Add `UploadFieldMeta` and `UploadFieldOptions` to `packages/core/src/types/fields.ts`
- [ ] Add `upload` variants to `VexField` union and `FieldMeta` union
- [ ] Create `packages/core/src/fields/media/config.ts`
- [ ] Create `packages/core/src/fields/media/schemaValueType.ts`
- [ ] Create `packages/core/src/fields/media/index.ts`
- [ ] Create `packages/core/src/fields/media/schemaValueType.test.ts`
- [ ] Update `packages/core/src/fields/index.ts` to export `upload`
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/types/fields.ts`** — Add UploadFieldMeta and UploadFieldOptions.

Add after `RelationshipFieldOptions` (around line 379):

```typescript
/**
 * Upload field metadata. References a media collection document via `v.id()`.
 * The admin UI renders a media picker with search + an upload button.
 */
export interface UploadFieldMeta extends BaseFieldMeta {
  readonly type: "upload";
  /** Target media collection slug. */
  to: string;
  /**
   * Allow multiple media references.
   *
   * Default: `false`
   */
  hasMany?: boolean;
  /**
   * Accepted MIME types for file uploads.
   * Supports exact types ("image/png") and wildcards ("image/*").
   * When not set, all file types are accepted.
   *
   * @example ["image/*"] — images only
   * @example ["image/png", "image/jpeg"] — specific image formats
   * @example ["application/pdf", "image/*"] — PDFs and all images
   */
  accept?: string[];
  /**
   * Maximum file size in bytes for uploads.
   * When not set, no size limit is enforced (beyond storage provider limits).
   *
   * @example 5 * 1024 * 1024 — 5 MB
   */
  maxSize?: number;
}

/**
 * Options for the `upload()` field builder.
 *
 * @example
 * upload({ to: "images", required: true })
 * upload({ to: "images", hasMany: true, accept: ["image/*"], maxSize: 5 * 1024 * 1024 })
 */
export interface UploadFieldOptions extends BaseFieldOptions {
  /** Target media collection slug. */
  to: string;
  /**
   * Allow multiple media references.
   *
   * Default: `false`
   */
  hasMany?: boolean;
  /**
   * Accepted MIME types for file uploads.
   * Supports exact types and wildcards.
   */
  accept?: string[];
  /**
   * Maximum file size in bytes for uploads.
   */
  maxSize?: number;
}
```

Update `FieldMeta` union:

```typescript
export type FieldMeta =
  | TextFieldMeta
  | NumberFieldMeta
  | CheckboxFieldMeta
  | SelectFieldMeta<string>
  | DateFieldMeta
  | ImageUrlFieldMeta
  | RelationshipFieldMeta
  | UploadFieldMeta
  | JsonFieldMeta
  | ArrayFieldMeta;
```

Update `VexField` union:

```typescript
export type VexField =
  | GenericVexField<string, TextFieldMeta>
  | GenericVexField<number, NumberFieldMeta>
  | GenericVexField<boolean, CheckboxFieldMeta>
  | GenericVexField<string, SelectFieldMeta<string>>
  | GenericVexField<string[], SelectFieldMeta<string>>
  | GenericVexField<number, DateFieldMeta>
  | GenericVexField<string, ImageUrlFieldMeta>
  | GenericVexField<string, RelationshipFieldMeta>
  | GenericVexField<string, UploadFieldMeta>
  | GenericVexField<string[], UploadFieldMeta>
  | GenericVexField<unknown, JsonFieldMeta>
  | GenericVexField<unknown[], ArrayFieldMeta>;
```

**`File: packages/core/src/fields/media/config.ts`**

```typescript
import {
  UploadFieldMeta,
  UploadFieldOptions,
  GenericVexField,
} from "../../types";

export function upload(
  options: UploadFieldOptions & { hasMany: true },
): GenericVexField<string[], UploadFieldMeta>;

export function upload(
  options: UploadFieldOptions & { hasMany?: false },
): GenericVexField<string, UploadFieldMeta>;

export function upload(
  options: UploadFieldOptions,
): GenericVexField<string | string[], UploadFieldMeta> {
  return {
    _type: options.hasMany ? [] : "",
    _meta: {
      type: "upload",
      ...options,
    },
  };
}
```

**`File: packages/core/src/fields/media/schemaValueType.ts`**

Uses `processFieldValueTypeOptions` with `skipDefaultValidation: true` — same pattern as the refactored `relationship` field. Upload fields are reference types with no defaultValue.

```typescript
import type { UploadFieldMeta } from "../../types";
import { processFieldValueTypeOptions } from "../../valueTypes/processAdminOptions";

/**
 * Converts upload field metadata to a Convex value type string.
 * Uses processFieldValueTypeOptions for required/optional wrapping,
 * same pattern as relationship fields.
 *
 * @returns
 * - hasMany + required: `v.array(v.id("mediaCollectionSlug"))`
 * - hasMany + !required: `v.optional(v.array(v.id("mediaCollectionSlug")))`
 * - !hasMany + required: `v.id("mediaCollectionSlug")`
 * - !hasMany + !required: `v.optional(v.id("mediaCollectionSlug"))`
 */
export function uploadToValueTypeString(props: {
  meta: UploadFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  const idType = `v.id("${props.meta.to}")`;
  const baseValueType = props.meta.hasMany ? `v.array(${idType})` : idType;

  return processFieldValueTypeOptions({
    meta: props.meta,
    collectionSlug: props.collectionSlug,
    fieldName: props.fieldName,
    expectedType: "string",
    valueType: baseValueType,
    skipDefaultValidation: true,
  });
}
```

**`File: packages/core/src/fields/media/index.ts`**

```typescript
export { upload } from "./config";
export { uploadToValueTypeString } from "./schemaValueType";
```

**`File: packages/core/src/fields/media/schemaValueType.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { uploadToValueTypeString } from "./schemaValueType";
import type { UploadFieldMeta } from "../../types";

describe("uploadToValueTypeString", () => {
  it("returns v.id() for a required single upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      required: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.id("images")');
  });

  it("returns v.optional(v.id()) for an optional single upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.optional(v.id("images"))');
  });

  it("returns v.array(v.id()) for a required hasMany upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      hasMany: true,
      required: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "gallery",
      }),
    ).toBe('v.array(v.id("images"))');
  });

  it("returns v.optional(v.array(v.id())) for an optional hasMany upload reference", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      hasMany: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "gallery",
      }),
    ).toBe('v.optional(v.array(v.id("images")))');
  });

  it("uses the correct media collection slug in v.id()", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "documents",
      required: true,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "articles",
        fieldName: "attachment",
      }),
    ).toBe('v.id("documents")');
  });

  it("ignores accept and maxSize for schema generation", () => {
    const meta: UploadFieldMeta = {
      type: "upload",
      to: "images",
      required: true,
      accept: ["image/*"],
      maxSize: 5 * 1024 * 1024,
    };
    expect(
      uploadToValueTypeString({
        meta,
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.id("images")');
  });
});
```

**`File: packages/core/src/fields/index.ts`** — Add upload export.

```typescript
export { text } from "./text";
export { number } from "./number";
export { checkbox } from "./checkbox";
export { select } from "./select";
export { date } from "./date";
export { imageUrl } from "./imageUrl";
export { relationship } from "./relationship";
export { upload } from "./media";
export { json } from "./json";
export { array } from "./array";
```

---

## Step 5: `defineMediaCollection()` Builder + Tests

- [ ] Create `packages/core/src/config/defineMediaCollection.ts`
- [ ] Create `packages/core/src/config/defineMediaCollection.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/config/defineMediaCollection.ts`**

````typescript
import type {
  VexField,
  VexCollection,
  InferFieldsType,
  MediaCollectionConfig,
} from "../types";
import { LOCKED_MEDIA_FIELDS } from "../types/media";
import { text } from "../fields/text";
import { number } from "../fields/number";

/**
 * Default fields auto-injected into every media collection.
 *
 * NOTE: The `storageId` field uses text() as a placeholder here.
 * At schema generation time, `generateVexSchema()` reads
 * `config.media.storageAdapter.storageIdValueType` and replaces the
 * storageId value type string accordingly (e.g., `v.id("_storage")` for Convex).
 */
function getDefaultMediaFields(): Record<string, VexField> {
  return {
    storageId: text({
      required: true,
      defaultValue: "",
      label: "Storage ID",
      admin: { hidden: true },
    }),
    filename: text({
      required: true,
      defaultValue: "",
      label: "Filename",
      admin: { readOnly: true },
    }),
    mimeType: text({
      required: true,
      defaultValue: "",
      label: "MIME Type",
      index: "by_mimeType",
      admin: { readOnly: true },
    }),
    size: number({
      required: true,
      defaultValue: 0,
      label: "File Size (bytes)",
      admin: { readOnly: true },
    }),
    url: text({
      required: true,
      defaultValue: "",
      label: "URL",
      admin: { readOnly: true },
    }),
    alt: text({ label: "Alt Text" }),
    width: number({ label: "Width (px)" }),
    height: number({ label: "Height (px)" }),
  };
}

/**
 * Define a media collection with auto-injected file metadata fields.
 *
 * Creates a VexCollection with default media fields merged in. Locked fields
 * (storageId, filename, mimeType, size) cannot be overridden. Overridable fields
 * (url, alt, width, height) can be customized. Additional user fields are appended.
 *
 * Auto-adds `admin.useAsTitle: "filename"` if not explicitly set, so a search
 * index is auto-generated on filename for the media picker's search feature.
 *
 * @param slug - The collection slug
 * @param config - Optional media collection configuration
 * @returns A VexCollection with all default media fields and user fields merged
 *
 * @example
 * ```ts
 * const images = defineMediaCollection("images", {
 *   fields: {
 *     alt: text({ label: "Alt Text", required: true, defaultValue: "", maxLength: 200 }),
 *     caption: text({ label: "Caption" }),
 *   },
 * });
 * ```
 */
export function defineMediaCollection<
  TSlug extends string,
  TFields extends Record<string, VexField> = Record<string, VexField>,
>(
  slug: TSlug,
  config?: MediaCollectionConfig<TFields>,
): VexCollection<Record<string, VexField>, never> {
  // TODO: implement
  //
  // 1. Get default media fields via getDefaultMediaFields()
  //
  // 2. If config.fields is provided, iterate over user fields:
  //    a. For each user field, check if it's a locked field (in LOCKED_MEDIA_FIELDS)
  //       → If locked AND process.env.NODE_ENV !== "production": console.warn
  //         `[vex] Media collection "${slug}": field "${fieldName}" is a system field and cannot be overridden`
  //       → Skip the locked field (do not merge it)
  //    b. If not locked: merge user field into defaults (user field overwrites default)
  //
  // 3. Build the final fields record: defaults with user overrides/additions applied
  //
  // 4. Validate slug format same as defineCollection:
  //    → If process.env.NODE_ENV !== "production" and slug doesn't match /^[a-z][a-z0-9_]*$/: warn
  //    → If slug starts with "vex_": warn reserved prefix
  //
  // 5. Build admin config with useAsTitle default:
  //    → If config?.admin?.useAsTitle is set: use it
  //    → Otherwise: default to "filename"
  //    → Merge with rest of config?.admin
  //
  // 6. Return a VexCollection object:
  //    {
  //      slug,
  //      config: {
  //        fields: mergedFields,
  //        tableName: config?.tableName,
  //        labels: config?.labels,
  //        admin: mergedAdminConfig,
  //      },
  //      _docType: {} as InferFieldsType<...>,
  //    }
  //
  // Edge cases:
  // - config is undefined: return collection with only default fields + useAsTitle: "filename"
  // - config.fields is undefined or empty {}: same as above
  // - User overrides "alt" with text({ required: true, ... }): alt gets user's config
  // - User tries to override "storageId": warning logged, storageId stays as default
  // - User sets admin.useAsTitle to "alt": use "alt" instead of default "filename"
  throw new Error("Not implemented");
}
````

**`File: packages/core/src/config/defineMediaCollection.test.ts`**

```typescript
import { describe, it, expect, vi } from "vitest";
import { defineMediaCollection } from "./defineMediaCollection";
import { text } from "../fields/text";
import { number } from "../fields/number";
import type { VexField } from "../types";

describe("defineMediaCollection", () => {
  describe("default fields", () => {
    it("includes all default media fields when no config provided", () => {
      const collection = defineMediaCollection("images");
      const fieldNames = Object.keys(collection.config.fields);

      expect(fieldNames).toContain("storageId");
      expect(fieldNames).toContain("filename");
      expect(fieldNames).toContain("mimeType");
      expect(fieldNames).toContain("size");
      expect(fieldNames).toContain("url");
      expect(fieldNames).toContain("alt");
      expect(fieldNames).toContain("width");
      expect(fieldNames).toContain("height");
    });

    it("includes all default media fields when config has empty fields", () => {
      const collection = defineMediaCollection("images", { fields: {} });
      const fieldNames = Object.keys(collection.config.fields);
      expect(fieldNames).toContain("storageId");
      expect(fieldNames).toContain("mimeType");
      expect(fieldNames).toContain("alt");
    });

    it("sets storageId as required hidden text field", () => {
      const collection = defineMediaCollection("images");
      const field = collection.config.fields.storageId as VexField;
      expect(field._meta.type).toBe("text");
      expect(field._meta.required).toBe(true);
      expect(field._meta.admin?.hidden).toBe(true);
    });

    it("sets mimeType as required read-only text field with index", () => {
      const collection = defineMediaCollection("images");
      const field = collection.config.fields.mimeType as VexField;
      expect(field._meta.type).toBe("text");
      expect(field._meta.required).toBe(true);
      expect(field._meta.admin?.readOnly).toBe(true);
      expect(field._meta.index).toBe("by_mimeType");
    });

    it("sets alt as optional text field", () => {
      const collection = defineMediaCollection("images");
      const field = collection.config.fields.alt as VexField;
      expect(field._meta.type).toBe("text");
      expect(field._meta.required).toBeUndefined();
    });
  });

  describe("useAsTitle default", () => {
    it("defaults useAsTitle to 'filename' when admin config not provided", () => {
      const collection = defineMediaCollection("images");
      expect(collection.config.admin?.useAsTitle).toBe("filename");
    });

    it("defaults useAsTitle to 'filename' when admin config has no useAsTitle", () => {
      const collection = defineMediaCollection("images", {
        admin: { group: "Media" },
      });
      expect(collection.config.admin?.useAsTitle).toBe("filename");
      expect(collection.config.admin?.group).toBe("Media");
    });

    it("respects explicit useAsTitle from user config", () => {
      const collection = defineMediaCollection("images", {
        admin: { useAsTitle: "alt" as any },
      });
      expect(collection.config.admin?.useAsTitle).toBe("alt");
    });
  });

  describe("user field overrides", () => {
    it("allows overriding overridable fields (alt)", () => {
      const collection = defineMediaCollection("images", {
        fields: {
          alt: text({
            label: "Image Alt Text",
            required: true,
            defaultValue: "",
            maxLength: 200,
          }),
        },
      });
      const field = collection.config.fields.alt as VexField;
      expect(field._meta.label).toBe("Image Alt Text");
      expect(field._meta.required).toBe(true);
      expect((field._meta as any).maxLength).toBe(200);
    });

    it("allows adding custom fields", () => {
      const collection = defineMediaCollection("images", {
        fields: {
          caption: text({ label: "Caption" }),
          sortOrder: number({ label: "Sort Order" }),
        },
      });
      const fieldNames = Object.keys(collection.config.fields);
      expect(fieldNames).toContain("caption");
      expect(fieldNames).toContain("sortOrder");
      expect(fieldNames).toContain("storageId");
    });

    it("drops locked fields with dev warning", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const collection = defineMediaCollection("images", {
        fields: {
          storageId: text({ label: "My Custom Storage ID" }),
        },
      });

      expect(collection.config.fields.storageId._meta.label).toBe("Storage ID");
      expect(collection.config.fields.storageId._meta.admin?.hidden).toBe(true);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("storageId"),
      );

      warnSpy.mockRestore();
    });

    it("drops all locked fields (storageId, filename, mimeType, size)", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const collection = defineMediaCollection("images", {
        fields: {
          storageId: text({ label: "override1" }),
          filename: text({ label: "override2" }),
          mimeType: text({ label: "override3" }),
          size: number({ label: "override4" }),
        },
      });

      expect(collection.config.fields.storageId._meta.label).toBe("Storage ID");
      expect(collection.config.fields.filename._meta.label).toBe("Filename");
      expect(collection.config.fields.mimeType._meta.label).toBe("MIME Type");
      expect(collection.config.fields.size._meta.label).toBe(
        "File Size (bytes)",
      );
      expect(warnSpy).toHaveBeenCalledTimes(4);

      warnSpy.mockRestore();
    });
  });

  describe("slug and config passthrough", () => {
    it("sets the slug on the collection", () => {
      const collection = defineMediaCollection("images");
      expect(collection.slug).toBe("images");
    });

    it("passes through tableName", () => {
      const collection = defineMediaCollection("images", {
        tableName: "media_images",
      });
      expect(collection.config.tableName).toBe("media_images");
    });

    it("passes through labels", () => {
      const collection = defineMediaCollection("images", {
        labels: { singular: "Image", plural: "Images" },
      });
      expect(collection.config.labels).toEqual({
        singular: "Image",
        plural: "Images",
      });
    });
  });
});
```

---

## Step 6: VexConfig Integration

- [ ] Update `packages/core/src/config/defineConfig.ts` — handle `media` in config merging and validation
- [ ] Update `packages/core/src/valueTypes/slugs.ts` — add `mediaCollection` slug source
- [ ] Update `packages/core/src/valueTypes/slugs.test.ts` — add media slug collision tests
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/config/defineConfig.ts`** — Handle media config.

```typescript
import type { VexConfig, VexConfigInput } from "../types";
import { VexMediaConfigError } from "../errors";

// ... existing BASE_VEX_CONFIG unchanged ...

export function defineConfig(vexConfig: VexConfigInput): VexConfig {
  // TODO: implement (modification of existing function)
  //
  // 1. Keep existing config merging logic unchanged
  //
  // 2. After building the config object, handle media:
  //    a. If vexConfig.media is provided:
  //       → If vexConfig.media.collections.length === 0: set config.media = undefined
  //       → If vexConfig.media.collections.length > 0 and no storageAdapter:
  //         throw new VexMediaConfigError("media.storageAdapter is required when media.collections is non-empty")
  //       → Otherwise: set config.media = vexConfig.media
  //    b. If vexConfig.media is not provided: config.media = undefined
  //
  // 3. Existing duplicate slug check: extend to include media collection slugs
  //
  // Edge cases:
  // - media: undefined → no media field on config
  // - media: { collections: [], storageAdapter: ... } → treated as no media (undefined)
  // - media: { collections: [...], storageAdapter: undefined } → throw VexMediaConfigError
  throw new Error("Not implemented");
}
```

**`File: packages/core/src/valueTypes/slugs.ts`** — Add media collection slug source.

Add to `SLUG_SOURCES`:

```typescript
export const SLUG_SOURCES = {
  userCollection: "user-collection",
  userGlobal: "user-global",
  authTable: "auth-table",
  mediaCollection: "media-collection",
  system: "system",
} as const;
```

Update `buildSlugRegistry()` to register media slugs (after user collections, before globals):

```typescript
// Register media collection slugs
if (props.config.media) {
  for (const collection of props.config.media.collections) {
    registry.register({
      slug: collection.slug,
      source: SLUG_SOURCES.mediaCollection,
      location: `Media Collection ${collection.slug}`,
    });
  }
}
```

No changes needed to `SlugRegistry.register()` — media collection slugs should conflict with everything (no special overlap handling like auth↔user).

**`File: packages/core/src/valueTypes/slugs.test.ts`** — Add media slug tests.

```typescript
describe("media collection slugs", () => {
  it("registers media collection slugs", () => {
    const mediaImages = defineCollection("images", {
      fields: { storageId: text() },
    });

    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: {
        collections: [mediaImages],
        storageAdapter: {
          name: "test",
          storageIdValueType: "v.string()",
          getUploadUrl: async () => "",
          getUrl: async () => "",
          deleteFile: async () => {},
        },
      },
    });

    const registry = buildSlugRegistry({ config });
    const slugs = registry.getAll().map((r) => r.slug);
    expect(slugs).toContain("images");
  });

  it("throws when media collection slug conflicts with user collection slug", () => {
    const userImages = defineCollection("images", {
      fields: { title: text() },
    });
    const mediaImages = defineCollection("images", {
      fields: { storageId: text() },
    });

    const config = defineConfig({
      collections: [userImages, users],
      auth: minimalAuth,
      media: {
        collections: [mediaImages],
        storageAdapter: {
          name: "test",
          storageIdValueType: "v.string()",
          getUploadUrl: async () => "",
          getUrl: async () => "",
          deleteFile: async () => {},
        },
      },
    });

    expect(() => buildSlugRegistry({ config })).toThrow(VexSlugConflictError);
  });

  it("throws when media collection slug conflicts with auth table slug", () => {
    const mediaSession = defineCollection("session", {
      fields: { storageId: text() },
    });

    const authAdapter: VexAuthAdapter = {
      name: "better-auth",
      collections: [
        defineCollection("session", {
          fields: { token: text({ required: true, defaultValue: "" }) },
        }),
      ],
    };

    const config = defineConfig({
      collections: [users],
      auth: authAdapter,
      media: {
        collections: [mediaSession],
        storageAdapter: {
          name: "test",
          storageIdValueType: "v.string()",
          getUploadUrl: async () => "",
          getUrl: async () => "",
          deleteFile: async () => {},
        },
      },
    });

    expect(() => buildSlugRegistry({ config })).toThrow(VexSlugConflictError);
  });

  it("allows media collections when no conflicts exist", () => {
    const mediaImages = defineCollection("images", {
      fields: { storageId: text() },
    });
    const mediaDocuments = defineCollection("documents", {
      fields: { storageId: text() },
    });

    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: {
        collections: [mediaImages, mediaDocuments],
        storageAdapter: {
          name: "test",
          storageIdValueType: "v.string()",
          getUploadUrl: async () => "",
          getUrl: async () => "",
          deleteFile: async () => {},
        },
      },
    });

    expect(() => buildSlugRegistry({ config })).not.toThrow();
  });
});
```

---

## Step 7: Schema Generation

- [ ] Update `packages/core/src/valueTypes/extract.ts` — add `upload` case
- [ ] Update `packages/core/src/valueTypes/extract.test.ts` — add upload field tests
- [ ] Update `packages/core/src/valueTypes/generate.ts` — add media collection generation with adapter-driven storageId
- [ ] Update `packages/core/src/valueTypes/generate.test.ts` — add media collection tests
- [ ] Update `packages/core/src/formSchema/generateFormSchema.ts` — add upload case
- [ ] Update `packages/core/src/formSchema/generateFormSchema.test.ts` — add upload test
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/valueTypes/extract.ts`** — Add upload case.

Add import:

```typescript
import { uploadToValueTypeString } from "../fields/media";
```

Add case before `default`:

```typescript
    case "upload":
      return uploadToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
```

**`File: packages/core/src/valueTypes/extract.test.ts`** — Add upload field tests.

```typescript
import { upload } from "../fields/media";

// Add tests:
it("converts upload field to v.id()", () => {
  expect(
    fieldToValueType({
      field: upload({ to: "images", required: true }),
      collectionSlug: "posts",
      fieldName: "cover",
    }),
  ).toBe('v.id("images")');
});

it("converts optional upload field to v.optional(v.id())", () => {
  expect(
    fieldToValueType({
      field: upload({ to: "images" }),
      collectionSlug: "posts",
      fieldName: "cover",
    }),
  ).toBe('v.optional(v.id("images"))');
});

it("converts hasMany upload field to v.array(v.id())", () => {
  expect(
    fieldToValueType({
      field: upload({ to: "images", hasMany: true, required: true }),
      collectionSlug: "posts",
      fieldName: "gallery",
    }),
  ).toBe('v.array(v.id("images"))');
});
```

**`File: packages/core/src/valueTypes/generate.ts`** — Add media collection generation.

After the user collections loop and before unmerged auth collections, add:

```typescript
// --- MEDIA COLLECTIONS ---
if (config.media && config.media.collections.length > 0) {
  lines.push("", "/**", " * MEDIA COLLECTIONS", " **/");

  for (const mediaCollection of config.media.collections) {
    // TODO: implement
    //
    // 1. Iterate media collection fields, converting each via fieldToValueType()
    //    → EXCEPT for storageId: use config.media.storageAdapter.storageIdValueType instead
    //      of calling fieldToValueType (which would return v.string())
    //    → For storageId: the value type is config.media.storageAdapter.storageIdValueType
    //      (e.g., 'v.id("_storage")' for Convex, 'v.string()' for generic)
    //
    // 2. Collect indexes via collectIndexes({ collection: mediaCollection })
    //
    // 3. Collect search indexes via collectSearchIndexes({ collection: mediaCollection })
    //
    // 4. Generate defineTable() + chained .index() and .searchIndex() calls
    //    (same pattern as user collections)
    //
    // Edge cases:
    // - storageId field uses adapter's storageIdValueType, not fieldToValueType()
    // - All other fields (filename, mimeType, size, url, alt, width, height, custom)
    //   go through fieldToValueType() normally
  }
}
```

**`File: packages/core/src/valueTypes/generate.test.ts`** — Add media collection tests.

```typescript
import { upload } from "../fields/media";

const mockStorageAdapter = {
  name: "test",
  storageIdValueType: "v.string()",
  getUploadUrl: async () => "",
  getUrl: async () => "",
  deleteFile: async () => {},
};

const convexStorageAdapter = {
  name: "convex",
  storageIdValueType: 'v.id("_storage")',
  getUploadUrl: async () => "",
  getUrl: async () => "",
  deleteFile: async () => {},
};

describe("media collection generation", () => {
  it("generates media collections under MEDIA COLLECTIONS comment block", () => {
    const images = defineCollection("images", {
      fields: {
        storageId: text({ required: true, defaultValue: "" }),
        filename: text({ required: true, defaultValue: "" }),
        mimeType: text({ required: true, defaultValue: "" }),
        size: number({ required: true, defaultValue: 0 }),
        url: text({ required: true, defaultValue: "" }),
        alt: text(),
        width: number(),
        height: number(),
      },
    });

    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: { collections: [images], storageAdapter: mockStorageAdapter },
    });

    const output = generateVexSchema({ config });
    expect(output).toContain("MEDIA COLLECTIONS");
    expect(output).toContain("export const images = defineTable({");
    expect(output).toContain("storageId: v.string()");
  });

  it("uses adapter storageIdValueType for storageId field (Convex)", () => {
    const images = defineCollection("images", {
      fields: {
        storageId: text({ required: true, defaultValue: "" }),
        filename: text({ required: true, defaultValue: "" }),
        mimeType: text({ required: true, defaultValue: "" }),
        size: number({ required: true, defaultValue: 0 }),
        url: text({ required: true, defaultValue: "" }),
        alt: text(),
        width: number(),
        height: number(),
      },
    });

    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: { collections: [images], storageAdapter: convexStorageAdapter },
    });

    const output = generateVexSchema({ config });
    expect(output).toContain('storageId: v.id("_storage")');
    // Other fields should still use normal value types
    expect(output).toContain("filename: v.string()");
    expect(output).toContain("mimeType: v.string()");
  });

  it("generates by_mimeType index on media collections", () => {
    const images = defineCollection("images", {
      fields: {
        storageId: text({ required: true, defaultValue: "" }),
        mimeType: text({
          required: true,
          defaultValue: "",
          index: "by_mimeType",
        }),
        filename: text({ required: true, defaultValue: "" }),
        size: number({ required: true, defaultValue: 0 }),
        url: text({ required: true, defaultValue: "" }),
        alt: text(),
        width: number(),
        height: number(),
      },
    });

    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: { collections: [images], storageAdapter: mockStorageAdapter },
    });

    const output = generateVexSchema({ config });
    expect(output).toContain('.index("by_mimeType", ["mimeType"])');
  });

  it("does not generate MEDIA COLLECTIONS block when no media config", () => {
    const config = defineConfig({ collections: [users], auth: minimalAuth });
    const output = generateVexSchema({ config });
    expect(output).not.toContain("MEDIA COLLECTIONS");
  });

  it("generates upload() field references in user collections", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text(),
        cover: upload({ to: "images", required: true }),
        gallery: upload({ to: "images", hasMany: true }),
      },
    });

    const images = defineCollection("images", {
      fields: {
        storageId: text({ required: true, defaultValue: "" }),
        mimeType: text({ required: true, defaultValue: "" }),
        filename: text({ required: true, defaultValue: "" }),
        size: number({ required: true, defaultValue: 0 }),
        url: text({ required: true, defaultValue: "" }),
        alt: text(),
        width: number(),
        height: number(),
      },
    });

    const config = defineConfig({
      collections: [posts, users],
      auth: minimalAuth,
      media: { collections: [images], storageAdapter: mockStorageAdapter },
    });

    const output = generateVexSchema({ config });
    expect(output).toContain('cover: v.id("images")');
    expect(output).toContain('gallery: v.optional(v.array(v.id("images")))');
  });
});
```

**`File: packages/core/src/formSchema/generateFormSchema.ts`** — Add upload case.

After `relationship` case:

```typescript
    case "upload": {
      if (props.meta.hasMany) {
        return z.array(z.string());
      }
      return z.string();
    }
```

**`File: packages/core/src/formSchema/generateFormSchema.test.ts`** — Add upload test.

```typescript
import { upload } from "../fields/media";

it("generates z.string() for upload field", () => {
  const schema = generateFormSchema({
    fields: { cover: upload({ to: "images", required: true }) },
  });
  expect(schema.safeParse({ cover: "abc123" }).success).toBe(true);
});

it("generates z.array(z.string()) for hasMany upload field", () => {
  const schema = generateFormSchema({
    fields: {
      gallery: upload({ to: "images", hasMany: true, required: true }),
    },
  });
  expect(schema.safeParse({ gallery: ["abc123", "def456"] }).success).toBe(
    true,
  );
});
```

---

## Step 8: Convex File Storage Adapter

- [ ] Implement `packages/file-storage-convex/src/index.ts`
- [ ] Create `packages/file-storage-convex/src/index.test.ts`
- [ ] Run `pnpm --filter @vexcms/file-storage-convex build && pnpm --filter @vexcms/file-storage-convex test`

**`File: packages/file-storage-convex/src/index.ts`**

````typescript
import type { FileStorageAdapter } from "@vexcms/core";

export interface ConvexFileStorageOptions {
  convexUrl?: string;
}

/**
 * Create a Convex file storage adapter.
 *
 * Uses Convex's built-in file storage system. Sets `storageIdValueType` to
 * `v.id("_storage")` so media collection schemas use Convex's typed storage reference.
 *
 * @example
 * ```ts
 * defineConfig({
 *   media: {
 *     collections: [images],
 *     storageAdapter: convexFileStorage(),
 *   },
 * });
 * ```
 */
export function convexFileStorage(
  props?: ConvexFileStorageOptions,
): FileStorageAdapter {
  // TODO: implement
  //
  // 1. Return a FileStorageAdapter:
  //    {
  //      name: "convex",
  //      storageIdValueType: 'v.id("_storage")',
  //      getUploadUrl: async () => { ... },
  //      getUrl: async (props) => { ... },
  //      deleteFile: async (props) => { ... },
  //    }
  //
  // 2. For now, the methods throw descriptive errors indicating they need
  //    to be wired to Convex runtime functions by the admin panel:
  //    → getUploadUrl: throw new Error("convexFileStorage.getUploadUrl() requires a Convex client. Wire via admin panel runtime.")
  //    → getUrl: same pattern
  //    → deleteFile: same pattern
  //
  // 3. Store props?.convexUrl for future use
  //
  // Edge cases:
  // - props undefined: use defaults
  // - props.convexUrl undefined: will use CONVEX_URL env var at runtime
  throw new Error("Not implemented");
}
````

**`File: packages/file-storage-convex/src/index.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { convexFileStorage } from "./index";

describe("convexFileStorage", () => {
  it("returns adapter with name 'convex'", () => {
    const adapter = convexFileStorage();
    expect(adapter.name).toBe("convex");
  });

  it('sets storageIdValueType to v.id("_storage")', () => {
    const adapter = convexFileStorage();
    expect(adapter.storageIdValueType).toBe('v.id("_storage")');
  });

  it("returns adapter with all required methods", () => {
    const adapter = convexFileStorage();
    expect(typeof adapter.getUploadUrl).toBe("function");
    expect(typeof adapter.getUrl).toBe("function");
    expect(typeof adapter.deleteFile).toBe("function");
  });

  it("accepts optional convexUrl", () => {
    const adapter = convexFileStorage({
      convexUrl: "https://my-deployment.convex.cloud",
    });
    expect(adapter.name).toBe("convex");
  });

  it("getUploadUrl throws descriptive error (not yet wired)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.getUploadUrl()).rejects.toThrow("Convex client");
  });

  it("getUrl throws descriptive error (not yet wired)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.getUrl({ storageId: "test-id" })).rejects.toThrow(
      "Convex client",
    );
  });

  it("deleteFile throws descriptive error (not yet wired)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.deleteFile({ storageId: "test-id" })).rejects.toThrow(
      "Convex client",
    );
  });
});
```

---

## Step 9: Convex Functions for Media Operations

- [ ] Add `generateUploadUrl` mutation to `apps/test-app/convex/vex/collections.ts`
- [ ] Add `createMediaDocument` mutation to `apps/test-app/convex/vex/collections.ts`
- [ ] Add `paginatedSearchDocuments` query to `apps/test-app/convex/vex/collections.ts`
- [ ] Add model implementations to `apps/test-app/convex/vex/model/collections.ts`
- [ ] Verify Convex deployment works

**`File: apps/test-app/convex/vex/collections.ts`** — Add new endpoints.

Append to existing file:

```typescript
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const createMediaDocument = mutation({
  args: {
    collectionSlug: v.string(),
    fields: v.any(),
  },
  handler: async (ctx, { collectionSlug, fields }) => {
    return await Collections.createMediaDocument<DataModel>({
      ctx,
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        fields: fields as Record<string, unknown>,
      },
    });
  },
});

export const paginatedSearchDocuments = query({
  args: {
    collectionSlug: v.string(),
    searchIndexName: v.string(),
    searchField: v.string(),
    query: v.string(),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (
    ctx,
    {
      collectionSlug,
      searchIndexName,
      searchField,
      query: searchQuery,
      paginationOpts,
    },
  ) => {
    return await Collections.paginatedSearchDocuments<DataModel>({
      args: {
        collectionSlug: collectionSlug as TableNamesInDataModel<DataModel>,
        searchIndexName,
        searchField,
        query: searchQuery,
        paginationOpts,
      },
      ctx,
    });
  },
});
```

**`File: apps/test-app/convex/vex/model/collections.ts`** — Add model functions.

Append to existing file:

```typescript
export async function createMediaDocument<
  DataModel extends GenericDataModel,
>(props: {
  ctx: GenericMutationCtx<DataModel>;
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>;
    fields: Record<string, unknown>;
  };
}): Promise<string> {
  // TODO: implement
  //
  // 1. Insert document into the media collection table:
  //    const id = await props.ctx.db.insert(props.args.collectionSlug as any, props.args.fields as any)
  //
  // 2. Return the document ID as string
  //
  // Edge cases:
  // - fields should include storageId, filename, mimeType, size, url, and any user fields
  // - Convex validates against the schema at insert time
  throw new Error("Not implemented");
}

export async function paginatedSearchDocuments<
  DataModel extends GenericDataModel,
>(props: {
  args: {
    collectionSlug: TableNamesInDataModel<DataModel>;
    searchIndexName: string;
    searchField: string;
    query: string;
    paginationOpts: PaginationOptions;
  };
  ctx: GenericQueryCtx<DataModel>;
}) {
  // TODO: implement
  //
  // 1. If props.args.query is empty string, return regular paginated list:
  //    → ctx.db.query(collectionSlug).paginate(paginationOpts)
  //
  // 2. If query is non-empty, use search index with pagination:
  //    → ctx.db.query(collectionSlug)
  //        .withSearchIndex(searchIndexName, (q) => q.search(searchField, query))
  //        .paginate(paginationOpts)
  //
  // Edge cases:
  // - Empty query: fall back to regular pagination (search requires non-empty string)
  // - Search results are ordered by relevance, not insertion order
  throw new Error("Not implemented");
}
```

---

## Step 10: Media Picker Component

- [ ] Create `packages/ui/src/components/ui/media-picker.tsx`
- [ ] Update `packages/ui/src/components/ui/index.tsx` to export it
- [ ] Create `packages/admin-next/src/hooks/useMediaPicker.ts`

**`File: packages/admin-next/src/hooks/useMediaPicker.ts`**

Hook that manages the paginated search and selection state for the media picker popover.

```typescript
"use client";

import { useState, useEffect, useCallback } from "react";
import { useConvexPaginatedQuery } from "@convex-dev/react-query";
import { anyApi } from "convex/server";

/**
 * Hook for managing media picker state: search, paginated results, selection.
 *
 * @param props.collectionSlug - The media collection to search
 * @param props.searchField - The field to search on (e.g., "filename")
 * @param props.searchIndexName - The search index name (e.g., "search_filename")
 * @param props.enabled - Whether the picker is open (controls query activation)
 */
export function useMediaPicker(props: {
  collectionSlug: string;
  searchField: string;
  searchIndexName: string;
  enabled: boolean;
}) {
  // TODO: implement
  //
  // 1. State:
  //    - searchTerm: string (controlled by search input)
  //    - debouncedSearch: string (300ms debounce)
  //
  // 2. Use usePaginatedQuery via paginatedSearchDocuments query:
  //    → When debouncedSearch is empty: fetches all media docs (regular pagination)
  //    → When debouncedSearch is non-empty: searches via search index
  //    → Pass props.enabled to control whether query is active
  //    → initialNumItems: 20
  //
  // 3. Return:
  //    {
  //      searchTerm,
  //      setSearchTerm,
  //      results: Record<string, unknown>[],
  //      status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted",
  //      loadMore: (numItems: number) => void,
  //      isLoading: boolean,
  //    }
  //
  // 4. Debounce effect: useEffect with setTimeout(300ms)
  //
  // Edge cases:
  // - enabled=false: query should not run (skip parameter)
  // - Search term cleared: revert to regular pagination
  // - LoadMore triggers: infinite scroll calls loadMore(20) when near bottom
  throw new Error("Not implemented");
}
```

**`File: packages/ui/src/components/ui/media-picker.tsx`**

Popover component with search bar, thumbnail grid, and infinite scroll.

```tsx
"use client";

import * as React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Input } from "./input";
import { Button } from "./button";
import { ImageIcon, FileIcon, Search, Plus } from "lucide-react";

interface MediaDocument {
  _id: string;
  filename: string;
  mimeType: string;
  url: string;
  alt?: string;
}

interface MediaPickerProps {
  /** Currently selected media document ID(s) */
  value: string | string[] | null;
  /** Called when selection changes */
  onSelect: (id: string) => void;
  /** Search results from useMediaPicker hook */
  results: MediaDocument[];
  /** Search term state */
  searchTerm: string;
  /** Search term setter */
  onSearchChange: (term: string) => void;
  /** Whether more results can be loaded */
  canLoadMore: boolean;
  /** Load more results */
  onLoadMore: () => void;
  /** Whether results are loading */
  isLoading: boolean;
  /** Placeholder text for search input */
  searchPlaceholder?: string;
  /** Called when "Upload new" button is clicked */
  onUploadNew: () => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Display label for the selected media (filename) */
  selectedLabel?: string;
}

/**
 * Media picker popover with search, image thumbnails, and infinite scroll.
 *
 * Layout:
 * ┌─────────────────────────────────┐
 * │ [🔍 Search media...          ]  │
 * ├─────────────────────────────────┤
 * │ ┌──────┐ ┌──────┐ ┌──────┐     │
 * │ │ img  │ │ img  │ │ img  │     │
 * │ │      │ │      │ │      │     │
 * │ └──────┘ └──────┘ └──────┘     │
 * │ filename  filename  filename    │
 * │                                 │
 * │ ... (infinite scroll) ...       │
 * ├─────────────────────────────────┤
 * │ [+ Upload new]                  │
 * └─────────────────────────────────┘
 */
function MediaPicker(props: MediaPickerProps) {
  // TODO: implement
  //
  // 1. Render a Popover with:
  //    - PopoverTrigger: Button showing selected filename or "Select media..."
  //    - PopoverContent (w-80, max-h-96):
  //
  // 2. Inside PopoverContent:
  //    a. Search input at top:
  //       → <Input> with Search icon, value=props.searchTerm, onChange=props.onSearchChange
  //       → Placeholder: props.searchPlaceholder ?? "Search media..."
  //
  //    b. Scrollable results area (max-h-60 overflow-y-auto):
  //       → Grid of media items (grid-cols-3 gap-2)
  //       → Each item: clickable div with:
  //         - If mimeType starts with "image/": <img src={url} className="w-full h-16 object-cover rounded" />
  //         - Else: <FileIcon className="w-8 h-8 text-muted-foreground" />
  //         - <p className="text-xs truncate">{filename}</p>
  //       → onClick: props.onSelect(doc._id) + close popover
  //       → Highlight if doc._id matches props.value
  //
  //    c. Infinite scroll trigger:
  //       → useRef for scroll container
  //       → onScroll handler: if scrollTop + clientHeight >= scrollHeight - 50, call props.onLoadMore()
  //       → Show "Loading..." text when isLoading
  //
  //    d. "Upload new" button at bottom:
  //       → <Button variant="outline" size="sm" onClick={props.onUploadNew}>
  //       → <Plus /> Upload new
  //
  // 3. Loading state: show skeleton grid while isLoading && results.length === 0
  //
  // Edge cases:
  // - No results: show "No media found" message
  // - disabled=true: PopoverTrigger is disabled
  // - Value is null: show placeholder text in trigger
  throw new Error("Not implemented");
}

export { MediaPicker, type MediaPickerProps, type MediaDocument };
```

---

## Step 11: Upload Dropzone Component

- [ ] Create `packages/ui/src/components/ui/upload-dropzone.tsx`
- [ ] Update `packages/ui/src/components/ui/index.tsx` to export it

**`File: packages/ui/src/components/ui/upload-dropzone.tsx`**

Drag-and-drop file input with accept/maxSize validation.

```tsx
"use client";

import * as React from "react";
import { Upload, X, FileIcon, ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "./button";

interface UploadDropzoneProps {
  /** Accepted MIME types (e.g., ["image/*", "application/pdf"]) */
  accept?: string[];
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Called when a valid file is selected */
  onFileSelect: (file: File) => void;
  /** Currently selected file (for display) */
  selectedFile?: File | null;
  /** Clear the selected file */
  onClear: () => void;
  /** Whether the dropzone is disabled */
  disabled?: boolean;
}

/**
 * Drag-and-drop file upload zone with validation.
 *
 * Layout:
 * ┌─────────────────────────────────────────┐
 * │                                         │
 * │           ⬆ Upload icon                 │
 * │    Drag and drop or click to browse     │
 * │    Accepts: image/*, max 5 MB           │
 * │                                         │
 * └─────────────────────────────────────────┘
 *
 * After selection:
 * ┌─────────────────────────────────────────┐
 * │ [img preview]  filename.jpg  2.4 MB [✕] │
 * └─────────────────────────────────────────┘
 */
function UploadDropzone(props: UploadDropzoneProps) {
  // TODO: implement
  //
  // 1. State:
  //    - isDragging: boolean (drag-over visual feedback)
  //    - error: string | null (validation error message)
  //
  // 2. Hidden file input:
  //    → <input type="file" ref={fileInputRef} className="hidden"
  //        accept={props.accept?.join(",")} onChange={handleFileInput} />
  //
  // 3. Drop zone div:
  //    → onDragOver: preventDefault, setIsDragging(true)
  //    → onDragLeave: setIsDragging(false)
  //    → onDrop: preventDefault, setIsDragging(false), validate + handleFile
  //    → onClick: fileInputRef.current?.click()
  //    → Styling: border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
  //      isDragging: border-primary bg-primary/5
  //      default: border-muted-foreground/25 hover:border-muted-foreground/50
  //
  // 4. Validation function validateFile(file: File): string | null
  //    a. Check accept: if props.accept is set, verify file.type matches
  //       → For wildcards like "image/*": check file.type.startsWith("image/")
  //       → For exact types: check file.type === acceptType
  //       → Return error string if no match: "File type {file.type} is not accepted"
  //    b. Check maxSize: if props.maxSize and file.size > props.maxSize
  //       → Return: "File size ({formatted}) exceeds maximum ({formatted})"
  //    c. Return null if valid
  //
  // 5. handleFile(file: File):
  //    → const err = validateFile(file)
  //    → if (err) { setError(err); return }
  //    → setError(null)
  //    → props.onFileSelect(file)
  //
  // 6. When props.selectedFile is set, show selected file preview:
  //    → If image: <img src={URL.createObjectURL(file)} className="h-12 w-12 rounded object-cover" />
  //    → Else: <FileIcon />
  //    → filename + formatted size
  //    → Clear button (X icon): props.onClear()
  //
  // 7. Error display: <p className="text-sm text-destructive flex items-center gap-1">
  //    <AlertCircle size={14} /> {error}
  //
  // 8. Accept/maxSize hint text below dropzone:
  //    → "Accepts: {accept.join(', ')}" if set
  //    → "Max size: {formatted}" if maxSize set
  //
  // Edge cases:
  // - Drag multiple files: only process first file (dataTransfer.files[0])
  // - File with no type (file.type is ""): fails accept check unless accept is not set
  // - disabled=true: no click handler, no drag handlers, muted styling
  // - Clear objectURL on unmount/file change to avoid memory leaks
  throw new Error("Not implemented");
}

export { UploadDropzone, type UploadDropzoneProps };
```

---

## Step 12: Create Media Modal

- [ ] Create `packages/ui/src/components/ui/create-media-modal.tsx`
- [ ] Update `packages/ui/src/components/ui/index.tsx` to export it
- [ ] Update `packages/admin-next/src/views/CollectionEditView.tsx` to render the modal

**`File: packages/ui/src/components/ui/create-media-modal.tsx`**

Modal overlay driven by nuqs URL param for creating new media documents.

```tsx
"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { UploadDropzone } from "./upload-dropzone";

interface CreateMediaModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Close the modal */
  onClose: () => void;
  /** The media collection slug being uploaded to */
  collectionSlug: string;
  /** Display label for the collection (e.g., "Images") */
  collectionLabel?: string;
  /** Accepted MIME types from the upload field config */
  accept?: string[];
  /** Max file size from the upload field config */
  maxSize?: number;
  /**
   * Called when upload is complete with the new media document ID.
   * The parent component links this ID into the upload field.
   */
  onUploadComplete: (documentId: string) => void;
  /** Function to generate an upload URL from the storage adapter */
  generateUploadUrl: () => Promise<string>;
  /** Function to create the media document with metadata */
  createMediaDocument: (props: {
    collectionSlug: string;
    fields: Record<string, unknown>;
  }) => Promise<string>;
}

/**
 * Modal overlay for uploading a new media file and creating a media document.
 *
 * Flow:
 * 1. User selects/drops a file in the UploadDropzone
 * 2. User enters alt text and optionally a display name
 * 3. User clicks "Upload"
 * 4. Modal: gets upload URL → uploads file → creates media document with metadata
 * 5. Modal closes, onUploadComplete(newDocId) is called
 *
 * Layout:
 * ┌────────────────────────────────────┐
 * │ Upload to {collectionLabel}     ✕  │
 * ├────────────────────────────────────┤
 * │                                    │
 * │  ┌──────────────────────────────┐  │
 * │  │      Upload Dropzone         │  │
 * │  └──────────────────────────────┘  │
 * │                                    │
 * │  Name: [________________________]  │
 * │  Alt Text: [____________________]  │
 * │                                    │
 * │              [Cancel] [Upload]     │
 * └────────────────────────────────────┘
 */
function CreateMediaModal(props: CreateMediaModalProps) {
  // TODO: implement
  //
  // 1. State:
  //    - selectedFile: File | null
  //    - altText: string
  //    - displayName: string (defaults to file name without extension)
  //    - isUploading: boolean
  //    - error: string | null
  //
  // 2. Render Dialog (from base-ui or shadcn):
  //    → open={props.open}
  //    → onOpenChange: if closing, call props.onClose
  //
  // 3. Dialog content:
  //    a. UploadDropzone:
  //       → accept={props.accept}, maxSize={props.maxSize}
  //       → onFileSelect: setSelectedFile, auto-populate displayName from file.name
  //       → selectedFile={selectedFile}
  //       → onClear: reset selectedFile and displayName
  //
  //    b. Name input:
  //       → Label "Name", value={displayName}, onChange
  //       → Auto-populated from filename (without extension) on file select
  //
  //    c. Alt text input:
  //       → Label "Alt Text", value={altText}, onChange
  //       → Placeholder: "Describe this file for accessibility"
  //
  //    d. Action buttons:
  //       → Cancel: props.onClose
  //       → Upload: disabled if !selectedFile || isUploading
  //         onClick: handleUpload()
  //
  // 4. handleUpload():
  //    a. setIsUploading(true), setError(null)
  //    b. Get upload URL: const uploadUrl = await props.generateUploadUrl()
  //    c. Upload file via fetch:
  //       → const response = await fetch(uploadUrl, {
  //           method: "POST",
  //           headers: { "Content-Type": selectedFile.type },
  //           body: selectedFile,
  //         })
  //       → const { storageId } = await response.json()
  //    d. Create media document:
  //       → const docId = await props.createMediaDocument({
  //           collectionSlug: props.collectionSlug,
  //           fields: {
  //             storageId,
  //             filename: displayName || selectedFile.name,
  //             mimeType: selectedFile.type,
  //             size: selectedFile.size,
  //             url: "", // Will be resolved from storageId at query time
  //             alt: altText,
  //             width: imageWidth, // Extracted if image
  //             height: imageHeight, // Extracted if image
  //           },
  //         })
  //    e. props.onUploadComplete(docId)
  //    f. props.onClose()
  //    g. setIsUploading(false)
  //
  // 5. Image dimension extraction:
  //    → If selectedFile.type.startsWith("image/"):
  //      const img = new Image()
  //      img.src = URL.createObjectURL(selectedFile)
  //      await img.decode()
  //      width = img.naturalWidth, height = img.naturalHeight
  //    → For non-images: width=undefined, height=undefined
  //
  // 6. Error handling:
  //    → Wrap handleUpload in try/catch
  //    → On error: setError(err.message), setIsUploading(false)
  //    → Display error below form
  //
  // Edge cases:
  // - Upload fails: show error, don't close modal, allow retry
  // - User closes modal during upload: abort? (for now, let it complete)
  // - File with no type: still upload, mimeType will be ""
  // - displayName empty: fall back to selectedFile.name
  // - Non-image file: skip width/height, no preview in dropzone
  throw new Error("Not implemented");
}

export { CreateMediaModal, type CreateMediaModalProps };
```

Note: This component requires a `Dialog` UI primitive. If one doesn't exist yet in the UI package, create `packages/ui/src/components/ui/dialog.tsx` using the base-ui `Dialog` primitive (same pattern as other primitives in the project).

**`File: packages/admin-next/src/views/CollectionEditView.tsx`** — Add modal integration.

The modal is triggered by a `newMedia` URL param via nuqs. The UploadField component sets this param when "Upload new" is clicked.

```typescript
// Add to CollectionEditView:
import { useQueryState } from "nuqs";
import { CreateMediaModal } from "@vexcms/ui";
import { useMutation } from "convex/react";
import { anyApi } from "convex/server";

// Inside the component:
const [newMediaSlug, setNewMediaSlug] = useQueryState("newMedia");
const generateUploadUrl = useMutation(anyApi.vex.collections.generateUploadUrl);
const createMediaDocument = useMutation(anyApi.vex.collections.createMediaDocument);

// State to capture which upload field triggered the modal
const [pendingUploadFieldName, setPendingUploadFieldName] = useState<string | null>(null);

// Callback passed down to UploadField via AppForm
const handleOpenUploadModal = (fieldName: string, collectionSlug: string) => {
  setPendingUploadFieldName(fieldName);
  setNewMediaSlug(collectionSlug);
};

const handleUploadComplete = (documentId: string) => {
  // TODO: implement
  //
  // 1. Set the upload field's value to the new document ID
  //    → Need to update the form field value for pendingUploadFieldName
  //    → The form instance from AppForm needs to be accessible here
  //    → Consider lifting the form ref or using a callback pattern
  //
  // 2. Clear modal state:
  //    setNewMediaSlug(null);
  //    setPendingUploadFieldName(null);
};

// Render the modal (find the upload field meta for accept/maxSize):
// → Look up the collection config to find the media collection by newMediaSlug
// → Pass accept/maxSize from the upload field's meta

// Add to JSX:
{newMediaSlug && (
  <CreateMediaModal
    open={!!newMediaSlug}
    onClose={() => setNewMediaSlug(null)}
    collectionSlug={newMediaSlug}
    collectionLabel={/* resolve from config */}
    accept={/* from upload field meta */}
    maxSize={/* from upload field meta */}
    onUploadComplete={handleUploadComplete}
    generateUploadUrl={async () => await generateUploadUrl()}
    createMediaDocument={async (props) => await createMediaDocument(props)}
  />
)}
```

---

## Step 13: UploadField Form Component

- [ ] Create `packages/ui/src/components/form/fields/UploadField.tsx`
- [ ] Update `packages/ui/src/components/form/fields/index.ts` to export it
- [ ] Update `packages/ui/src/components/form/AppForm.tsx` to add upload case

**`File: packages/ui/src/components/form/fields/UploadField.tsx`**

The form field component that renders the media picker and upload button.

```tsx
"use client";

import * as React from "react";
import type { UploadFieldMeta } from "@vexcms/core";
import { toTitleCase } from "@vexcms/core";
import { Label } from "../../ui/label";
import { MediaPicker, type MediaDocument } from "../../ui/media-picker";

interface UploadFieldProps {
  field: any;
  meta: UploadFieldMeta;
  name: string;
  /** Paginated media documents from useMediaPicker */
  mediaResults: MediaDocument[];
  /** Search term for the media picker */
  searchTerm: string;
  /** Search term setter */
  onSearchChange: (term: string) => void;
  /** Whether more results can be loaded */
  canLoadMore: boolean;
  /** Load more results */
  onLoadMore: () => void;
  /** Whether results are loading */
  isLoading: boolean;
  /** Called to open the upload modal */
  onUploadNew: () => void;
  /** The currently selected media document (for display) */
  selectedMedia?: MediaDocument | null;
}

/**
 * Upload field form component.
 *
 * Renders:
 * 1. Label with required indicator
 * 2. MediaPicker popover (select existing media)
 * 3. Current selection display (thumbnail + filename)
 * 4. Error display
 *
 * The "Upload new" action is delegated to the parent via onUploadNew,
 * which opens the CreateMediaModal.
 */
function UploadField(props: UploadFieldProps) {
  // TODO: implement
  //
  // 1. Extract label, description, errors from field/meta (same pattern as other fields)
  //
  // 2. Render:
  //    <div className="space-y-2">
  //      <Label>{label}{required && *}</Label>
  //
  //      <MediaPicker
  //        value={field.state.value}
  //        onSelect={(id) => field.handleChange(id)}
  //        results={props.mediaResults}
  //        searchTerm={props.searchTerm}
  //        onSearchChange={props.onSearchChange}
  //        canLoadMore={props.canLoadMore}
  //        onLoadMore={props.onLoadMore}
  //        isLoading={props.isLoading}
  //        onUploadNew={props.onUploadNew}
  //        disabled={meta.admin?.readOnly}
  //        selectedLabel={props.selectedMedia?.filename}
  //      />
  //
  //      {/* Show selected media preview */}
  //      {props.selectedMedia && (
  //        <div className="flex items-center gap-2 text-sm">
  //          {props.selectedMedia.mimeType.startsWith("image/") && (
  //            <img src={props.selectedMedia.url} className="h-10 w-10 rounded object-cover" />
  //          )}
  //          <span className="text-muted-foreground">{props.selectedMedia.filename}</span>
  //        </div>
  //      )}
  //
  //      {description && <p className="text-xs text-muted-foreground">{description}</p>}
  //      {errors...}
  //    </div>
  //
  // Edge cases:
  // - hasMany: would need MultiMediaPicker (out of scope for now, handle single only)
  // - No selected media: show placeholder in picker trigger
  // - readOnly: picker is disabled, just show current selection
  throw new Error("Not implemented");
}

export { UploadField };
```

**`File: packages/ui/src/components/form/fields/index.ts`** — Add export.

```typescript
export { TextField } from "./TextField";
export { NumberField } from "./NumberField";
export { CheckboxFieldForm } from "./CheckboxField";
export { SelectField } from "./SelectField";
export { MultiSelectField } from "./MultiSelectField";
export { DateField } from "./DateField";
export { ImageUrlField } from "./ImageUrlField";
export { UploadField } from "./UploadField";
```

**`File: packages/ui/src/components/form/AppForm.tsx`** — Add upload case.

Add import:

```typescript
import { UploadField } from "./fields";
```

Add case in the switch (before `default`):

```typescript
case "upload":
  return (
    <UploadField
      field={field}
      meta={meta}
      name={entry.name}
      mediaResults={/* from useMediaPicker hook */}
      searchTerm={/* from useMediaPicker hook */}
      onSearchChange={/* from useMediaPicker hook */}
      canLoadMore={/* from useMediaPicker hook */}
      onLoadMore={/* from useMediaPicker hook */}
      isLoading={/* from useMediaPicker hook */}
      onUploadNew={/* triggers modal via parent callback */}
      selectedMedia={/* fetched by document ID */}
    />
  );
```

**Important implementation note:** The AppForm currently doesn't have access to Convex queries (it's a pure UI component in `@vexcms/ui`). The `useMediaPicker` hook lives in `@vexcms/admin-next` because it depends on Convex. There are two approaches:

**Approach A — Lift state to CollectionEditView:** The edit view manages `useMediaPicker` state for each upload field and passes it down through AppForm via a context or props. This keeps AppForm as a pure UI component.

**Approach B — Render prop / slot:** AppForm accepts a `renderField` callback that the edit view provides, allowing the edit view to render upload fields with full Convex access.

The recommended approach is **A** — pass a `mediaPickerContext` prop to AppForm that provides the hooks/callbacks needed by UploadField. The edit view initializes `useMediaPicker` for each upload field found in the collection config.

```typescript
// In CollectionEditView, before rendering AppForm:
interface MediaPickerState {
  results: MediaDocument[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  canLoadMore: boolean;
  loadMore: () => void;
  isLoading: boolean;
  selectedMedia: MediaDocument | null;
}

// Create a map of fieldName → MediaPickerState for each upload field
const uploadFieldStates = useMemo(() => {
  const states: Record<string, MediaPickerState> = {};
  for (const entry of fieldEntries) {
    if (entry.field._meta.type === "upload") {
      // Initialize useMediaPicker for this field
      // ... hook management here
    }
  }
  return states;
}, [fieldEntries]);

// Pass to AppForm:
<AppForm
  {...otherProps}
  uploadFieldStates={uploadFieldStates}
  onOpenUploadModal={handleOpenUploadModal}
/>
```

---

## Step 14: Core Exports + Test App Example

- [ ] Update `packages/core/src/index.ts` — add all new exports
- [ ] Update `packages/ui/src/components/ui/index.tsx` — add new UI component exports
- [ ] Create example config in test app
- [ ] Run `pnpm --filter @vexcms/core build`
- [ ] Run `pnpm --filter @vexcms/core test`
- [ ] Run `pnpm --filter @vexcms/file-storage-convex build && test`
- [ ] Run `pnpm --filter @vexcms/ui build`

**`File: packages/core/src/index.ts`** — Add new exports.

Fields section:

```typescript
export { upload } from "./fields/media";
```

Config section:

```typescript
export { defineMediaCollection } from "./config/defineMediaCollection";
```

Type exports:

```typescript
export type { UploadFieldMeta, UploadFieldOptions } from "./types";

export type {
  FileStorageAdapter,
  MediaCollectionConfig,
  MediaConfig,
  MediaConfigInput,
  LockedMediaField,
  OverridableMediaField,
} from "./types";

export { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "./types/media";
```

**`File: packages/ui/src/components/ui/index.tsx`** — Add new exports.

```typescript
export * from "./media-picker";
export * from "./upload-dropzone";
export * from "./create-media-modal";
```

**Test app example config:**

```typescript
import {
  defineConfig,
  defineMediaCollection,
  text,
  upload,
} from "@vexcms/core";
import { convexFileStorage } from "@vexcms/file-storage-convex";

const images = defineMediaCollection("images", {
  labels: { singular: "Image", plural: "Images" },
  fields: {
    alt: text({
      label: "Alt Text",
      required: true,
      defaultValue: "",
      maxLength: 200,
    }),
    caption: text({ label: "Caption" }),
  },
  admin: { group: "Media" },
});

// In posts collection:
// cover: upload({ to: "images", required: true, accept: ["image/*"], maxSize: 5 * 1024 * 1024 }),
// gallery: upload({ to: "images", hasMany: true, accept: ["image/*"] }),

// In users collection:
// profileImage: upload({ to: "images", accept: ["image/*"], maxSize: 2 * 1024 * 1024 }),

export default defineConfig({
  // ... existing config ...
  media: {
    collections: [images],
    storageAdapter: convexFileStorage(),
  },
});
```

---

## Success Criteria

### Refactor & Core Types

- [ ] `processFieldValueTypeOptions` supports `skipDefaultValidation` flag
- [ ] `relationship` schemaValueType uses `processFieldValueTypeOptions` (no inline optional wrapping)
- [ ] `json` schemaValueType uses `processFieldValueTypeOptions` (no inline optional wrapping)
- [ ] `upload` schemaValueType uses `processFieldValueTypeOptions` (no inline optional wrapping)
- [ ] No field schemaValueType function implements its own required/optional wrapping logic
- [ ] `@vexcms/core` builds without errors
- [ ] `@vexcms/file-storage-convex` builds without errors
- [ ] All existing tests pass (no regressions)
- [ ] `upload()` field generates correct `v.id()` schema (single, hasMany, required, optional)
- [ ] `defineMediaCollection()` auto-injects all 8 default fields
- [ ] `defineMediaCollection()` prevents overriding locked fields (storageId, filename, mimeType, size)
- [ ] `defineMediaCollection()` allows overriding overridable fields (alt, url, width, height)
- [ ] `defineMediaCollection()` allows adding custom fields
- [ ] `defineMediaCollection()` defaults `useAsTitle` to `"filename"`
- [ ] Schema generation outputs media collections under `MEDIA COLLECTIONS` comment block
- [ ] Schema generation uses `storageAdapter.storageIdValueType` for storageId column
- [ ] Convex adapter sets storageId to `v.id("_storage")`; generic adapters use `v.string()`
- [ ] Schema generation includes `by_mimeType` index on media collections
- [ ] `VexConfig.media` accepts `collections` + `storageAdapter`
- [ ] Slug registry prevents media collection slug conflicts
- [ ] `defineConfig()` validates: non-empty media.collections requires storageAdapter
- [ ] `defineConfig()` treats empty media.collections as no media
- [ ] `convexFileStorage()` returns a valid `FileStorageAdapter` with `storageIdValueType: 'v.id("_storage")'`
- [ ] `fieldMetaToZod()` handles upload fields

### Admin UI

- [ ] `UploadField` component renders in the collection edit form
- [ ] MediaPicker popover opens with search bar and results grid
- [ ] Search uses the search index on `useAsTitle` field (filename by default)
- [ ] Infinite scroll loads more results via `usePaginatedQuery`
- [ ] Image thumbnails render for `image/*` mimeTypes, file icons for others
- [ ] "Upload new" button opens the CreateMediaModal
- [ ] CreateMediaModal is driven by `newMedia` URL param via nuqs
- [ ] UploadDropzone supports drag-and-drop and click-to-browse
- [ ] UploadDropzone validates `accept` MIME types (including wildcards)
- [ ] UploadDropzone validates `maxSize` and shows error if exceeded
- [ ] Upload flow: generateUploadUrl → POST file → createMediaDocument → close modal → link ID
- [ ] Image dimensions (width/height) are auto-extracted for image files
- [ ] Alt text and display name are captured in the modal form
- [ ] After upload, the new media document ID is linked in the upload field
- [ ] `@vexcms/ui` builds without errors
- [ ] Convex functions: `generateUploadUrl`, `createMediaDocument`, `paginatedSearchDocuments` work
