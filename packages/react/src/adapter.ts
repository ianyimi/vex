import {
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
  CollectionEditView,
  CollectionListView,
  DashboardView,
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
export const reactAdapter: FrameworkAdapterInput<ReactHKT> =
  defineFrameworkAdapter<ReactHKT>({
    name: "react",
    version: "0.1.0-alpha.1",
    fields: {
      text: {
        input: TextFieldInput,
        cell: TextFieldCell,
      },
      number: {
        input: NumberFieldInput,
        cell: NumberFieldCell,
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
