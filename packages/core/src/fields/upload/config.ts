import { ADMIN_FIELDS } from "../constants";
import { BaseFieldMeta } from "../types";
import type { UploadFieldInput, UploadField } from "./types";

/**
 * Creates an upload field that stores a reference to a media document.
 *
 * The `to` parameter specifies which media collection receives uploaded files.
 * At config validation time, the `to` slug is checked against the media
 * collections returned by all configured storage adapters.
 *
 * @param options — Upload field configuration. `to` is required.
 * @returns Resolved upload field definition.
 *
 * @throws {Error} If `to` is empty or not a valid slug (`/^[a-zA-Z][a-zA-Z0-9_-]*$/`).
 *
 * @example
 * ```ts
 * defineCollection({
 *   fields: {
 *     featuredImage: upload({ to: "images", label: "Featured Image" }),
 *   },
 * });
 */
export function upload<TFieldMeta extends BaseFieldMeta = BaseFieldMeta>(
  options: UploadFieldInput<TFieldMeta>,
): UploadField<TFieldMeta> {
  if (!options.to || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.to)) {
    throw new Error(`upload(): "to" must be a valid collection slug. Got "${options.to}".`);
  }

  return {
    label: "",
    required: false,
    hasMany: false,
    min: 0,
    accept: "",
    ...options,
    type: ADMIN_FIELDS.upload.type,
    interfaceType: ADMIN_FIELDS.upload.interfaceType,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "full",
      cellAlignment: "left",
      placeholder: "",
      ...options.admin,
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
