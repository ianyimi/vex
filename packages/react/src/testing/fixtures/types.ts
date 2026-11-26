import type { AdminDataField, DataFieldType } from "@vexcms/core";

/**
 * The one shared shape every per-field-type fixture module exports and registers into
 * `fieldFixtures`. `runFieldInputContractSuite` and `runNestedFieldContainerSuite` both
 * consume it generically — a new field type only needs a fixture matching this shape to
 * plug into every shared test factory.
 *
 * Fixtures live beside the field they describe, at
 * `components/fields/<type>/testFixture.ts`, never in this directory: a field type owns
 * everything about itself in one folder, and `fixtures/index.ts` only aggregates.
 */
export interface FieldFixture<TField extends AdminDataField = AdminDataField, TValue = unknown> {
  /** The field's `type` discriminant, e.g. `"text"` — must match `fieldDef.type`. */
  fieldType: DataFieldType;
  /** A representative field definition (as produced by the field's builder, e.g. `text()`). */
  fieldDef: TField;
  /** A value that should pass validation and render meaningfully. */
  valid: TValue;
  /**
   * A value that should be rejected by this field's own input schema. Not always
   * `undefined`: several field types end their schema in an unconditional
   * `.default(...)`, which silently accepts a missing value — see each fixture's own note.
   */
  invalid: TValue | undefined;
  /** The value a brand-new, untouched field starts with. */
  empty: TValue | undefined;
  /**
   * Opts this fixture out of `runFieldCellContractSuite`'s generic truncation
   * assertion (`cellTruncates: false`), independent of its field TYPE's own
   * default — for a fixture whose Cell renders something OTHER than its raw
   * `valid` value (e.g. a scalar `select` fixture, whose Cell looks up a
   * matching `fieldDef.options` label; the generic over-length-string probe
   * matches no configured option and has nothing to truncate), even though
   * the type's main fixture truncates fine. Honored by both
   * `runFieldCellContractSuite` (when its own `truncates` option is unset)
   * and `runVexReactSuite`. Omit when the type's own
   * `NO_TRUNCATION_FIELD_TYPES` entry (`testing/index.ts`) already covers it.
   */
  cellTruncates?: false;
}
