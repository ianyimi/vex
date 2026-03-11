import { TextFieldMeta, TextFieldOptions, GenericVexField } from "../../types";

export function text(
  options?: TextFieldOptions,
): GenericVexField<string, TextFieldMeta> {
  return {
    _type: "",
    _meta: {
      type: "text",
      defaultValue: options?.required ? "" : undefined,
      ...options,
      formDefaultValue: options?.defaultValue ?? "",
    },
  };
}
