// =============================================================================
// COLLECTION TYPES
// =============================================================================

import { VexField, InferFieldsType } from "..";

/**
 * Admin UI configuration for a collection.
 * Controls how the collection appears and behaves in the admin panel.
 */
export interface CollectionAdminConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /**
   * Group this collection under a heading in the sidebar.
   * Collections with the same group string are grouped together.
   */
  group?: string;
  /**
   * Icon name for the collection in the sidebar.
   * Uses Lucide icon names (e.g. `"file-text"`, `"users"`, `"settings"`).
   */
  icon?: string;
  /**
   * Field key to use as the document title in list views.
   * Should reference a text-like field from the collection's fields.
   */
  useAsTitle?: keyof TFields;
  /**
   * Field keys to show as default columns in the list view.
   * If not set, all fields are shown.
   */
  defaultColumns?: (keyof TFields)[];
  /**
   * Disable the "Create New" button in the admin list view.
   *
   * Default: `false`
   */
  disableCreate?: boolean;
  /**
   * Disable the delete action in the admin panel.
   *
   * Default: `false`
   */
  disableDelete?: boolean;
}

/**
 * Configuration passed to `defineCollection`.
 * Defines the fields, labels, and admin behavior for a collection.
 */
export interface CollectionConfig<
  TFields extends Record<string, VexField<any, any>>,
> {
  /**
   * The fields that make up documents in this collection.
   * Each key becomes a field name, and the value defines
   * its type and validation (e.g. `text()`, `number()`, `select()`).
   */
  fields: TFields;
  /**
   * Display labels for the collection in the admin UI.
   * If not provided, labels are derived from the collection slug.
   */
  labels?: {
    /** Singular label (e.g. `"Post"`). */
    singular?: string;
    /** Plural label (e.g. `"Posts"`). */
    plural?: string;
  };
  /**
   * Admin UI configuration for this collection.
   * Controls sidebar grouping, icons, list columns, and permissions.
   */
  admin?: CollectionAdminConfig<TFields>;
}

/**
 * A defined collection with inferred document type.
 * Created by `defineCollection()`.
 */
export interface VexCollection<
  TFields extends Record<string, VexField<any, any>>,
> {
  /** The collection identifier, used in URLs and the database. */
  readonly slug: string;
  /** The full collection configuration. */
  readonly config: CollectionConfig<TFields>;
  /**
   * Type helper — use `typeof collection._docType` to get the
   * inferred document shape for this collection.
   */
  readonly _docType: InferFieldsType<TFields>;
}
