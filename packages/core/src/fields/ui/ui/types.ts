import type { DocumentByResourceSlug, VexResourceSlug } from "../../../types/generated";
import type {
  ApplyComponent,
  BaseUIField,
  BaseUIFieldInput,
  ComponentHKT,
  UIFieldAdminConfig,
  UIFieldAdminInput,
} from "../../baseTypes";

/** Props passed to a `ui()` field's `Field` component. */
export interface UIFieldComponentProps<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> {
  /** This field's own key in the parent `fields` record. */
  name: string;
  /** The whole document currently being edited, typed against `TCollectionSlug` when supplied. */
  data: DocumentByResourceSlug<TCollectionSlug>;
  /** The value at this field's parent path — see `FieldConditionProps.siblingData`. */
  siblingData: Record<string, unknown>;
  readOnly: boolean;
}

/** Props passed to a `ui()` field's optional `Cell` component. */
export interface UIFieldCellProps<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
> {
  /** This field's own key in the parent `fields` record. */
  name: string;
  /** The document the list-view row renders, typed against `TCollectionSlug` when supplied. */
  data: DocumentByResourceSlug<TCollectionSlug>;
}

/**
 * Configuration input for a `ui()` field — a UI-only field (no stored
 * value) that renders a fully custom `Field` (and optional `Cell`) component.
 */
export interface UIFieldInput<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TComponent extends ComponentHKT = ComponentHKT,
> extends BaseUIFieldInput<TCollectionSlug, TFieldMeta> {
  admin: UIFieldAdminInput<TCollectionSlug> & {
    components: {
      /** Rendered in the admin edit form at this field's position. */
      Field: ApplyComponent<TComponent, UIFieldComponentProps<TCollectionSlug>>;
      /** When set, the list view shows a column rendering this. Omit to show no column. */
      Cell?: ApplyComponent<TComponent, UIFieldCellProps<TCollectionSlug>>;
    };
  };
}

/**
 * Resolved `ui()` field definition after defaults are applied.
 */
export interface UIField<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldMeta extends {} = {},
  TComponent extends ComponentHKT = ComponentHKT,
> extends BaseUIField<TCollectionSlug, TFieldMeta> {
  readonly type: "ui";
  admin: UIFieldAdminConfig<TCollectionSlug> & {
    components: {
      Field: ApplyComponent<TComponent, UIFieldComponentProps<TCollectionSlug>>;
      Cell?: ApplyComponent<TComponent, UIFieldCellProps<TCollectionSlug>>;
    };
  };
}
