# 15 — Media Collections & File Storage Adapter

## Overview

Adds media collection support to Vex CMS: a `media` config field on `VexConfig` containing `collections` (media-specific collections with auto-injected file metadata fields) and `storageAdapter` (a pluggable file storage interface). Includes a new `media()` field type for referencing media documents from regular collections, a `defineMediaCollection()` builder, and a `@vexcms/file-storage-convex` package as the first storage adapter implementation. Schema generation is extended to output media collections under a `MEDIA COLLECTIONS` comment block.

## Design Decisions

- **`defineMediaCollection()` builder**: Media collections use a dedicated builder that auto-injects default fields (storageId, filename, mimeType, size, url, alt, width, height) and a `by_mimeType` index. Users can override some defaults (alt, width, height, url) but not system fields (storageId, filename, mimeType, size).
- **`media()` as a new field type**: Has its own folder in `packages/core/src/fields/media/`, own meta type, and own schema value type function. Internally delegates to the same `v.id()` pattern as `relationship()` for Convex schema generation.
- **Config shape**: `media` is an object with `collections` and `storageAdapter` fields, not two top-level fields.
- **All file types accepted**: Media collections are not limited to images/videos. The `by_mimeType` index enables filtering by file type at query time.
- **Locked fields**: `storageId`, `filename`, `mimeType`, and `size` cannot be overridden by user config. Attempting to do so logs a dev warning and the user's override is silently dropped.
- **Separate package for Convex adapter**: `@vexcms/file-storage-convex` follows the same pattern as `@vexcms/better-auth` — peer dependency on `@vexcms/core` and `convex`.

## Out of Scope

- Admin UI for file uploads (upload component, drag-and-drop, gallery picker)
- Admin UI rendering of media fields (thumbnail previews in forms/tables)
- Image transformation/optimization (resize, crop, CDN)
- Media library browser/gallery view in admin
- Bulk upload or batch operations
- File validation at upload time (max size, allowed types)
- CLI commands for media management
- Migration support or codemods for converting `imageUrl` fields to `media` fields

## Target Directory Structure

```
packages/core/src/
├── types/
│   ├── fields.ts            # + MediaFieldMeta, MediaFieldOptions
│   ├── media.ts             # NEW — MediaConfig, MediaConfigInput, FileStorageAdapter, MediaCollectionConfig
│   └── index.ts             # + re-export media types
├── fields/
│   ├── media/               # NEW
│   │   ├── index.ts         # re-export
│   │   ├── config.ts        # media() field builder
│   │   ├── schemaValueType.ts        # mediaToValueTypeString
│   │   └── schemaValueType.test.ts   # tests
│   ├── constants.ts         # (no change — media uses v.id() like relationship)
│   └── index.ts             # + export media
├── config/
│   ├── defineMediaCollection.ts       # NEW — defineMediaCollection() builder
│   └── defineMediaCollection.test.ts  # NEW — tests
├── valueTypes/
│   ├── extract.ts           # + media case in switch
│   ├── extract.test.ts      # + media field tests
│   ├── generate.ts          # + media collection generation
│   ├── generate.test.ts     # + media collection tests
│   ├── slugs.ts             # + mediaCollection slug source
│   └── slugs.test.ts        # + media slug tests
├── formSchema/
│   ├── generateFormSchema.ts      # + media case
│   └── generateFormSchema.test.ts # + media case test
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
    ├── index.ts             # convexFileStorage() factory + FileStorageAdapter re-export
    └── index.test.ts        # tests
```

## Implementation Order

1. **Step 1: Package scaffolding** — Create `@vexcms/file-storage-convex` package skeleton. After this step: `pnpm install` and `pnpm build` work.
2. **Step 2: Media types** — Add `FileStorageAdapter`, `MediaCollectionConfig`, `MediaConfig` types to `@vexcms/core`. After this step: types are importable.
3. **Step 3: Media field type** — Add `MediaFieldMeta`, `MediaFieldOptions`, `media()` builder, schema value type, and tests. After this step: `media()` field works in isolation.
4. **Step 4: `defineMediaCollection()` builder + tests** — Builder that auto-injects default fields, validates locked fields, and adds the `by_mimeType` index. After this step: media collections can be defined and tested.
5. **Step 5: VexConfig integration** — Add `media` field to `VexConfig`/`VexConfigInput`, update `defineConfig()` with defaults, update slug registry. After this step: config accepts media.
6. **Step 6: Schema generation** — Extend `generateVexSchema()` to output media collections under `MEDIA COLLECTIONS` block, extend `fieldToValueType()` for the media case, extend `fieldMetaToZod()` for the media case. After this step: full schema generation works with media.
7. **Step 7: Convex file storage adapter** — Implement `convexFileStorage()` in the new package. After this step: full end-to-end config works.
8. **Step 8: Core exports + test app example** — Add all new exports to `@vexcms/core` index, update test app config as example.

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

Placeholder so the package builds. Will be replaced in Step 7.

```typescript
export {};
```

---

## Step 2: Media Types

- [ ] Create `packages/core/src/types/media.ts`
- [ ] Update `packages/core/src/types/index.ts` to re-export media types
- [ ] Add `VexMediaConfigError` to `packages/core/src/errors/index.ts`
- [ ] Verify `pnpm --filter @vexcms/core typecheck` passes

**`File: packages/core/src/types/media.ts`**

Defines the `FileStorageAdapter` interface, `MediaCollectionConfig`, and the config shape for the `media` field on `VexConfig`.

```typescript
import type { VexField } from "./fields";
import type { VexCollection, AnyVexCollection, CollectionAdminConfig } from "./collections";

/**
 * Interface that file storage plugins must implement.
 * Each method operates on the storage provider (e.g., Convex file storage, S3, Cloudinary).
 *
 * The adapter is a description of the storage backend — actual upload/download operations
 * happen at runtime via the admin panel (future spec). This interface defines the contract
 * that any storage plugin must satisfy.
 */
export interface FileStorageAdapter {
  /** Identifier for the storage provider (e.g., "convex", "s3", "cloudinary"). */
  readonly name: string;

  /**
   * Get a presigned upload URL from the storage provider.
   * Called by the admin panel before uploading a file.
   *
   * @returns A URL string that accepts file uploads via PUT/POST.
   */
  getUploadUrl: () => Promise<string>;

  /**
   * Resolve a storage ID to an accessible URL.
   * Called when rendering media in the admin panel or fetching media URLs.
   *
   * @param props.storageId - The storage provider's file identifier.
   * @returns A URL string for accessing the file, or null if the file doesn't exist.
   */
  getUrl: (props: { storageId: string }) => Promise<string | null>;

  /**
   * Delete a file from the storage provider.
   * Called when a media document is deleted.
   *
   * @param props.storageId - The storage provider's file identifier.
   */
  deleteFile: (props: { storageId: string }) => Promise<void>;
}

/**
 * Fields that are auto-injected into every media collection and cannot be overridden.
 * If a user tries to define these in their media collection config, a dev warning is logged
 * and the user's definition is silently dropped.
 */
export const LOCKED_MEDIA_FIELDS = ["storageId", "filename", "mimeType", "size"] as const;
export type LockedMediaField = (typeof LOCKED_MEDIA_FIELDS)[number];

/**
 * Fields that are auto-injected but CAN be overridden by the user
 * (e.g., to add maxLength to alt, or change label on url).
 */
export const OVERRIDABLE_MEDIA_FIELDS = ["url", "alt", "width", "height"] as const;
export type OverridableMediaField = (typeof OVERRIDABLE_MEDIA_FIELDS)[number];

/**
 * Configuration for a media collection.
 * Extends the standard collection config pattern but with media-specific semantics.
 *
 * The `fields` record contains ONLY user-defined additional fields or overrides
 * of overridable defaults (alt, width, height, url). Locked fields (storageId,
 * filename, mimeType, size) are auto-injected by `defineMediaCollection()`.
 */
export interface MediaCollectionConfig<
  TFields extends Record<string, VexField> = Record<string, VexField>,
> {
  /** Additional fields beyond the defaults, or overrides of overridable defaults. */
  fields?: TFields;
  /** Override the Convex table name (defaults to slug). */
  tableName?: string;
  /** Display labels for the admin UI. */
  labels?: { singular?: string; plural?: string };
  /** Admin UI configuration. */
  admin?: CollectionAdminConfig<TFields, never>;
}

/**
 * The resolved media configuration on VexConfig.
 * Present when the user defines `media` in their config.
 */
export interface MediaConfig {
  /** Media collections with auto-injected file metadata fields. */
  collections: AnyVexCollection[];
  /** The file storage adapter plugin for handling uploads. */
  storageAdapter: FileStorageAdapter;
}

/**
 * Input shape for the `media` field on VexConfigInput.
 * The user passes this to `defineConfig()`.
 */
export interface MediaConfigInput {
  /** Media collection definitions created via `defineMediaCollection()`. */
  collections: AnyVexCollection[];
  /** File storage adapter plugin (e.g., `convexFileStorage()`). */
  storageAdapter: FileStorageAdapter;
}
```

**`File: packages/core/src/types/index.ts`** — Add media re-export.

Add the following line after the existing re-exports:

```typescript
export * from "./media";
```

The full file becomes:

```typescript
import { AnyVexCollection } from "./collections";
import { VexGlobal } from "./globals";
import type { VexAuthAdapter } from "./auth";
import { AdminConfig, AdminConfigInput } from "./admin";
import { SchemaConfig, SchemaConfigInput } from "./schema";

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

Note: Import `MediaConfig` and `MediaConfigInput` at the top:

```typescript
import type { MediaConfig, MediaConfigInput } from "./media";
```

**`File: packages/core/src/errors/index.ts`** — Add `VexMediaConfigError`.

Append to the existing errors file:

```typescript
/**
 * Thrown when media configuration is invalid.
 * For example: media collections defined without a storageAdapter,
 * or attempting to override a locked media field.
 */
export class VexMediaConfigError extends VexError {
  constructor(detail: string) {
    super(`Media configuration error: ${detail}`);
    this.name = "VexMediaConfigError";
  }
}
```

---

## Step 3: Media Field Type

- [ ] Add `MediaFieldMeta` and `MediaFieldOptions` to `packages/core/src/types/fields.ts`
- [ ] Add `media` to `VexField` union and `FieldMeta` union in `packages/core/src/types/fields.ts`
- [ ] Create `packages/core/src/fields/media/config.ts`
- [ ] Create `packages/core/src/fields/media/schemaValueType.ts`
- [ ] Create `packages/core/src/fields/media/index.ts`
- [ ] Create `packages/core/src/fields/media/schemaValueType.test.ts`
- [ ] Update `packages/core/src/fields/index.ts` to export `media`
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/types/fields.ts`** — Add MediaFieldMeta and MediaFieldOptions.

Add after the `RelationshipFieldOptions` interface (around line 379):

```typescript
/**
 * Media field metadata. References a media collection document via `v.id()`.
 * Similar to relationship but specifically typed for media collections.
 */
export interface MediaFieldMeta extends BaseFieldMeta {
  readonly type: "media";
  /** Target media collection slug. */
  to: string;
  /**
   * Allow multiple media references.
   *
   * Default: `false`
   */
  hasMany?: boolean;
}

/**
 * Options for the `media()` field builder.
 *
 * @example
 * ```
 * media({ to: "images", required: true })
 * media({ to: "images", hasMany: true })
 * ```
 */
export interface MediaFieldOptions extends BaseFieldOptions {
  /** Target media collection slug. */
  to: string;
  /**
   * Allow multiple media references.
   *
   * Default: `false`
   */
  hasMany?: boolean;
}
```

Update the `FieldMeta` union to include `MediaFieldMeta`:

```typescript
export type FieldMeta =
  | TextFieldMeta
  | NumberFieldMeta
  | CheckboxFieldMeta
  | SelectFieldMeta<string>
  | DateFieldMeta
  | ImageUrlFieldMeta
  | RelationshipFieldMeta
  | MediaFieldMeta
  | JsonFieldMeta
  | ArrayFieldMeta;
```

Update the `VexField` union to include the media variant:

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
  | GenericVexField<string, MediaFieldMeta>
  | GenericVexField<string[], MediaFieldMeta>
  | GenericVexField<unknown, JsonFieldMeta>
  | GenericVexField<unknown[], ArrayFieldMeta>;
```

**`File: packages/core/src/fields/media/config.ts`**

```typescript
import { MediaFieldMeta, MediaFieldOptions, GenericVexField } from "../../types";

export function media(
  options: MediaFieldOptions & { hasMany: true },
): GenericVexField<string[], MediaFieldMeta>;

export function media(
  options: MediaFieldOptions & { hasMany?: false },
): GenericVexField<string, MediaFieldMeta>;

export function media(
  options: MediaFieldOptions,
): GenericVexField<string | string[], MediaFieldMeta> {
  return {
    _type: options.hasMany ? [] : "",
    _meta: {
      type: "media",
      ...options,
    },
  };
}
```

**`File: packages/core/src/fields/media/schemaValueType.ts`**

```typescript
import type { MediaFieldMeta } from "../../types";

/**
 * Converts media field metadata to a Convex value type string.
 *
 * Uses the same v.id() pattern as relationship fields since media fields
 * are references to media collection documents.
 *
 * @param props.meta - The media field metadata
 * @param props.collectionSlug - The collection this field belongs to (for error messages)
 * @param props.fieldName - The field name (for error messages)
 * @returns
 * - hasMany: `v.array(v.id("mediaCollectionSlug"))`
 * - !hasMany + required: `v.id("mediaCollectionSlug")`
 * - !hasMany + !required: `v.optional(v.id("mediaCollectionSlug"))`
 */
export function mediaToValueTypeString(props: {
  meta: MediaFieldMeta;
  collectionSlug: string;
  fieldName: string;
}): string {
  const idType = `v.id("${props.meta.to}")`;

  if (props.meta.hasMany) {
    const arrayType = `v.array(${idType})`;
    if (!props.meta.required) return `v.optional(${arrayType})`;
    return arrayType;
  }

  if (!props.meta.required) return `v.optional(${idType})`;
  return idType;
}
```

**`File: packages/core/src/fields/media/index.ts`**

```typescript
export { media } from "./config";
export { mediaToValueTypeString } from "./schemaValueType";
```

**`File: packages/core/src/fields/media/schemaValueType.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { mediaToValueTypeString } from "./schemaValueType";
import type { MediaFieldMeta } from "../../types";

describe("mediaToValueTypeString", () => {
  it("returns v.id() for a required single media reference", () => {
    const meta: MediaFieldMeta = {
      type: "media",
      to: "images",
      required: true,
    };
    expect(
      mediaToValueTypeString({ meta, collectionSlug: "posts", fieldName: "cover" }),
    ).toBe('v.id("images")');
  });

  it("returns v.optional(v.id()) for an optional single media reference", () => {
    const meta: MediaFieldMeta = {
      type: "media",
      to: "images",
    };
    expect(
      mediaToValueTypeString({ meta, collectionSlug: "posts", fieldName: "cover" }),
    ).toBe('v.optional(v.id("images"))');
  });

  it("returns v.array(v.id()) for a required hasMany media reference", () => {
    const meta: MediaFieldMeta = {
      type: "media",
      to: "images",
      hasMany: true,
      required: true,
    };
    expect(
      mediaToValueTypeString({ meta, collectionSlug: "posts", fieldName: "gallery" }),
    ).toBe('v.array(v.id("images"))');
  });

  it("returns v.optional(v.array(v.id())) for an optional hasMany media reference", () => {
    const meta: MediaFieldMeta = {
      type: "media",
      to: "images",
      hasMany: true,
    };
    expect(
      mediaToValueTypeString({ meta, collectionSlug: "posts", fieldName: "gallery" }),
    ).toBe('v.optional(v.array(v.id("images")))');
  });

  it("uses the correct media collection slug in v.id()", () => {
    const meta: MediaFieldMeta = {
      type: "media",
      to: "documents",
      required: true,
    };
    expect(
      mediaToValueTypeString({ meta, collectionSlug: "articles", fieldName: "attachment" }),
    ).toBe('v.id("documents")');
  });
});
```

**`File: packages/core/src/fields/index.ts`** — Add media export.

```typescript
export { text } from "./text";
export { number } from "./number";
export { checkbox } from "./checkbox";
export { select } from "./select";
export { date } from "./date";
export { imageUrl } from "./imageUrl";
export { relationship } from "./relationship";
export { media } from "./media";
export { json } from "./json";
export { array } from "./array";
```

---

## Step 4: `defineMediaCollection()` Builder + Tests

- [ ] Create `packages/core/src/config/defineMediaCollection.ts`
- [ ] Create `packages/core/src/config/defineMediaCollection.test.ts`
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/config/defineMediaCollection.ts`**

The builder that creates media collections with auto-injected default fields.

```typescript
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
 * Locked fields (storageId, filename, mimeType, size) cannot be overridden.
 * Overridable fields (url, alt, width, height) can be customized by the user.
 */
function getDefaultMediaFields(): Record<string, VexField> {
  return {
    storageId: text({ required: true, defaultValue: "", label: "Storage ID", admin: { hidden: true } }),
    filename: text({ required: true, defaultValue: "", label: "Filename", admin: { readOnly: true } }),
    mimeType: text({ required: true, defaultValue: "", label: "MIME Type", index: "by_mimeType", admin: { readOnly: true } }),
    size: number({ required: true, defaultValue: 0, label: "File Size (bytes)", admin: { readOnly: true } }),
    url: text({ required: true, defaultValue: "", label: "URL", admin: { readOnly: true } }),
    alt: text({ label: "Alt Text" }),
    width: number({ label: "Width (px)" }),
    height: number({ label: "Height (px)" }),
  };
}

/**
 * Define a media collection with auto-injected file metadata fields.
 *
 * Creates a VexCollection with default media fields merged in. Locked fields
 * (storageId, filename, mimeType, size) are always present and cannot be
 * overridden by user config. Overridable fields (url, alt, width, height)
 * can be customized. Any additional user fields are appended.
 *
 * @param slug - The collection slug (must be lowercase alphanumeric + underscores)
 * @param config - Optional media collection configuration with additional fields
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
  // 5. Return a VexCollection object:
  //    {
  //      slug,
  //      config: {
  //        fields: mergedFields,
  //        tableName: config?.tableName,
  //        labels: config?.labels,
  //        admin: config?.admin,
  //      },
  //      _docType: {} as InferFieldsType<...>,
  //    }
  //
  // Edge cases:
  // - config is undefined: return collection with only default fields
  // - config.fields is undefined: return collection with only default fields
  // - config.fields is empty {}: return collection with only default fields
  // - User overrides "alt" with text({ required: true, ... }): alt gets user's config
  // - User tries to override "storageId": warning logged, storageId stays as default
  throw new Error("Not implemented");
}
```

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
      expect(fieldNames).toContain("filename");
      expect(fieldNames).toContain("mimeType");
      expect(fieldNames).toContain("size");
      expect(fieldNames).toContain("url");
      expect(fieldNames).toContain("alt");
      expect(fieldNames).toContain("width");
      expect(fieldNames).toContain("height");
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

  describe("user field overrides", () => {
    it("allows overriding overridable fields (alt)", () => {
      const collection = defineMediaCollection("images", {
        fields: {
          alt: text({ label: "Image Alt Text", required: true, defaultValue: "", maxLength: 200 }),
        },
      });
      const field = collection.config.fields.alt as VexField;

      expect(field._meta.type).toBe("text");
      expect(field._meta.label).toBe("Image Alt Text");
      expect(field._meta.required).toBe(true);
      expect((field._meta as any).maxLength).toBe(200);
    });

    it("allows overriding overridable fields (width, height)", () => {
      const collection = defineMediaCollection("images", {
        fields: {
          width: number({ label: "Image Width", required: true, defaultValue: 0 }),
          height: number({ label: "Image Height", required: true, defaultValue: 0 }),
        },
      });

      expect(collection.config.fields.width._meta.label).toBe("Image Width");
      expect(collection.config.fields.width._meta.required).toBe(true);
      expect(collection.config.fields.height._meta.label).toBe("Image Height");
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
      // Default fields still present
      expect(fieldNames).toContain("storageId");
      expect(fieldNames).toContain("mimeType");
    });

    it("drops locked fields with dev warning", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const collection = defineMediaCollection("images", {
        fields: {
          storageId: text({ label: "My Custom Storage ID" }),
        },
      });

      // Locked field is NOT overridden
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
      expect(collection.config.fields.size._meta.label).toBe("File Size (bytes)");

      expect(warnSpy).toHaveBeenCalledTimes(4);

      warnSpy.mockRestore();
    });
  });

  describe("slug and config", () => {
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
      expect(collection.config.labels).toEqual({ singular: "Image", plural: "Images" });
    });

    it("passes through admin config", () => {
      const collection = defineMediaCollection("images", {
        admin: {
          useAsTitle: "filename" as any,
          group: "Media",
        },
      });
      expect(collection.config.admin?.group).toBe("Media");
    });
  });
});
```

---

## Step 5: VexConfig Integration

- [ ] Update `packages/core/src/types/index.ts` — add `media` field to `VexConfig` and `VexConfigInput` (done in Step 2)
- [ ] Update `packages/core/src/config/defineConfig.ts` — handle `media` in config merging and validation
- [ ] Update `packages/core/src/valueTypes/slugs.ts` — add `mediaCollection` slug source
- [ ] Update `packages/core/src/valueTypes/slugs.test.ts` — add media slug collision tests
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/config/defineConfig.ts`** — Update to handle media config.

The `defineConfig()` function needs to:
1. Pass through `media` when provided
2. Validate: if `media.collections` is non-empty, `media.storageAdapter` must be provided
3. Treat `media.collections: []` as if media was not provided (set `media` to `undefined`)

```typescript
import type { VexConfig, VexConfigInput } from "../types";
import { VexMediaConfigError } from "../errors";

export const BASE_VEX_CONFIG: Omit<VexConfig, "auth"> = {
  basePath: "/admin",
  globals: [],
  collections: [],
  admin: {
    meta: {
      titleSuffix: "| Admin",
      favicon: "/favicon.ico",
    },
    user: "users",
    sidebar: {
      hideGlobals: false,
    },
  },
  schema: {
    outputPath: "/convex/vex.schema.ts",
    autoMigrate: true,
    autoRemove: false,
  },
};

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
  //    → Append media collection slugs to the slugs array before duplicate check
  //
  // Edge cases:
  // - media: undefined → no media field on config
  // - media: { collections: [], storageAdapter: ... } → treated as no media (undefined)
  // - media: { collections: [...], storageAdapter: undefined } → throw VexMediaConfigError
  throw new Error("Not implemented");
}
```

**`File: packages/core/src/valueTypes/slugs.ts`** — Add media collection slug source.

Add a new slug source for media collections:

```typescript
export const SLUG_SOURCES = {
  userCollection: "user-collection",
  userGlobal: "user-global",
  authTable: "auth-table",
  mediaCollection: "media-collection",
  system: "system",
} as const;
```

Update `buildSlugRegistry()` to register media collection slugs:

```typescript
export function buildSlugRegistry(props: { config: VexConfig }): SlugRegistry {
  const registry = new SlugRegistry();

  for (const collection of props.config.collections) {
    registry.register({
      slug: collection.slug,
      source: SLUG_SOURCES.userCollection,
      location: `Collection ${collection.slug}`,
    });
  }

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

  for (const global of props.config.globals) {
    registry.register({
      slug: global.slug,
      source: SLUG_SOURCES.userGlobal,
      location: `Global ${global.slug}`,
    });
  }

  for (const collection of props.config.auth.collections) {
    registry.register({
      slug: collection.slug,
      source: SLUG_SOURCES.authTable,
      location: `Auth Table ${collection.slug}`,
    });
  }

  return registry;
}
```

The `SlugRegistry.register()` method also needs updating — media collection slugs should NOT overlap with any other source (unlike auth tables which can overlap with user collections):

```typescript
register(props: {
  slug: string;
  source: SlugSource;
  location: string;
}): void {
  const existing = this.registrations.get(props.slug);
  if (existing) {
    // Auth table overlapping with user collection is expected — merge
    if (
      (existing.source === "user-collection" &&
        props.source === "auth-table") ||
      (existing.source === "auth-table" && props.source === "user-collection")
    ) {
      if (props.source === "user-collection") {
        this.registrations.set(props.slug, {
          slug: props.slug,
          source: props.source,
          location: props.location,
        });
      }
      return;
    }
    // All other conflicts (including media collections) are errors
    throw new VexSlugConflictError(
      props.slug,
      existing.source,
      existing.location,
      props.source,
      props.location,
    );
  }
  this.registrations.set(props.slug, {
    slug: props.slug,
    source: props.source,
    location: props.location,
  });
}
```

**`File: packages/core/src/valueTypes/slugs.test.ts`** — Add media slug tests.

Add the following test cases to the existing test file:

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
        storageAdapter: { name: "test", getUploadUrl: async () => "", getUrl: async () => "", deleteFile: async () => {} },
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
        storageAdapter: { name: "test", getUploadUrl: async () => "", getUrl: async () => "", deleteFile: async () => {} },
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
        storageAdapter: { name: "test", getUploadUrl: async () => "", getUrl: async () => "", deleteFile: async () => {} },
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
        storageAdapter: { name: "test", getUploadUrl: async () => "", getUrl: async () => "", deleteFile: async () => {} },
      },
    });

    expect(() => buildSlugRegistry({ config })).not.toThrow();
  });
});
```

---

## Step 6: Schema Generation

- [ ] Update `packages/core/src/valueTypes/extract.ts` — add `media` case to `fieldToValueType()`
- [ ] Update `packages/core/src/valueTypes/extract.test.ts` — add media field tests
- [ ] Update `packages/core/src/valueTypes/generate.ts` — add media collection generation
- [ ] Update `packages/core/src/valueTypes/generate.test.ts` — add media collection tests
- [ ] Update `packages/core/src/formSchema/generateFormSchema.ts` — add media case to `fieldMetaToZod()`
- [ ] Update `packages/core/src/formSchema/generateFormSchema.test.ts` — add media case test
- [ ] Run `pnpm --filter @vexcms/core test`

**`File: packages/core/src/valueTypes/extract.ts`** — Add media case.

Add import at the top:

```typescript
import { mediaToValueTypeString } from "../fields/media";
```

Add case in the switch statement, before the `default` case:

```typescript
    case "media":
      return mediaToValueTypeString({ meta: field._meta, collectionSlug, fieldName });
```

**`File: packages/core/src/valueTypes/extract.test.ts`** — Add media field tests.

Add import:

```typescript
import { media } from "../fields/media";
```

Add test case in the appropriate describe block:

```typescript
  it("converts media field to v.id()", () => {
    expect(
      fieldToValueType({
        field: media({ to: "images", required: true }),
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.id("images")');
  });

  it("converts optional media field to v.optional(v.id())", () => {
    expect(
      fieldToValueType({
        field: media({ to: "images" }),
        collectionSlug: "posts",
        fieldName: "cover",
      }),
    ).toBe('v.optional(v.id("images"))');
  });

  it("converts hasMany media field to v.array(v.id())", () => {
    expect(
      fieldToValueType({
        field: media({ to: "images", hasMany: true, required: true }),
        collectionSlug: "posts",
        fieldName: "gallery",
      }),
    ).toBe('v.array(v.id("images"))');
  });
```

**`File: packages/core/src/valueTypes/generate.ts`** — Add media collection generation.

After the user collections loop and before the unmerged auth collections loop, add media collection generation:

```typescript
  // --- MEDIA COLLECTIONS ---
  if (config.media && config.media.collections.length > 0) {
    lines.push("", "/**", " * MEDIA COLLECTIONS", " **/");

    for (const mediaCollection of config.media.collections) {
      const fields: { name: string; valueType: string }[] = [];
      const indexes: ResolvedIndex[] = collectIndexes({ collection: mediaCollection });
      const searchIndexes: ResolvedSearchIndex[] = collectSearchIndexes({ collection: mediaCollection });

      for (const [fieldName, field] of Object.entries(mediaCollection.config.fields) as [string, VexField][]) {
        fields.push({
          name: fieldName,
          valueType: fieldToValueType({
            fieldName,
            field,
            collectionSlug: mediaCollection.slug,
          }),
        });
      }

      lines.push(
        "",
        `export const ${mediaCollection.config.tableName ?? mediaCollection.slug} = defineTable({`,
      );
      for (const f of fields) {
        lines.push(`  ${f.name}: ${f.valueType},`);
      }
      lines.push("})");
      for (const i of indexes) {
        const fieldList = i.fields.map((f) => `"${f}"`).join(", ");
        lines.push(`  .index("${i.name}", [${fieldList}])`);
      }
      for (const si of searchIndexes) {
        const filterList =
          si.filterFields.length > 0
            ? `, filterFields: [${si.filterFields.map((f) => `"${f}"`).join(", ")}]`
            : "";
        lines.push(
          `  .searchIndex("${si.name}", { searchField: "${si.searchField}"${filterList} })`,
        );
      }
    }
  }
```

**`File: packages/core/src/valueTypes/generate.test.ts`** — Add media collection tests.

Add these test cases:

```typescript
import { media } from "../fields/media";

// ... existing imports and setup ...

describe("media collection generation", () => {
  const mockStorageAdapter = {
    name: "test",
    getUploadUrl: async () => "",
    getUrl: async () => "",
    deleteFile: async () => {},
  };

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
      media: {
        collections: [images],
        storageAdapter: mockStorageAdapter,
      },
    });

    const output = generateVexSchema({ config });

    expect(output).toContain("MEDIA COLLECTIONS");
    expect(output).toContain("export const images = defineTable({");
    expect(output).toContain("storageId: v.string()");
    expect(output).toContain("filename: v.string()");
    expect(output).toContain("mimeType: v.string()");
    expect(output).toContain("size: v.number()");
    expect(output).toContain("url: v.string()");
    expect(output).toContain("alt: v.optional(v.string())");
    expect(output).toContain("width: v.optional(v.number())");
    expect(output).toContain("height: v.optional(v.number())");
  });

  it("generates indexes on media collections (by_mimeType)", () => {
    const images = defineCollection("images", {
      fields: {
        storageId: text({ required: true, defaultValue: "" }),
        mimeType: text({ required: true, defaultValue: "", index: "by_mimeType" }),
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
      media: {
        collections: [images],
        storageAdapter: mockStorageAdapter,
      },
    });

    const output = generateVexSchema({ config });

    expect(output).toContain('.index("by_mimeType", ["mimeType"])');
  });

  it("does not generate MEDIA COLLECTIONS block when no media config", () => {
    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
    });

    const output = generateVexSchema({ config });
    expect(output).not.toContain("MEDIA COLLECTIONS");
  });

  it("does not generate MEDIA COLLECTIONS block when media.collections is empty", () => {
    const config = defineConfig({
      collections: [users],
      auth: minimalAuth,
      media: {
        collections: [],
        storageAdapter: mockStorageAdapter,
      },
    });

    const output = generateVexSchema({ config });
    expect(output).not.toContain("MEDIA COLLECTIONS");
  });

  it("generates media() field references in user collections", () => {
    const posts = defineCollection("posts", {
      fields: {
        title: text(),
        cover: media({ to: "images", required: true }),
        gallery: media({ to: "images", hasMany: true }),
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
      media: {
        collections: [images],
        storageAdapter: mockStorageAdapter,
      },
    });

    const output = generateVexSchema({ config });

    expect(output).toContain('cover: v.id("images")');
    expect(output).toContain('gallery: v.optional(v.array(v.id("images")))');
  });

  it("generates multiple media collections", () => {
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

    const documents = defineCollection("documents", {
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
      collections: [users],
      auth: minimalAuth,
      media: {
        collections: [images, documents],
        storageAdapter: mockStorageAdapter,
      },
    });

    const output = generateVexSchema({ config });

    expect(output).toContain("export const images = defineTable({");
    expect(output).toContain("export const documents = defineTable({");
  });
});
```

**`File: packages/core/src/formSchema/generateFormSchema.ts`** — Add media case.

Add the `media` case to `fieldMetaToZod()`, after the `relationship` case:

```typescript
    case "media": {
      if (props.meta.hasMany) {
        return z.array(z.string());
      }
      return z.string();
    }
```

**`File: packages/core/src/formSchema/generateFormSchema.test.ts`** — Add media case test.

Add test:

```typescript
import { media } from "../fields/media";

// In appropriate describe block:
it("generates z.string() for media field", () => {
  const schema = generateFormSchema({
    fields: {
      cover: media({ to: "images", required: true }),
    },
  });

  const result = schema.safeParse({ cover: "abc123" });
  expect(result.success).toBe(true);
});

it("generates z.array(z.string()) for hasMany media field", () => {
  const schema = generateFormSchema({
    fields: {
      gallery: media({ to: "images", hasMany: true, required: true }),
    },
  });

  const result = schema.safeParse({ gallery: ["abc123", "def456"] });
  expect(result.success).toBe(true);
});
```

---

## Step 7: Convex File Storage Adapter

- [ ] Implement `packages/file-storage-convex/src/index.ts`
- [ ] Create `packages/file-storage-convex/src/index.test.ts`
- [ ] Run `pnpm --filter @vexcms/file-storage-convex build`
- [ ] Run `pnpm --filter @vexcms/file-storage-convex test`

**`File: packages/file-storage-convex/src/index.ts`**

```typescript
import type { FileStorageAdapter } from "@vexcms/core";

/**
 * Options for the Convex file storage adapter.
 */
export interface ConvexFileStorageOptions {
  /**
   * The Convex deployment URL.
   * If not provided, uses the CONVEX_URL environment variable.
   */
  convexUrl?: string;
}

/**
 * Create a Convex file storage adapter.
 *
 * This adapter integrates with Convex's built-in file storage system.
 * The actual upload/download operations are handled by Convex mutations/queries
 * at runtime — this adapter provides the configuration and method stubs
 * that will be wired to real Convex functions by the admin panel (future spec).
 *
 * @param props - Optional configuration
 * @returns A FileStorageAdapter configured for Convex file storage
 *
 * @example
 * ```ts
 * import { convexFileStorage } from "@vexcms/file-storage-convex";
 *
 * defineConfig({
 *   media: {
 *     collections: [images],
 *     storageAdapter: convexFileStorage(),
 *   },
 * });
 * ```
 */
export function convexFileStorage(props?: ConvexFileStorageOptions): FileStorageAdapter {
  // TODO: implement
  //
  // 1. Return an object satisfying the FileStorageAdapter interface:
  //    {
  //      name: "convex",
  //      getUploadUrl: async () => { ... },
  //      getUrl: async (props) => { ... },
  //      deleteFile: async (props) => { ... },
  //    }
  //
  // 2. For now, the methods should throw descriptive errors indicating
  //    they need to be wired to Convex runtime functions by the admin panel:
  //    → getUploadUrl: throw new Error("convexFileStorage.getUploadUrl() must be called with a Convex client. This will be wired automatically by the admin panel.")
  //    → getUrl: throw new Error("convexFileStorage.getUrl() must be called with a Convex client. This will be wired automatically by the admin panel.")
  //    → deleteFile: throw new Error("convexFileStorage.deleteFile() must be called with a Convex client. This will be wired automatically by the admin panel.")
  //
  // 3. Store props.convexUrl for future use (or default to process.env.CONVEX_URL)
  //    → This will be used when the admin panel wires the adapter to real Convex functions
  //
  // Edge cases:
  // - props is undefined: use defaults
  // - props.convexUrl is undefined: will use CONVEX_URL env var at runtime
  throw new Error("Not implemented");
}
```

**`File: packages/file-storage-convex/src/index.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { convexFileStorage } from "./index";

describe("convexFileStorage", () => {
  it("returns an adapter with name 'convex'", () => {
    const adapter = convexFileStorage();
    expect(adapter.name).toBe("convex");
  });

  it("returns an adapter with all required methods", () => {
    const adapter = convexFileStorage();
    expect(typeof adapter.getUploadUrl).toBe("function");
    expect(typeof adapter.getUrl).toBe("function");
    expect(typeof adapter.deleteFile).toBe("function");
  });

  it("accepts optional convexUrl", () => {
    const adapter = convexFileStorage({ convexUrl: "https://my-deployment.convex.cloud" });
    expect(adapter.name).toBe("convex");
  });

  it("getUploadUrl throws descriptive error (not yet wired to runtime)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.getUploadUrl()).rejects.toThrow("must be called with a Convex client");
  });

  it("getUrl throws descriptive error (not yet wired to runtime)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.getUrl({ storageId: "test-id" })).rejects.toThrow("must be called with a Convex client");
  });

  it("deleteFile throws descriptive error (not yet wired to runtime)", async () => {
    const adapter = convexFileStorage();
    await expect(adapter.deleteFile({ storageId: "test-id" })).rejects.toThrow("must be called with a Convex client");
  });
});
```

---

## Step 8: Core Exports + Test App Example

- [ ] Update `packages/core/src/index.ts` — add all new exports
- [ ] Update `apps/test-app/vex.config.ts` — add example media config (documentation only, not required)
- [ ] Run `pnpm --filter @vexcms/core build`
- [ ] Run `pnpm --filter @vexcms/core test`
- [ ] Run `pnpm --filter @vexcms/file-storage-convex build`
- [ ] Run `pnpm --filter @vexcms/file-storage-convex test`

**`File: packages/core/src/index.ts`** — Add new exports.

Add to the fields section:

```typescript
export { media } from "./fields/media";
```

Add to the config section:

```typescript
export { defineMediaCollection } from "./config/defineMediaCollection";
```

Add to the type exports:

```typescript
export type {
  MediaFieldMeta,
  MediaFieldOptions,
} from "./types";

export type {
  FileStorageAdapter,
  MediaCollectionConfig,
  MediaConfig,
  MediaConfigInput,
  LockedMediaField,
  OverridableMediaField,
} from "./types";
```

Note: `LOCKED_MEDIA_FIELDS` and `OVERRIDABLE_MEDIA_FIELDS` are const arrays, so they need value exports:

```typescript
export { LOCKED_MEDIA_FIELDS, OVERRIDABLE_MEDIA_FIELDS } from "./types/media";
```

**`File: apps/test-app/vex.config.ts`** — Example showing how media would be configured.

This is an example for documentation. The test app config would look like:

```typescript
import { defineConfig, defineMediaCollection, text, media } from "@vexcms/core";
import { convexFileStorage } from "@vexcms/file-storage-convex";

const images = defineMediaCollection("images", {
  labels: { singular: "Image", plural: "Images" },
  fields: {
    alt: text({ label: "Alt Text", required: true, defaultValue: "" }),
    caption: text({ label: "Caption" }),
  },
  admin: {
    group: "Media",
  },
});

// In the users collection, use the media field:
// profileImage: media({ to: "images", label: "Profile Image" }),

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

- [ ] `@vexcms/core` builds without errors
- [ ] `@vexcms/file-storage-convex` builds without errors
- [ ] All existing tests still pass (no regressions)
- [ ] New tests pass: `media()` field builder, `defineMediaCollection()`, schema generation with media
- [ ] `media()` field generates correct `v.id()` schema (single, hasMany, required, optional)
- [ ] `defineMediaCollection()` auto-injects all 8 default fields
- [ ] `defineMediaCollection()` prevents overriding locked fields (storageId, filename, mimeType, size)
- [ ] `defineMediaCollection()` allows overriding overridable fields (alt, url, width, height)
- [ ] `defineMediaCollection()` allows adding custom fields
- [ ] Schema generation outputs media collections under `MEDIA COLLECTIONS` comment block
- [ ] Schema generation includes `by_mimeType` index on media collections
- [ ] `VexConfig.media` accepts `collections` + `storageAdapter`
- [ ] Slug registry prevents media collection slug conflicts with user/auth/global slugs
- [ ] `defineConfig()` validates: non-empty media.collections requires storageAdapter
- [ ] `defineConfig()` treats empty media.collections as no media
- [ ] `convexFileStorage()` returns a valid `FileStorageAdapter`
- [ ] `fieldMetaToZod()` handles media fields (z.string() for single, z.array(z.string()) for hasMany)
