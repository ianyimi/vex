import { ArrayFieldMeta, ArrayFieldOptions, GenericVexField } from "../../types";

export function array(
  options: ArrayFieldOptions,
): GenericVexField<unknown[], ArrayFieldMeta> {
  return {
    _type: [],
    _meta: {
      type: "array",
      ...options,
    },
  };
}
