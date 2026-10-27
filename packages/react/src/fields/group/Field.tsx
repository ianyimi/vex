"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import type { GroupField as GroupFieldDef } from "@vexcms/core";
import type { FieldComponentProps } from "@vexcms/core";
import { GroupField, useFieldContext } from "../../forms";
import { RenderFields } from "../RenderFields";
import { AdminFieldBinding } from "../AdminFieldBinding";

/**
 * The group admin field's own render body — reads the `FieldApi` provided
 * by the enclosing `AdminFieldBinding` via `useFieldContext()` (only to
 * bind the accordion to the field's own form path) and maps `fieldDef.fields`
 * onto the app form's `GroupField` fieldset layout, rendering the group's
 * own fields through `RenderFields` as `children`. Wrapped in its own
 * `role="group" aria-disabled` element — `GroupField` itself sets
 * `aria-labelledby` on its accordion but never forwards a readOnly signal
 * of its own, unlike `ArrayField`/`BlocksField` — so this wraps one, same
 * `[role="group"][aria-labelledby]` contract every container field
 * exposes to the field-input-contract test harness.
 *
 * @param props - {@link FieldComponentProps} narrowed to `GroupField`, for this item's own level of nesting.
 * @returns The group's `GroupField` body, wrapped in a labelled group.
 */
function GroupFieldAdminInner(props: FieldComponentProps<{}, GroupFieldDef>) {
  useFieldContext();
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  return (
    <div role="group" aria-labelledby={`${props.name}-label`} aria-disabled={readOnly}>
      <GroupField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        index={props.index}
        fieldCount={Object.keys(props.fieldDef.fields).length}
        defaultOpen={!props.fieldDef.admin.defaultCollapsed}
      >
        <RenderFields
          fields={props.fieldDef.fields}
          collection={props.collection}
          namePrefix={props.name}
          readOnly={readOnly}
        />
      </GroupField>
    </div>
  );
}

/**
 * Group admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders the app
 * form's `GroupField` fieldset layout wrapping this group's rendered child
 * fields.
 *
 * @param props - {@link FieldComponentProps} narrowed to `GroupField`.
 * @returns The app form's `GroupField`, wrapping this group's rendered child fields.
 */
export function GroupFieldAdmin(
  props: FieldComponentProps<{}, GroupFieldDef> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <GroupFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
