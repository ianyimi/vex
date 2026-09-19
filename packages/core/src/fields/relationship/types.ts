import { ADMIN_FIELDS } from "../constants";
import {
  ApplyComponent,
  BaseField,
  BaseFieldInput,
  ComponentHKT,
  FieldAdminConfig,
  FieldAdminConfigInput,
  FieldValidateProps,
} from "../baseTypes";
import { CollectionSlug } from "../../types/generated";
import { RelationshipPreviewProps } from "../../collections";

/**
 * Admin configuration input specific to a relationship field instance.
 *
 * Extends {@link FieldAdminConfigInput} with a `components` slot that lets a
 * single field override the preview renderer. This is the only supported
 * location for a relationship preview override (ARCH-1) — target collections
 * do not have their own `admin.components.preview`.
 *
 * @typeParam TCollectionSlug - The target collection slug, inferred from the field's `collection` option.
 * @see {@link RelationshipFieldAdminConfig} for the resolved type after defaults are applied
 * @see {@link FieldAdminConfigInput} for the base admin properties
 */
export interface RelationshipFieldAdminInput<
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends FieldAdminConfigInput {
  /**
   * Custom component overrides specific to this relationship field instance.
   * `preview` is currently the only supported override.
   */
  components?: {
    /**
     * Per-field override for rendering this relationship's docs — the only
     * supported location for a custom preview (ARCH-1: target collections do
     * not support their own `admin.components.preview`).
     */
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps<TTargetSlug>>;
  };
}

/**
 * Resolved admin configuration for a relationship field after defaults are applied.
 *
 * @typeParam TCollectionSlug - The target collection slug.
 * @see {@link RelationshipFieldAdminInput} for the user-facing input type
 */
export interface RelationshipFieldAdminConfig<
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends FieldAdminConfig {
  /**
   * Custom component overrides specific to this relationship field instance.
   * `preview` is currently the only supported override.
   */
  components: {
    /**
     * Per-field override for rendering this relationship's docs — the only
     * supported location for a custom preview (ARCH-1: target collections do
     * not support their own `admin.components.preview`).
     */
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps<TTargetSlug>>;
  };
}

/**
 * Configuration input for a `relationship()` field.
 *
 * Stores Convex `Id` references to documents in another registered collection.
 * The Convex schema always uses `v.array(v.id("slug"))` regardless of `hasMany`.
 * `hasMany` is a UI-only hint — `false` shows a single-selection picker,
 * `true` shows a multi-selection picker. `TCollectionSlug` is inferred from the `collection`
 * option — after running `vex generate`, invalid slugs are a compile-time error.
 *
 * **Defaults applied by `relationship()`:**
 * ```ts
 * {
 *   type:     "relationship",
 *   label:    "",    // inferred from the field key by defineCollection
 *   required: false,
 *   hasMany:  false, // single-select picker in the admin UI; schema is always v.array(v.id())
 *   admin: {
 *     hidden:        false,
 *     readOnly:      false,
 *     position:      "main",
 *     width:         "full",
 *     cellAlignment: "left",
 *   }
 * }
 *
 * @typeParam TCollectionSlug - The target collection slug. Inferred from `collection`.
 *   Defaults to `CollectionSlug` (the full union after `vex generate`).
 *
 * @example
 * ```ts
 * // Single reference
 * author: relationship({ collection: { slug: "authors" } })
 *
 * // Multi-reference
 * tags: relationship({ collection: { slug: "tags" }, hasMany: true })
 * ```
 *
 * @see {@link RelationshipField} for the resolved output type
 * @see {@link relationship} for the config function
 * @see {@link CollectionSlug} for the valid slug union
 */
export interface RelationshipFieldInput<
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseFieldInput<TFieldMeta, TCollectionSlug> {
  /** Target collection reference. The slug must match a registered collection in `defineConfig`. */
  collection: {
    /** The slug of the collection this field links to. Must be a registered collection slug. */
    slug: TTargetSlug;
  };
  /**
   * Whether this field stores multiple references.
   * `false` stores a single `Id`, `true` stores `Id[]`.
   * @defaultValue false
   */
  hasMany?: boolean;
  /** Minimum number of related documents required, once a value is supplied. */
  min?: {
    /** Minimum reference count. */
    value: number;
    /** Minimum reference count error message. */
    error?: string;
  };
  /** Maximum number of related documents allowed. */
  max?: {
    /** Maximum reference count. */
    value: number;
    /** Maximum reference count error message. */
    error?: string;
  };
  admin?: BaseFieldInput["admin"] &
    RelationshipFieldAdminInput<TTargetSlug, TComponent>;
  /** Server-only async validation with `value` typed as `string[]`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string[]>): Promise<string | void> | string | void;
}

/**
 * Resolved configuration for a `relationship()` field, after all defaults are applied.
 *
 * `TCollection` is the string-literal type of the target collection's slug,
 * inferred from `RelationshipFieldInput.collection`.
 *
 * @typeParam TCollection - The target collection slug (inferred from input).
 * @see {@link RelationshipFieldInput} for the user-facing input type
 * @see {@link relationship} for the config function
 */
export interface RelationshipField<
  TFieldMeta extends {} = {},
  TTargetSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
  TCollectionSlug extends CollectionSlug = CollectionSlug,
> extends BaseField<TFieldMeta, TCollectionSlug> {
  readonly type: typeof ADMIN_FIELDS.relationship.type;
  /** Target collection reference. */
  collection: {
    /** The slug of the collection this field links to. */
    slug: TTargetSlug;
  };
  /** Whether this field stores multiple document references. */
  hasMany: boolean;
  /** Minimum number of related documents required, once a value is supplied. */
  min?: {
    /** Minimum reference count. */
    value: number;
    /** Minimum reference count error message. */
    error?: string;
  };
  /** Maximum number of related documents allowed. */
  max?: {
    /** Maximum reference count. */
    value: number;
    /** Maximum reference count error message. */
    error?: string;
  };
  admin: BaseField<TFieldMeta>["admin"] &
    RelationshipFieldAdminConfig<TTargetSlug, TComponent>;
  /** Server-only async validation with `value` typed as `string[]`. @see {@link FieldValidate} */
  validate?(props: FieldValidateProps<TCollectionSlug, string[]>): Promise<string | void> | string | void;
}
