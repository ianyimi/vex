import { ImageUrlFieldMeta, ImageUrlFieldOptions, GenericVexField } from "../../types";

export function imageUrl(
  options?: ImageUrlFieldOptions,
): GenericVexField<string, ImageUrlFieldMeta> {
  return {
    _type: "",
    _meta: {
      type: "imageUrl",
      defaultValue: options?.required ? "" : undefined,
      ...options,
    },
  };
}
