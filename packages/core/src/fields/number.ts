import { NumberFieldMeta, NumberFieldOptions, VexField } from "../types";

export function number(
  options?: NumberFieldOptions,
): VexField<number, NumberFieldMeta> {
  return {
    _type: 0,
    _meta: {
      type: "number",
      ...options,
    },
  };
}
