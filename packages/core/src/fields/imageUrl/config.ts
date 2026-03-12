import type { ImageUrlFieldDef } from "../../types";

export function imageUrl(options?: Omit<ImageUrlFieldDef, "type">): ImageUrlFieldDef {
  return {
    type: "imageUrl",
    ...(options?.required && options?.defaultValue === undefined
      ? { defaultValue: "" }
      : {}),
    ...options,
  };
}
