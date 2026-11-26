"use client";

import type { AnyFieldApi } from "@tanstack/react-form";
import { useStore } from "@tanstack/react-form";
import { useEffect, useRef, useState } from "react";
import type { VariantField as VariantFieldDef, VariantMemberConfig } from "@vexcms/core";
import {
  adminFieldToInputSchema,
  buildDefaultVariantMember,
  classifyVariantMemberKind,
  classifyVariantValueKind,
  resolveVariantMemberSeedDefault,
  type FieldComponentProps,
} from "@vexcms/core";
import { FieldLabelIdContext, VariantField, useFieldContext, useFormContext } from "../../forms";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { RenderFields } from "../RenderFields";
import { fieldToFieldComponent } from "../registry";
import { useNullToggle } from "../useNullToggle";

/**
 * Sentinel picker key for "no variant/member selected" — a non-required
 * field's way back to `undefined` after a selection. Not a legal variant/
 * member key itself (`variant()`'s own config keys are always non-empty
 * user-chosen strings), and deliberately non-empty — some `Select`
 * implementations (Base UI included) reject an empty-string item value.
 */
const NONE_OPTION_KEY = "__vex_variant_none__";

function resolveDiscriminatedActiveKey(props: {
  discriminator: string;
  variants: Record<string, VariantMemberConfig>;
  value: unknown;
}): string | undefined {
  const value = props.value as Record<string, unknown> | null | undefined;
  const key = value && typeof value === "object" ? value[props.discriminator] : undefined;
  return typeof key === "string" && key in props.variants ? key : undefined;
}

function resolvePrimitiveActiveKey(props: {
  variants: FieldComponentProps<{}, VariantFieldDef>["fieldDef"]["variants"];
  value: unknown;
}): string | undefined {
  const kind = classifyVariantValueKind(props.value);
  if (kind === "null" || kind === "unknown") return undefined;
  return Object.entries(props.variants).find(
    ([, member]) => classifyVariantMemberKind({ field: member }) === kind,
  )?.[0];
}

/**
 * The variant admin field's own render body — reads the current value via
 * `useFieldContext()`, and renders `VariantField`'s accordion (picker plus
 * the active selection's body): discriminated mode renders the variant's
 * own fields via `RenderFields` (same as `GroupFieldAdmin`); primitive mode
 * resolves and renders the active member's OWN top-level field component
 * via `fieldToFieldComponent`, bound to the SAME form path (the member's
 * value lives there directly, not nested under a key).
 *
 * The active key is LOCAL state, seeded once from the stored value's
 * discriminator/runtime kind on mount, then changed by the picker
 * (`handleActiveKeyChange`), by null-toggle restore (`onRestore`), or by
 * re-deriving it when `field.state.value` changes WITHOUT going through
 * either of those — a version switch, a post-save `form.reset()`, or any
 * other external write. `lastValueRef` (the same pattern `BytesField.tsx`'s
 * `BytesControl` uses) distinguishes an external write from this
 * component's own: every internal path updates it to match what it just
 * committed, so only a value this component did NOT itself produce
 * re-derives the key. An external `undefined` is the one case that does
 * NOT re-derive — it keeps a primitive member selected (and its own
 * control rendered) while its value reads as cleared, so an empty
 * required member's own validation error surfaces instead of the picker
 * silently reverting to "no selection".
 *
 * Switching the picker resets the value to the newly-selected variant's/
 * member's own defaults — confirm-free, mirroring `blocks()`'s own no-confirm
 * type switch. `number()` sub-fields/members seed empty rather than their
 * static `0` default (`resolveVariantMemberSeedDefault`), matching a
 * freshly-chosen selection's own blank control.
 *
 * Wrapped in its own `role="group" aria-labelledby aria-disabled` element,
 * mirroring `GroupFieldAdmin` — the accordion trigger holds the field's own
 * label, so this satisfies the field-input contract's labelled-group
 * pattern for the primitive case, whose picker claims a suffixed id rather
 * than `field.name` itself.
 *
 * @param props - {@link FieldComponentProps} narrowed to `VariantField`.
 * @returns The variant field's labelled `role="group"`, wrapping the accordion.
 */
function VariantFieldAdminInner(props: FieldComponentProps<{}, VariantFieldDef>) {
  const field = useFieldContext();
  const form = useFormContext();
  const submissionAttempts = useStore(form.store, (state) => state.submissionAttempts);
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const isDiscriminated = props.fieldDef.discriminator !== undefined;

  function deriveActiveKey(value: unknown): string | undefined {
    return isDiscriminated
      ? resolveDiscriminatedActiveKey({
          discriminator: props.fieldDef.discriminator as string,
          variants: props.fieldDef.variants as Record<string, VariantMemberConfig>,
          value,
        })
      : resolvePrimitiveActiveKey({ variants: props.fieldDef.variants, value });
  }

  const [selectedKey, setSelectedKey] = useState<string | undefined>(() => deriveActiveKey(field.state.value));
  const lastValueRef = useRef(field.state.value);

  function materializeValueForKey(key: string): unknown {
    if (props.fieldDef.discriminator !== undefined) {
      const member = (props.fieldDef.variants as Record<string, VariantMemberConfig>)[key];
      if (!member) return undefined;
      return buildDefaultVariantMember({ discriminator: props.fieldDef.discriminator, key, member });
    }
    const member = props.fieldDef.variants[key];
    return member ? resolveVariantMemberSeedDefault(member) : undefined;
  }

  const memberOptions = Object.entries(props.fieldDef.variants).map(([key, member]) => ({
    key,
    label: isDiscriminated ? ((member as VariantMemberConfig).label ?? key) : key,
  }));
  const options = props.fieldDef.required
    ? memberOptions
    : [{ key: NONE_OPTION_KEY, label: "None" }, ...memberOptions];

  function handleActiveKeyChange(nextKey: string): void {
    if (nextKey === NONE_OPTION_KEY) {
      lastValueRef.current = undefined;
      setSelectedKey(undefined);
      field.handleChange(undefined);
      return;
    }
    const nextValue = materializeValueForKey(nextKey);
    lastValueRef.current = nextValue;
    setSelectedKey(nextKey);
    field.handleChange(nextValue);
  }

  const { isNull, onIsNullChange } = useNullToggle({
    field,
    nullable: props.fieldDef.nullable,
    emptyValue: () => {
      const firstKey = Object.keys(props.fieldDef.variants)[0];
      const restoreKey = selectedKey ?? (props.fieldDef.required ? firstKey : undefined);
      return restoreKey === undefined ? undefined : materializeValueForKey(restoreKey);
    },
    onRestore: (value) => {
      lastValueRef.current = value;
      setSelectedKey(deriveActiveKey(value));
    },
  });

  useEffect(() => {
    if (Object.is(field.state.value, lastValueRef.current)) return;
    lastValueRef.current = field.state.value;
    if (field.state.value !== undefined) setSelectedKey(deriveActiveKey(field.state.value));
  }, [field.state.value, isDiscriminated, props.fieldDef]);

  useEffect(() => {
    if (props.fieldDef.discriminator !== undefined || selectedKey === undefined || field.state.value === null) {
      field.setMeta((prev) =>
        prev.errorMap.onSubmit === undefined
          ? prev
          : { ...prev, errorMap: { ...prev.errorMap, onSubmit: undefined } },
      );
      return;
    }
    const member = props.fieldDef.variants[selectedKey];
    if (!member) return;
    const result = adminFieldToInputSchema({ field: member }).safeParse(field.state.value);
    const message = result.success ? undefined : result.error.issues[0]?.message;
    field.setMeta((prev) =>
      prev.errorMap.onSubmit === message ? prev : { ...prev, errorMap: { ...prev.errorMap, onSubmit: message } },
    );
  }, [props.fieldDef, selectedKey, field.state.value, submissionAttempts]);

  const activeDiscriminatedMember =
    isDiscriminated && selectedKey !== undefined
      ? (props.fieldDef.variants as Record<string, VariantMemberConfig>)[selectedKey]
      : undefined;
  const activePrimitiveMember =
    props.fieldDef.discriminator === undefined && selectedKey !== undefined
      ? props.fieldDef.variants[selectedKey]
      : undefined;
  const ActivePrimitiveField = activePrimitiveMember ? fieldToFieldComponent(activePrimitiveMember.type) : undefined;

  return (
    <div role="group" aria-labelledby={`${props.name}-label`} aria-disabled={readOnly}>
      <VariantField
        label={props.fieldDef.label || props.name}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        index={props.index}
        readOnly={readOnly}
        display={props.fieldDef.admin.display}
        options={options}
        activeKey={selectedKey}
        onActiveKeyChange={handleActiveKeyChange}
        discriminated={isDiscriminated}
        defaultOpen={!props.fieldDef.admin.defaultCollapsed}
        isNull={isNull}
        onIsNullChange={onIsNullChange}
      >
        {activeDiscriminatedMember && (
          <RenderFields
            fields={activeDiscriminatedMember.fields}
            collection={props.collection}
            namePrefix={props.name}
            readOnly={readOnly}
          />
        )}
        {!isDiscriminated && activePrimitiveMember && ActivePrimitiveField && (
          <FieldLabelIdContext.Provider value={`${props.name}-member-label`}>
            <ActivePrimitiveField
              name={props.name}
              fieldDef={activePrimitiveMember}
              collection={props.collection}
              readOnly={readOnly}
            />
          </FieldLabelIdContext.Provider>
        )}
      </VariantField>
    </div>
  );
}

/**
 * Variant admin field — binds `props.name` to the nearest `<AppForm>` (or an
 * explicit `field` prop) via `AdminFieldBinding`, then renders
 * `VariantFieldAdminInner`.
 *
 * @param props - {@link FieldComponentProps} narrowed to `VariantField`.
 * @returns The bound variant field: picker, accordion, and the active member's input.
 */
export function VariantFieldAdmin(
  props: FieldComponentProps<{}, VariantFieldDef> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <VariantFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
