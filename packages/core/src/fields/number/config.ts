import { NumberFieldMeta, NumberFieldOptions, GenericVexField } from "../../types";

export function number(
  options?: NumberFieldOptions,
): GenericVexField<number, NumberFieldMeta> {
  return {
    _type: 0,
    _meta: {
      type: "number",
      defaultValue: options?.required ? 0 : undefined,
      ...options,
      formDefaultValue: options?.defaultValue ?? 0,
    },
  };
}
