import { ADMIN_FIELDS, upload } from "@vexcms/core";
import type { UploadField } from "@vexcms/core";
import type { FieldFixture } from "../../../testing/fixtures/types";

/**
 * Builds a `File` for upload-field tests. The byte payload is a fixed stub —
 * `UploadFieldInput`'s dropzone and `MediaUploadForm`'s staging list only
 * ever read `File.name`/`File.type`, never the bytes.
 *
 * @param name — File name, e.g. `"cover.png"`.
 * @param type — MIME type. Defaults to `"image/png"`.
 * @returns A `File` usable as `fireEvent.change`'s `target.files` entry.
 */
export function makeFile(name: string, type = "image/png"): File {
  return new File(["stub-file-content"], name, { type });
}

/**
 * Fixture for `UploadField` — the stored value is `string[]` of resolved
 * media-document ids. `hasMany: true` + `max: 3` exercises the multi-file
 * path; `required: true` makes `invalid` (`undefined`) a real validation
 * failure instead of a no-op.
 */
export const uploadFieldFixture: FieldFixture<UploadField, string[]> = {
  fieldType: ADMIN_FIELDS.upload.type,
  fieldDef: upload({
    to: "images",
    label: "Cover Images",
    required: true,
    hasMany: true,
    max: 3,
    accept: "image/*",
  }),
  valid: ["images_1", "images_2"],
  invalid: undefined,
  empty: undefined,
};
