import type {
  UploadFieldMeta,
  UploadFieldOptions,
  GenericVexField,
} from "../../types";

export function upload(
  options: UploadFieldOptions & { hasMany: true },
): GenericVexField<string[], UploadFieldMeta>;

export function upload(
  options: UploadFieldOptions & { hasMany?: false },
): GenericVexField<string, UploadFieldMeta>;

export function upload(
  options: UploadFieldOptions,
): GenericVexField<string | string[], UploadFieldMeta> {
  return {
    _type: options.hasMany ? [] : "",
    _meta: {
      type: "upload",
      ...options,
    },
  };
}
