import { CheckboxFieldMeta, CheckboxFieldOptions, GenericVexField } from "../../types";

export function checkbox(
  options?: CheckboxFieldOptions,
): GenericVexField<boolean, CheckboxFieldMeta> {
  return {
    _type: false,
    _meta: {
      type: "checkbox",
      defaultValue: options?.required ? false : undefined,
      ...options,
    },
  };
}
