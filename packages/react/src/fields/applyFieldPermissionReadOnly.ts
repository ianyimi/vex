import {
  isFieldAllowed,
  type AdminField,
  type ResolvedFieldPermissions,
} from "@vexcms/core";

/**
 * Forces `admin.readOnly: true` on a single field, preserving its exact
 * `AdminField` union member (e.g. `TextField` stays `TextField`) — spreading
 * onto a plain `AdminField`-typed parameter/return would widen a
 * discriminated-union member back to the full union, losing its `type`-keyed
 * narrowing for every caller downstream. Mirrors the narrowing-preserving
 * generic shape of `resolveFieldLimit`'s per-field transform in
 * `packages/core/src/fields/utils.ts`.
 *
 * @param field - The field to force read-only.
 * @returns A copy of `field` with `admin.readOnly` set to `true`.
 */
function withReadOnly<T extends AdminField>(field: T): T {
  return { ...field, admin: { ...field.admin, readOnly: true } };
}

/**
 * Forces `admin.readOnly: true` on every field `fieldPermissions` denies
 * write access to, leaving every other field's own `admin.readOnly`
 * untouched. A `kind: "ui"` field has no write permission of its own — left
 * as-is (`isFieldAllowed` is a data-field-oriented permission check and a
 * `tabs`/`collapsible`/`row`/`ui` field's own key is never a permission key).
 *
 * `RenderFields`'s own `readOnly` prop is one flat boolean OR'd onto every
 * field uniformly — it has no per-field channel, unlike the field loops it
 * replaced (`CollectionEditView`/`GlobalEditView`/`MediaCollectionEditView`
 * each read `!isFieldAllowed(fieldPermissions, fieldKey)` per field). Baking
 * the per-field denial into the field map before it reaches `RenderFields`
 * keeps that behavior without widening `RenderFields`'s contracted signature.
 *
 * @param props.fields - The field map to merge permission-driven read-only into.
 * @param props.fieldPermissions - The resolved write permissions to apply.
 * @returns A new field map; fields the caller may write are returned as-is.
 */
export function applyFieldPermissionReadOnly(props: {
  fields: Record<string, AdminField>;
  fieldPermissions: ResolvedFieldPermissions;
}): Record<string, AdminField> {
  const result: Record<string, AdminField> = {};
  for (const [fieldKey, fieldDef] of Object.entries(props.fields)) {
    result[fieldKey] = isFieldAllowed(props.fieldPermissions, fieldKey)
      ? fieldDef
      : withReadOnly(fieldDef);
  }
  return result;
}
