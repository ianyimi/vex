import { ADMIN_FIELDS } from "../constants";
import {
  ApplyComponent,
  BaseField,
  BaseFieldInput,
  ComponentHKT,
  FieldAdminConfig,
  FieldAdminConfigInput,
} from "../baseTypes";
import { CollectionSlug } from "../../types/generated";
import { RelationshipPreviewProps } from "../../collections";

/**
 * Admin configuration input specific to a relationship field instance.
 *
 * Extends {@link FieldAdminConfigInput} with a `components` slot that lets a
 * single field override the preview renderer — taking precedence over the target
 * collection's `admin.components.preview`.
 *
 * @typeParam TCollectionSlug - The target collection slug, inferred from the field's `collection` option.
 * @see {@link RelationshipFieldAdminConfig} for the resolved type after defaults are applied
 * @see {@link FieldAdminConfigInput} for the base admin properties
 */
export interface RelationshipFieldAdminInput<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends FieldAdminConfigInput {
  /**
   * Custom component overrides specific to this relationship field instance.
   * These take precedence over the target collection's `admin.components`.
   */
  components?: {
    /**
     * Per-field override for rendering this relationship's docs. Wins over
     * the target collection's `admin.components.preview`. `TCollectionSlug` is the
     * *target* slug (`fieldDef.collection.slug`).
     */
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps<TCollectionSlug>>;
  };
}

/**
 * Resolved admin configuration for a relationship field after defaults are applied.
 *
 * @typeParam TCollectionSlug - The target collection slug.
 * @see {@link RelationshipFieldAdminInput} for the user-facing input type
 */
export interface RelationshipFieldAdminConfig<
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends FieldAdminConfig {
  /**
   * Custom component overrides specific to this relationship field instance.
   * These take precedence over the target collection's `admin.components`.
   */
  components: {
    /**
     * Per-field override for rendering this relationship's docs. Wins over
     * the target collection's `admin.components.preview`. `TCollectionSlug` is the
     * *target* slug (`fieldDef.collection.slug`).
     */
    preview?: ApplyComponent<TComponent, RelationshipPreviewProps<TCollectionSlug>>;
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
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends BaseFieldInput<TFieldMeta> {
  /** Target collection reference. The slug must match a registered collection in `defineConfig`. */
  collection: {
    /** The slug of the collection this field links to. Must be a registered collection slug. */
    slug: TCollectionSlug;
  };
  /**
   * Whether this field stores multiple references.
   * `false` stores a single `Id`, `true` stores `Id[]`.
   * @defaultValue false
   */
  hasMany?: boolean;
  admin?: BaseFieldInput["admin"] &
    RelationshipFieldAdminInput<TCollectionSlug, TComponent>;
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
  TCollectionSlug extends CollectionSlug = CollectionSlug,
  TComponent extends ComponentHKT = ComponentHKT,
> extends BaseField<TFieldMeta> {
  readonly type: typeof ADMIN_FIELDS.relationship.type;
  /** Target collection reference. */
  collection: {
    /** The slug of the collection this field links to. */
    slug: TCollectionSlug;
  };
  /** Whether this field stores multiple document references. */
  hasMany: boolean;
  admin: BaseField<TFieldMeta>["admin"] &
    RelationshipFieldAdminConfig<TCollectionSlug, TComponent>;
}
