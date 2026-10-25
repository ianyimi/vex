import { ADMIN_FIELDS } from "../constants";

/**
 * Union of the field type strings `admin.mask` is available on — derived
 * from each entry's own `inputMasks: boolean` in {@link ADMIN_FIELDS}, so a
 * new maskable field type only needs that flag flipped to `true`.
 */
export type MaskableFieldType = {
  [K in keyof typeof ADMIN_FIELDS]: (typeof ADMIN_FIELDS)[K]["inputMasks"] extends true
    ? K
    : never;
}[keyof typeof ADMIN_FIELDS];

/**
 * User-facing `admin.mask` value — a bare `use-mask-input` mask string, an
 * array of alternative masks (whichever fits what the user types), or an
 * object carrying `storeMasked`/`options` alongside the mask.
 *
 * @example
 * ```ts
 * admin: { mask: "(999) 999-9999" }
 * admin: { mask: ["999-999", "999-999-999"] }
 * admin: { mask: { mask: "decimal", storeMasked: true, options: { radixPoint: "." } } }
 * ```
 */
export type FieldMaskInput =
  | string
  | string[]
  | {
      mask: string | string[];
      storeMasked?: boolean;
      options?: Record<string, unknown>;
    };

/**
 * Resolved mask configuration after {@link resolveFieldMask} applies
 * defaults — always has every property present.
 */
export interface FieldMask {
  /** The mask pattern(s) passed to `use-mask-input`. */
  mask: string | string[];
  /**
   * Whether the stored value keeps the mask's literal characters.
   * `false` (default) stores the raw unmasked value.
   */
  storeMasked: boolean;
  /** Extra `use-mask-input`/Inputmask options, passed through unchanged. */
  options: Record<string, unknown>;
}
