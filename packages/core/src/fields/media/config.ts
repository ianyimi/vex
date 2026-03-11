import type {
  UploadFieldMeta,
  UploadFieldOptions,
  GenericVexField,
} from "../../types";

export function upload<TSlug extends string>(
  options: UploadFieldOptions<TSlug> & { hasMany: true },
): GenericVexField<string[], UploadFieldMeta>;

export function upload<TSlug extends string>(
  options: UploadFieldOptions<TSlug> & { hasMany?: false },
): GenericVexField<string, UploadFieldMeta>;

export function upload<TSlug extends string>(
  options: UploadFieldOptions<TSlug>,
): GenericVexField<string | string[], UploadFieldMeta> {
  return {
    _type: options.hasMany ? [] : "",
    _meta: {
      type: "upload",
      ...options,
    },
  };
}
