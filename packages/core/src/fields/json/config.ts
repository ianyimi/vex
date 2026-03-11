import { JsonFieldMeta, JsonFieldOptions, GenericVexField } from "../../types";

export function json(
  options?: JsonFieldOptions,
): GenericVexField<unknown, JsonFieldMeta> {
  return {
    _type: undefined as unknown,
    _meta: {
      type: "json",
      ...options,
      formDefaultValue: {},
    },
  };
}
