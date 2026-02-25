import { CheckboxFieldMeta, CheckboxFieldOptions, VexField } from "../types";

export function checkbox(
  options?: CheckboxFieldOptions,
): VexField<boolean, CheckboxFieldMeta> {
  return {
    _type: false,
    _meta: {
      type: "checkbox",
      ...options,
    },
  };
}
