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
  EmailFieldInput,
  EmailFieldCell,
  TextareaFieldInput,
  TextareaFieldCell,
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
  RichTextFieldInput,
  RichTextFieldCell,
  JsonFieldInput,
  JsonFieldCell,
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
 * Built lazily behind a `Proxy`, not as a plain `const`: `./fields/registry.ts`
 * (via `slots/resolveFieldInputComponent.tsx` → `form/RenderFields.tsx` →
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
        input: TextFieldInput,
        cell: TextFieldCell,
      },
      [ADMIN_FIELDS.email.type]: {
        input: EmailFieldInput,
        cell: EmailFieldCell,
      },
      [ADMIN_FIELDS.textarea.type]: {
        input: TextareaFieldInput,
        cell: TextareaFieldCell,
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
      [ADMIN_FIELDS.richtext.type]: {
        input: RichTextFieldInput,
        cell: RichTextFieldCell,
      },
      [ADMIN_FIELDS.json.type]: {
        input: JsonFieldInput,
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
