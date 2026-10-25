import type { FieldMask, FieldMaskInput, MaskableFieldType } from "./types";

/**
 * Normalizes any {@link FieldMaskInput} shape into a fully-populated
 * {@link FieldMask}.
 *
 * @param input - A bare mask string/array, or the object form.
 * @returns The resolved mask with `storeMasked`/`options` defaults applied.
 */
function normalizeFieldMaskInput(input: FieldMaskInput): FieldMask {
  if (typeof input === "string" || Array.isArray(input)) {
    return { mask: input, storeMasked: false, options: {} };
  }
  return {
    mask: input.mask,
    storeMasked: input.storeMasked ?? false,
    options: input.options ?? {},
  };
}

/**
 * Resolves a field's effective mask from its own `admin.mask` and the
 * project's `fields.inputMasks[fieldType]` default.
 *
 * `fieldMask: false` always disables masking, even when the project
 * configured a default for this field type. `fieldMask: undefined` falls
 * back to the project default, if any. Any other `fieldMask` overrides the
 * project default entirely (contract item 8 — opt-in only, no merging of
 * the two).
 *
 * @param props - Input props.
 * @param props.fieldType - The field's own type, used to look up the project default.
 * @param props.fieldMask - The field's own `admin.mask` value.
 * @param props.inputMasks - The project's `fields.inputMasks` defaults, keyed by field type.
 * @returns The resolved mask, or `undefined` when no mask applies.
 *
 * @example
 * ```ts
 * resolveFieldMask({ fieldType: "number", fieldMask: undefined, inputMasks: { number: "decimal" } })
 * // → { mask: "decimal", storeMasked: false, options: {} }
 *
 * resolveFieldMask({ fieldType: "number", fieldMask: false, inputMasks: { number: "decimal" } })
 * // → undefined
 * ```
 */
export function resolveFieldMask(props: {
  fieldType: MaskableFieldType;
  fieldMask: FieldMaskInput | false | undefined;
  inputMasks: Partial<Record<MaskableFieldType, FieldMaskInput>>;
}): FieldMask | undefined {
  const { fieldType, fieldMask, inputMasks } = props;
  if (fieldMask === false) return undefined;
  if (fieldMask !== undefined) return normalizeFieldMaskInput(fieldMask);
  const projectDefault = inputMasks[fieldType];
  return projectDefault === undefined
    ? undefined
    : normalizeFieldMaskInput(projectDefault);
}
