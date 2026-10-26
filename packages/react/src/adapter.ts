import {
  ADMIN_FIELDS,
  CollectionFieldMeta,
  defineFrameworkAdapter,
  type ComponentHKT,
  type FrameworkAdapterInput,
} from "@vexcms/core";
import type { ComponentType } from "react";

import {
  TextFieldAdmin,
  TextFieldCell,
  EmailFieldAdmin,
  EmailFieldCell,
  TextareaFieldAdmin,
  TextareaFieldCell,
  NumberFieldCell,
  NumberFieldAdmin,
  CheckboxFieldAdmin,
  CheckboxFieldCell,
  SelectFieldAdmin,
  SelectFieldCell,
  UrlFieldAdmin,
  UrlFieldCell,
  ColorFieldAdmin,
  ColorFieldCell,
  RelationshipFieldAdmin,
  RelationshipFieldCell,
  DateFieldCell,
  DateFieldAdmin,
  ArrayFieldCell,
  ArrayFieldAdmin,
  GroupFieldCell,
  GroupFieldAdmin,
  BlocksFieldAdmin,
  BlocksFieldCell,
  UploadFieldAdmin,
  UploadFieldCell,
  RichTextFieldAdmin,
  RichTextFieldCell,
  JsonFieldAdmin,
  JsonFieldCell,
} from "./fields";
import { CollectionEditView, CollectionListView } from "./collections";
import { DashboardView } from "./admin";

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
 * Built lazily behind a `Proxy`, not as a plain `const`: `./fields/registry.ts`
 * (via `slots/resolveFieldComponent.tsx` → `fields/RenderFields.tsx` →
 * `form/FormGroup.tsx`/`form/FormBlocks.tsx`, step 11) is reachable from this
 * module's own `"./components"` import — a genuine circular dependency. A
 * plain `const` assignment leaves `reactAdapter` captured as `undefined` by
 * that circular re-entry until this module's top-level body finishes, and
 * some bundler/test-runner module-interop paths snapshot that `undefined`
 * instead of live-updating it. Deferring the `defineFrameworkAdapter(...)`
 * call itself until the first property read (always well after the whole
 * module graph has finished loading, at actual render/call time) sidesteps
 * the timing hazard entirely — every caller still sees a plain object.
 *
 * @see {@link defineFrameworkAdapter} in `@vexcms/core`
 * @returns The framework adapter input registering every field's input/cell
 *   components and the admin views.
 */
function buildReactAdapter(): FrameworkAdapterInput<ReactHKT> {
  return defineFrameworkAdapter<ReactHKT, CollectionFieldMeta>({
    name: "react",
    version: "0.1.0-alpha.1",
    fields: {
      [ADMIN_FIELDS.text.type]: {
        field: TextFieldAdmin,
        cell: TextFieldCell,
      },
      [ADMIN_FIELDS.email.type]: {
        field: EmailFieldAdmin,
        cell: EmailFieldCell,
      },
      [ADMIN_FIELDS.textarea.type]: {
        field: TextareaFieldAdmin,
        cell: TextareaFieldCell,
      },
      [ADMIN_FIELDS.number.type]: {
        field: NumberFieldAdmin,
        cell: NumberFieldCell,
      },
      [ADMIN_FIELDS.checkbox.type]: {
        field: CheckboxFieldAdmin,
        cell: CheckboxFieldCell,
      },
      [ADMIN_FIELDS.date.type]: {
        field: DateFieldAdmin,
        cell: DateFieldCell,
      },
      [ADMIN_FIELDS.select.type]: {
        field: SelectFieldAdmin,
        cell: SelectFieldCell,
      },
      [ADMIN_FIELDS.url.type]: {
        field: UrlFieldAdmin,
        cell: UrlFieldCell,
      },
      [ADMIN_FIELDS.color.type]: {
        field: ColorFieldAdmin,
        cell: ColorFieldCell,
      },
      [ADMIN_FIELDS.relationship.type]: {
        field: RelationshipFieldAdmin,
        cell: RelationshipFieldCell,
      },
      [ADMIN_FIELDS.array.type]: {
        field: ArrayFieldAdmin,
        cell: ArrayFieldCell,
      },
      [ADMIN_FIELDS.group.type]: {
        field: GroupFieldAdmin,
        cell: GroupFieldCell,
      },
      [ADMIN_FIELDS.blocks.type]: {
        field: BlocksFieldAdmin,
        cell: BlocksFieldCell,
      },
      [ADMIN_FIELDS.upload.type]: {
        field: UploadFieldAdmin,
        cell: UploadFieldCell,
      },
      [ADMIN_FIELDS.richtext.type]: {
        field: RichTextFieldAdmin,
        cell: RichTextFieldCell,
      },
      [ADMIN_FIELDS.json.type]: {
        field: JsonFieldAdmin,
        cell: JsonFieldCell,
      },
    },
    views: {
      dashboard: DashboardView,
      collectionEditView: CollectionEditView,
      collectionListView: CollectionListView,
    },
  });
}

let builtReactAdapter: FrameworkAdapterInput<ReactHKT> | undefined;

/**
 * The React framework adapter singleton. Lazily built on first property
 * access via `buildReactAdapter` (see its own doc comment for why), then
 * cached — every subsequent access reads the same built object.
 */
export const reactAdapter: FrameworkAdapterInput<ReactHKT> = new Proxy(
  {} as FrameworkAdapterInput<ReactHKT>,
  {
    get(_target, prop, receiver) {
      builtReactAdapter ??= buildReactAdapter();
      return Reflect.get(builtReactAdapter, prop, receiver);
    },
  },
);

/** Resolved type of the React adapter, for use in consuming code. */
export type ReactAdapter = typeof reactAdapter;
