import { ADMIN_FIELDS, FIELD_SCHEMA_VALIDATORS } from "../constants";
import { BaseFieldMeta } from "../types";
import { resolveFieldLimit, resolveFieldComponents } from "../utils";
import type { VexResourceSlug } from "../../types/generated";
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
export function upload<
  TCollectionSlug extends VexResourceSlug = VexResourceSlug,
  TFieldKey extends string = never,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
  THasMany extends boolean = boolean,
>(
  options: UploadFieldInput<TCollectionSlug, TFieldKey, TFieldMeta, THasMany>,
): UploadField<TCollectionSlug, TFieldMeta> {
  if (!options.to || !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(options.to)) {
    throw new Error(`upload(): "to" must be a valid collection slug. Got "${options.to}".`);
  }

  const schema =
    options.schema?.validator !== undefined
      ? { validator: options.schema.validator }
      : undefined;
  return {
    label: "",
    required: false,
    nullable: false,
    hasMany: false,
    accept: "",
    ...options,
    schema,
    min: resolveFieldLimit({
      limit: options.min,
      defaultError: (value) =>
        `Must be at least ${value} file${value === 1 ? "" : "s"}.`,
    }),
    max: resolveFieldLimit({
      limit: options.max,
      defaultError: (value) =>
        `Must be no more than ${value} file${value === 1 ? "" : "s"}.`,
    }),
    type: ADMIN_FIELDS.upload.type,
    interfaceType:
      options.schema?.validator === FIELD_SCHEMA_VALIDATORS.id
        ? `Id<"${options.to}">`
        : options.schema?.validator === FIELD_SCHEMA_VALIDATORS.string
          ? "string"
          : `Id<"${options.to}">[]`,
    admin: {
      hidden: false,
      readOnly: false,
      position: "main",
      width: "100%",
      cellAlignment: "left",
      enableSorting: false,
      enableHiding: true,
      placeholder: "",
      ...options.admin,
      components: resolveFieldComponents({ components: options.admin?.components }),
    },
    meta: {
      ...options.meta,
    } as TFieldMeta,
  };
}
