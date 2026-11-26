import { ADMIN_FIELDS, bytes, type BytesField } from "@vexcms/core";
import type { FieldFixture } from "../../testing/fixtures/types";

/**
 * Builds a fixture `ArrayBuffer` of `byteLength` bytes, filled `0, 1, 2, …`
 * (mod 256) so tests can assert on its exact hex representation.
 *
 * @param byteLength - The buffer's length.
 * @returns The populated `ArrayBuffer`.
 */
function makeBuffer(byteLength: number): ArrayBuffer {
  const buffer = new ArrayBuffer(byteLength);
  const view = new Uint8Array(buffer);
  for (let index = 0; index < byteLength; index += 1) {
    view[index] = index % 256;
  }
  return buffer;
}

/**
 * `bytes` field fixture — drives `runFieldInputContractSuite` in
 * `fields/bytes/Field.test.tsx` and `runFieldCellContractSuite` in
 * `Cell.test.tsx`. `valid` is a 4-byte buffer (`00 01 02 03`); the base
 * contract's generic `setControlValue` no-ops on this field's file input
 * (file inputs are never driven generically — see `fieldInputContract.ts`),
 * so the field-specific File/Hex interactions live in this field's own
 * `extra` tests instead.
 */
export const bytesFieldFixture: FieldFixture<BytesField, ArrayBuffer | undefined> = {
  fieldType: ADMIN_FIELDS.bytes.type,
  fieldDef: bytes({ label: "Payload", required: true }),
  valid: makeBuffer(4),
  invalid: undefined,
  empty: undefined,
};
