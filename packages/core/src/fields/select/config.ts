import { SelectFieldMeta, SelectFieldOptions, GenericVexField } from "../../types";

export function select<T extends string = string>(
  options: SelectFieldOptions<T> & { hasMany: true },
): GenericVexField<T[], SelectFieldMeta<T>>;

export function select<T extends string = string>(
  options: SelectFieldOptions<T> & { hasMany?: false },
): GenericVexField<T, SelectFieldMeta<T>>;

export function select<T extends string = string>(
  options: SelectFieldOptions<T>,
): GenericVexField<T | T[], SelectFieldMeta> {
  return {
    _type: options.hasMany ? [] : ("" as T),
    _meta: {
      type: "select",
      ...options,
    },
  };
}
