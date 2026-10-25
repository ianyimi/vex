import type { DocumentByResourceSlug, VexResourceSlug } from "../../types/generated";

/**
 * Data and sibling-field values visible to a field's `admin.condition`.
 *
 * @typeParam TCollectionSlug - The collection (or global) `data` is typed
 *   against — `DocumentByResourceSlug<TCollectionSlug>`, the same resolver
 *   `FieldValidateProps.doc` already uses. Defaults to the wide
 *   `VexResourceSlug` union (every document) when unspecified.
 */
export interface FieldConditionProps<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> {
  /** The whole document currently being edited, typed against `TCollectionSlug` when supplied. */
  data: DocumentByResourceSlug<TCollectionSlug>;
  /**
   * The value at this field's parent path — the whole document for a
   * top-level field, one array item or block item for a nested field. Not
   * narrowed by `TCollectionSlug` — its shape varies with nesting depth in a
   * way the collection's own document type cannot describe in general.
   */
  siblingData: Record<string, unknown>;
}

/**
 * A pure predicate deciding whether a field is shown and validated. Runs
 * identically on the client (reactive visibility) and the server (skips
 * `required`/`validate()` when false) — collection files are part of the
 * browser bundle (ADR-013). A condition that throws counts as met (`true`) —
 * a failing condition must be visible, never a silent validation skip.
 *
 * Exported as a standalone named type for authoring a condition function
 * separately from a field factory call (`const cond: FieldCondition<typeof
 * TABLE_SLUG_PAGES> = ({ data }) => …`); every `admin.condition` property
 * itself is declared via method shorthand (not this type) for bivariant
 * checking — see `baseTypes.ts`'s `FieldAdminConfigInput`.
 */
export type FieldCondition<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> = (props: FieldConditionProps<TCollectionSlug>) => boolean;

/**
 * Hoists the data-field keys a single `tabs()`/`collapsible()`/`row()`/`ui()`
 * entry contributes once `getDataFields` flattens it: `ui()` contributes no
 * key; `collapsible()`/`row()` contribute their nested fields' OWN hoisted
 * keys (recursively — one more level of nesting is legal); a `tabs()` entry
 * contributes, per tab, either the tab's own `name` (a named tab becomes one
 * group-shaped data field) or its nested fields' hoisted keys (an unnamed
 * tab hoists).
 */
type HoistedKeysOf<TField> = TField extends { type: "ui" }
  ? never
  : TField extends {
        type: "tabs";
        tabs: infer TTabs extends readonly {
          name?: string;
          fields: Record<string, unknown>;
        }[];
      }
    ? {
        [I in keyof TTabs]: TTabs[I] extends { name: string }
          ? TTabs[I]["name"]
          : TTabs[I] extends { fields: infer TTabFields }
            ? DataFieldSlug<TTabFields>
            : never;
      }[number]
    : TField extends { type: "row" | "collapsible"; fields: infer TInnerFields }
      ? DataFieldSlug<TInnerFields>
      : never;

/**
 * The union of data-field keys a top-level `fields` record resolves to once
 * `getDataFields` flattens it — what `useAsTitle`, `indexes[].fields`, and
 * every access-field-map key should be typed against instead of
 * `keyof TFields` (which also contains `tabs()`/`collapsible()`/`row()`/
 * `ui()`'s own OWN top-level keys, not data keys).
 *
 * @example
 * ```ts
 * type Keys = DataFieldSlug<{
 *   info: { type: "tabs"; tabs: readonly [
 *     { label: "Content"; fields: { title: TextField } },
 *     { label: "SEO"; name: "seo"; fields: { metaTitle: TextField } },
 *   ] };
 *   published: CheckboxField;
 * }>;
 * // "title" | "seo" | "published" — never "info"
 * ```
 */
export type DataFieldSlug<TFields> = Extract<
  {
    [K in keyof TFields]: TFields[K] extends { type: "ui" }
      ? never
      : TFields[K] extends { type: "tabs" | "row" | "collapsible" }
        ? HoistedKeysOf<TFields[K]>
        : K;
  }[keyof TFields],
  string
>;
