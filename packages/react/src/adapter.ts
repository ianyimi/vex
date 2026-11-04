import {
  ADMIN_FIELDS,
  CollectionFieldMeta,
  defineFrameworkAdapter,
  type ComponentHKT,
  type CommitTsField,
  type FilterInputProps,
  type FrameworkAdapterInput,
  type VexResourceSlug,
} from "@vexcms/core";
import type { ComponentType } from "react";

import {
  TextFieldAdmin,
  TextFieldCell,
  TextFieldDisplay,
  TextFilterInput,
  EmailFieldAdmin,
  EmailFieldCell,
  EmailFilterInput,
  TextareaFieldAdmin,
  TextareaFieldCell,
  TextareaFieldDisplay,
  TextareaFilterInput,
  NumberFieldCell,
  NumberFieldAdmin,
  NumberFilterInput,
  CheckboxFieldAdmin,
  CheckboxFieldCell,
  CheckboxFilterInput,
  SelectFieldAdmin,
  SelectFieldCell,
  SelectFilterInput,
  UrlFieldAdmin,
  UrlFieldCell,
  UrlFilterInput,
  ColorFieldAdmin,
  ColorFieldCell,
  ColorFilterInput,
  RelationshipFieldAdmin,
  RelationshipFieldCell,
  RelationshipFieldDisplay,
  RelationshipFilterInput,
  DateFieldCell,
  DateFieldAdmin,
  DateFilterInput,
  CommitTsFieldCell,
  CommitTsFieldAdmin,
  ArrayFieldCell,
  ArrayFieldAdmin,
  ArrayFieldDisplay,
  GroupFieldCell,
  GroupFieldAdmin,
  GroupFieldDisplay,
  BlocksFieldAdmin,
  BlocksFieldCell,
  BlocksFieldDisplay,
  UploadFieldAdmin,
  UploadFieldCell,
  UploadFieldDisplay,
  UploadFilterInput,
  RichTextFieldAdmin,
  RichTextFieldCell,
  RichTextFieldDisplay,
  JsonFieldAdmin,
  JsonFieldCell,
  JsonFieldDisplay,
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
        display: TextFieldDisplay,
        filterInput: TextFilterInput,
      },
      [ADMIN_FIELDS.email.type]: {
        field: EmailFieldAdmin,
        cell: EmailFieldCell,
        filterInput: EmailFilterInput,
      },
      [ADMIN_FIELDS.textarea.type]: {
        field: TextareaFieldAdmin,
        cell: TextareaFieldCell,
        display: TextareaFieldDisplay,
        filterInput: TextareaFilterInput,
      },
      [ADMIN_FIELDS.number.type]: {
        field: NumberFieldAdmin,
        cell: NumberFieldCell,
        filterInput: NumberFilterInput,
      },
      [ADMIN_FIELDS.checkbox.type]: {
        field: CheckboxFieldAdmin,
        cell: CheckboxFieldCell,
        filterInput: CheckboxFilterInput,
      },
      [ADMIN_FIELDS.date.type]: {
        field: DateFieldAdmin,
        cell: DateFieldCell,
        filterInput: DateFilterInput,
      },
      [ADMIN_FIELDS.commitTs.type]: {
        field: CommitTsFieldAdmin,
        cell: CommitTsFieldCell,
        // Reuses the shared date `DateTimePicker` filter
        // control directly — identical ms-value behavior, no commitTs-specific
        // body to maintain (`commitTs/FilterInput.tsx` deleted). Cast needed:
        // `DateFilterInput` is typed to `FilterInputProps<DateField>` (never
        // reads `props.field`, only `value`/`onChange`/`disabled`), so it is
        // runtime-safe for any ms-value field but not structurally assignable
        // to the `CommitTsField`-narrowed slot the adapter's HKT expects here.
        // `VexResourceSlug` (not a literal `string`) as the generic arg: an
        // app's generated types narrow `VexResourceSlug` itself to a union of
        // its own real collection/global slugs, so `string` stops satisfying
        // `CommitTsField`'s `TCollectionSlug extends VexResourceSlug`
        // constraint under that augmentation — `VexResourceSlug` always
        // satisfies itself, in every app, augmented or not.
        filterInput: DateFilterInput as unknown as ComponentType<
          FilterInputProps<CommitTsField<VexResourceSlug, CollectionFieldMeta>>
        >,
      },
      [ADMIN_FIELDS.select.type]: {
        field: SelectFieldAdmin,
        cell: SelectFieldCell,
        filterInput: SelectFilterInput,
      },
      [ADMIN_FIELDS.url.type]: {
        field: UrlFieldAdmin,
        cell: UrlFieldCell,
        filterInput: UrlFilterInput,
      },
      [ADMIN_FIELDS.color.type]: {
        field: ColorFieldAdmin,
        cell: ColorFieldCell,
        filterInput: ColorFilterInput,
      },
      [ADMIN_FIELDS.relationship.type]: {
        field: RelationshipFieldAdmin,
        cell: RelationshipFieldCell,
        display: RelationshipFieldDisplay,
        filterInput: RelationshipFilterInput,
      },
      [ADMIN_FIELDS.array.type]: {
        field: ArrayFieldAdmin,
        cell: ArrayFieldCell,
        display: ArrayFieldDisplay,
      },
      [ADMIN_FIELDS.group.type]: {
        field: GroupFieldAdmin,
        cell: GroupFieldCell,
        display: GroupFieldDisplay,
      },
      [ADMIN_FIELDS.blocks.type]: {
        field: BlocksFieldAdmin,
        cell: BlocksFieldCell,
        display: BlocksFieldDisplay,
      },
      [ADMIN_FIELDS.upload.type]: {
        field: UploadFieldAdmin,
        cell: UploadFieldCell,
        display: UploadFieldDisplay,
        filterInput: UploadFilterInput,
      },
      [ADMIN_FIELDS.richtext.type]: {
        field: RichTextFieldAdmin,
        cell: RichTextFieldCell,
        display: RichTextFieldDisplay,
      },
      [ADMIN_FIELDS.json.type]: {
        field: JsonFieldAdmin,
        cell: JsonFieldCell,
        display: JsonFieldDisplay,
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
