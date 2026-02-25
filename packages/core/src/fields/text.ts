import { TextFieldMeta, TextFieldOptions, VexField } from "../types";

export function text(
  options?: TextFieldOptions,
): VexField<string, TextFieldMeta> {
  return {
    _type: "",
    _meta: {
      type: "text",
      ...options,
    },
  };
}
