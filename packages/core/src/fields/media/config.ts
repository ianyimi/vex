import type { UploadFieldDef, UploadFieldSingle, UploadFieldMany } from "../../types";

export function upload(
  options: Omit<UploadFieldMany, "type">,
): UploadFieldDef;
export function upload(
  options: Omit<UploadFieldSingle, "type">,
): UploadFieldDef;
export function upload(
  options: Omit<UploadFieldSingle, "type"> | Omit<UploadFieldMany, "type">,
): UploadFieldDef {
  return { type: "upload", ...options } as UploadFieldDef;
}
