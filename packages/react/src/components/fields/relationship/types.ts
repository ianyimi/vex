/**
 * A single option shown in the relationship field picker combobox.
 *
 * `id` is the Convex document ID stored as the field value.
 * `label` is the display string shown in the combobox, derived from the
 * related collection's `useAsTitle` field.
 */
export interface RelationshipOption {
  /** The Convex document ID — stored as the field value. */
  id: string;
  /** Display label shown in the picker, from the related collection's `useAsTitle` field. */
  label: string;
}
