import {
  ADMIN_FIELDS,
  CollectionFieldMeta,
  defineFrameworkAdapter,
  type ComponentHKT,
  type FrameworkAdapterInput,
} from "@vexcms/core";
import type { ComponentType } from "react";

import {
  TextFieldInput,
  TextFieldCell,
  NumberFieldCell,
  NumberFieldInput,
  CheckboxFieldInput,
  CheckboxFieldCell,
  SelectFieldInput,
  SelectFieldCell,
  UrlFieldInput,
  UrlFieldCell,
  ColorFieldInput,
  ColorFieldCell,
  CollectionEditView,
  CollectionListView,
  DashboardView,
  RelationshipFieldInput,
  RelationshipFieldCell,
  DateFieldCell,
  DateFieldInput,
  ArrayFieldCell,
  ArrayFieldInput,
  GroupFieldCell,
  GroupFieldInput,
  BlocksFieldInput,
  BlocksFieldCell,
  UploadFieldInput,
  UploadFieldCell,
} from "./components";

/**
 * HKT for React — maps any props type to `ComponentType<P>`.
 *
 * Passed to `defineFrameworkAdapter<ReactHKT>` so every slot in `fields`
 * and `cells` resolves to `ComponentType<CorrectProps>`, giving full
 * prop autocomplete inside each component.
 *
 * @see {@link ComponentHKT} in `@vexcms/core` for the base interface
 */
export interface ReactHKT extends ComponentHKT {
  component: ComponentType<this["_props"]>;
}

/**
 * React framework adapter for VexCMS.
 *
 * Registers all field input and cell components. TypeScript enforces via
 * `ReactHKT` that:
 * - Every type in the `AdminField` union has both an input and cell component
 * - Each component accepts the correct props for its field type
 *
 * Adding a new field type to `AdminField` automatically causes a type error
 * here until a component is added for it.
 *
 * @see {@link defineFrameworkAdapter} in `@vexcms/core`
 */
export const reactAdapter: FrameworkAdapterInput<ReactHKT> = defineFrameworkAdapter<
  ReactHKT,
  CollectionFieldMeta
>({
  name: "react",
  version: "0.1.0-alpha.1",
  fields: {
    [ADMIN_FIELDS.text.type]: {
      input: TextFieldInput,
      cell: TextFieldCell,
    },
    [ADMIN_FIELDS.number.type]: {
      input: NumberFieldInput,
      cell: NumberFieldCell,
    },
    [ADMIN_FIELDS.checkbox.type]: {
      input: CheckboxFieldInput,
      cell: CheckboxFieldCell,
    },
    [ADMIN_FIELDS.date.type]: {
      input: DateFieldInput,
      cell: DateFieldCell,
    },
    [ADMIN_FIELDS.select.type]: {
      input: SelectFieldInput,
      cell: SelectFieldCell,
    },
    [ADMIN_FIELDS.url.type]: {
      input: UrlFieldInput,
      cell: UrlFieldCell,
    },
    [ADMIN_FIELDS.color.type]: {
      input: ColorFieldInput,
      cell: ColorFieldCell,
    },
    [ADMIN_FIELDS.relationship.type]: {
      input: RelationshipFieldInput,
      cell: RelationshipFieldCell,
    },
    [ADMIN_FIELDS.array.type]: {
      input: ArrayFieldInput,
      cell: ArrayFieldCell,
    },
    [ADMIN_FIELDS.group.type]: {
      input: GroupFieldInput,
      cell: GroupFieldCell,
    },
    [ADMIN_FIELDS.blocks.type]: {
      input: BlocksFieldInput,
      cell: BlocksFieldCell,
    },
    [ADMIN_FIELDS.upload.type]: {
      input: UploadFieldInput,
      cell: UploadFieldCell,
    },
  },
  views: {
    dashboard: DashboardView,
    collectionEditView: CollectionEditView,
    collectionListView: CollectionListView,
  },
});

/** Resolved type of the React adapter, for use in consuming code. */
export type ReactAdapter = typeof reactAdapter;
