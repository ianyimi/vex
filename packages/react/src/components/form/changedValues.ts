import type { AnyFormApi } from "./AppFormContext";

/**
 * Whether the user has edited anything under a top-level field key.
 *
 * Reads TanStack's sticky `isDirty` base-meta flag, never the derived
 * `isDefaultValue` — the latter tracks the live `defaultValues`, so it
 * reports `true` for a field the SERVER changed and the user never touched,
 * which would re-introduce the exact clobber a diff submit exists to
 * prevent.
 *
 * Also checks any registered nested path beneath `key`, because a `group`
 * field's leaves register as `light.background` and the parent key carries
 * no meta of its own.
 *
 * @param form - The form instance.
 * @param key - Top-level field key.
 * @returns Whether `key`, or a nested path under it, has been edited.
 */
export function isFieldKeyDirty(form: AnyFormApi, key: string): boolean {
  const fieldMeta = form.state.fieldMeta;
  if (fieldMeta[key]?.isDirty === true) return true;

  const prefix = `${key}.`;
  return Object.keys(fieldMeta).some(
    (metaKey) => metaKey.startsWith(prefix) && fieldMeta[metaKey]?.isDirty === true,
  );
}

/**
 * The subset of `form.state.values` the user actually edited.
 *
 * Never a security boundary: the server re-derives the effective change set
 * against the stored document, so a client that sends everything, or lies,
 * is handled identically.
 *
 * @param form - The form instance.
 * @returns Only edited top-level keys. Empty when nothing was edited.
 */
export function changedValues(form: AnyFormApi): Record<string, unknown> {
  const values = form.state.values as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(values)) {
    if (isFieldKeyDirty(form, key)) {
      result[key] = values[key];
    }
  }
  return result;
}
