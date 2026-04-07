/**
 * Re-exports `TypedFieldApi` from `createFieldInput`.
 *
 * `FieldController` is no longer used — field input components receive a
 * `TypedFieldApi<TValue>` directly. This file exists for import compatibility.
 *
 * @deprecated Import `TypedFieldApi` from `./createFieldInput` directly.
 */
export type { TypedFieldApi } from "./createFieldInput";
