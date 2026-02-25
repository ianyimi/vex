import { SelectFieldMeta, SelectFieldOptions, VexField } from "../types";

export function select<T extends string = string>(
  options: SelectFieldOptions<T> & { hasMany: true },
): VexField<T[], SelectFieldMeta<T>>;

export function select<T extends string = string>(
  options: SelectFieldOptions<T> & { hasMany?: false },
): VexField<T, SelectFieldMeta<T>>;

export function select<T extends string = string>(
  options: SelectFieldOptions<T>,
): VexField<T | T[], SelectFieldMeta> {
  return {
    _type: options.hasMany ? [] : ("" as T),
    _meta: {
      type: "select",
      ...options,
    },
  };
}
