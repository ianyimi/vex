import { DateFieldMeta, DateFieldOptions, GenericVexField } from "../../types";

export function date(
  options?: DateFieldOptions,
): GenericVexField<number, DateFieldMeta> {
  return {
    _type: 0,
    _meta: {
      type: "date",
      defaultValue: options?.required ? 0 : undefined,
      ...options,
      formDefaultValue: options?.defaultValue ?? 0,
    },
  };
}
