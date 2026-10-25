"use client";

import { type CSSProperties, type ReactNode, useMemo } from "react";
import {
  ADMIN_FIELDS,
  SLOT_IDS,
  type AdminDataField,
  type AdminField,
  type BaseFieldMeta,
  type CollectionConfig,
  type ComponentContributionInput,
  type ComponentOverrideInput,
  type GlobalConfig,
  type TabsField,
  type InputComponentProps,
  type VexVersionStatus,
} from "@vexcms/core";
import type { ReactHKT } from "../../adapter";
import { useVexConfig } from "../../context";
import { ComponentErrorBoundary } from "../slots/ComponentErrorBoundary";
import { SlotOutlet } from "../slots/SlotOutlet";
import { SlotOverrideOutlet } from "../slots/SlotOverrideOutlet";
import { resolveFieldInputComponent } from "../slots/resolveFieldInputComponent";
import { FormTabs } from "./FormTabs";
import { FormCollapsible } from "./FormCollapsible";
import { FormRow } from "./FormRow";
import { FormUI } from "./FormUI";
import { FieldConditionGate } from "./FieldConditionGate";
import { useFieldErrorCount } from "../../hooks/useFieldErrorCount";

/**
 * Shared render context threaded through a `fields` tree — resolved once by
 * {@link RenderFields} and passed down unchanged to every nested field
 * (`FormTabs`/`FormCollapsible`/`FormRow`/`FormUI`), so a container never
 * re-derives `collection`/`namePrefix`/`readOnly`/`fieldKeys` for its own
 * children.
 */
export interface RenderFieldsContext {
  /** Forwarded to every rendered field's `InputComponentProps.collection`. */
  collection: CollectionConfig | GlobalConfig;
  /** Dot-prefix for every rendered field's form name. */
  namePrefix?: string;
  /** OR'd with each field's own `admin.readOnly`. */
  readOnly?: boolean;
  /** Forwarded to every rendered field's `InputComponentProps.documentStatus`. */
  documentStatus?: VexVersionStatus;
  /** Readable data keys — `getDataFields` keys — gating every container level. */
  fieldKeys?: readonly string[];
  /** Whether a `tabs()` field at THIS level persists its tab in `?<fieldKey>=`. */
  isTopLevel?: boolean;
}

/**
 * Resolves the `name` a field renders its input under, dot-joined with `context.namePrefix`.
 *
 * @param context - The enclosing `RenderFields` context, supplying `namePrefix`.
 * @param key - This field's own key in its `fields` record.
 * @returns The dot-joined form name for this field.
 */
export function fieldName(context: RenderFieldsContext, key: string): string {
  return context.namePrefix ? `${context.namePrefix}.${key}` : key;
}

/**
 * The width a field occupies in its parent's flex-wrap row — a `tabs`/
 * `collapsible`/`row`/`ui` field is always `"100%"`; only a data field
 * carries a resolved `admin.width` (Interview Decision 4).
 *
 * @param field - The field to resolve a width for.
 * @returns The field's resolved width, as a CSS width value.
 */
export function fieldWidth(field: AdminField): string {
  if (ADMIN_FIELDS[field.type].kind === "ui") return "100%";
  return (field as AdminDataField).admin.width;
}

/**
 * Wraps one field's rendered content at its resolved width. While the
 * enclosing `form` container (the edit view's form column, or `AppForm`) is
 * under 36rem every field is full width; from 36rem it switches to the
 * CSS custom property set here (Interview Decision 4). A `%` width gives up
 * its own share of the `gap-4` gutters, so siblings whose widths sum to 100%
 * fit on one line instead of wrapping.
 *
 * @returns The field's content wrapped in a width-constrained container.
 */
export function FieldLayoutItem(props: {
  width: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div
      className="w-full @xl/form:w-(--field-width)"
      style={{ "--field-width": gapAdjustedWidth(props.width) } as CSSProperties}
    >
      {props.children}
    </div>
  );
}

function gapAdjustedWidth(width: string): string {
  if (!width.endsWith("%")) return width;
  const percent = Number.parseFloat(width);
  if (!Number.isFinite(percent) || percent >= 100) return width;
  return `calc(${width} - 1rem * ${(100 - percent) / 100})`;
}

/**
 * Filters a `fields` record down to the entries that should render: drops
 * any `admin.hidden` entry, and — when `fieldKeys` is given — any data field
 * whose own key is outside that subset. `fieldKeys` holds `getDataFields`
 * keys, so an unnamed container's hoisted children match by their own key
 * and a NAMED tab matches by its `name`; under `fieldKeys` a
 * `tabs`/`collapsible`/`row` container renders only while it has a readable
 * descendant, and a `ui()` field — which stores nothing — always renders.
 *
 * @returns The `[key, field]` entries that should render.
 */
export function visibleFieldEntries(props: {
  fields: Record<string, AdminField>;
  fieldKeys?: readonly string[];
}): [string, AdminField][] {
  return Object.entries(props.fields).filter(([key, field]) =>
    isFieldEntryVisible({ fieldKey: key, field, fieldKeys: props.fieldKeys }),
  );
}

function isFieldEntryVisible(props: {
  fieldKey: string;
  field: AdminField;
  fieldKeys?: readonly string[];
}): boolean {
  const { fieldKey, field, fieldKeys } = props;
  if (field.admin.hidden) return false;
  switch (field.type) {
    case ADMIN_FIELDS.tabs.type:
      return field.tabs.some((tab) => isTabVisible({ tab, fieldKeys }));
    case ADMIN_FIELDS.collapsible.type:
    case ADMIN_FIELDS.row.type:
      return !fieldKeys || visibleFieldEntries({ fields: field.fields, fieldKeys }).length > 0;
    case ADMIN_FIELDS.ui.type:
      return true;
    default:
      return !fieldKeys || fieldKeys.includes(fieldKey);
  }
}

/**
 * Whether one `tabs()` tab has anything to render under `fieldKeys` — a
 * named tab by its own `name`, an unnamed tab by its visible fields.
 *
 * @returns `true` if `props.tab` has anything to render under `props.fieldKeys`.
 */
export function isTabVisible(props: {
  tab: TabsField["tabs"][number];
  fieldKeys?: readonly string[];
}): boolean {
  const { tab, fieldKeys } = props;
  if (!fieldKeys) return true;
  if (tab.name !== undefined) return fieldKeys.includes(tab.name);
  return visibleFieldEntries({ fields: tab.fields, fieldKeys }).length > 0;
}

/**
 * Collects the dot-joined form names of every data field reachable under
 * `fields`, for {@link useFieldErrorCount}'s `names` — a tab or
 * collapsible's own error-count badge counts errors anywhere inside it. A
 * `ui()` field contributes no name; an unnamed `tabs()` tab's/`row()`'s/
 * `collapsible()`'s own fields recurse; a NAMED tab contributes its own
 * `name` alone — `matchesFieldNamePrefix` already matches every nested path
 * under it (`seo.metaTitle` matches the `"seo"` prefix).
 *
 * @param props.namePrefix - Dot-prefix to apply, matching the enclosing
 *   `RenderFields` call's own `namePrefix` — omit at the top level.
 * @returns The dot-joined form names of every data field reachable under `props.fields`.
 */
export function dataFieldNames(props: {
  fields: Record<string, AdminField>;
  namePrefix?: string;
}): string[] {
  const names: string[] = [];
  for (const [key, field] of Object.entries(props.fields)) {
    switch (field.type) {
      case ADMIN_FIELDS.ui.type:
        continue;
      case ADMIN_FIELDS.tabs.type:
        for (const tab of field.tabs) {
          if (tab.name !== undefined) {
            names.push(
              props.namePrefix ? `${props.namePrefix}.${tab.name}` : tab.name,
            );
          } else {
            names.push(
              ...dataFieldNames({ fields: tab.fields, namePrefix: props.namePrefix }),
            );
          }
        }
        continue;
      case ADMIN_FIELDS.row.type:
      case ADMIN_FIELDS.collapsible.type:
        names.push(
          ...dataFieldNames({ fields: field.fields, namePrefix: props.namePrefix }),
        );
        continue;
      default:
        names.push(props.namePrefix ? `${props.namePrefix}.${key}` : key);
    }
  }
  return names;
}

/**
 * The stable identifier one `tabs()` tab is selected/persisted by — its own
 * `name` when set, else its `label` slugified (lowercased, non-alphanumeric
 * runs collapsed to a single `-`, leading/trailing `-` trimmed).
 *
 * @returns The tab's stable value identifier.
 */
export function tabValue(tab: { name?: string; label: string }): string {
  return (
    tab.name ??
    tab.label
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Resolves and renders one data field's full slot surface: `field.beforeInput` /
 * `field.afterInput` contributions around the resolved `field.input` override chain, plus the
 * (currently built-in-less) `field.label` / `field.description` override points.
 *
 * `field.label`/`field.description` have NO built-in contribution in this pass — every Input
 * component still renders its own label/description markup inline, unchanged. The slots exist
 * (S1/S12) so a project's own custom Input override that opts out of its own label/description,
 * or a future input-styling pass (noted for H), already composes correctly against them. Declaring
 * the slot now and giving it a real built-in later is additive, not breaking (S9's duplicate-id
 * rule only applies once a built-in exists to collide with).
 *
 * @returns The field's rendered slot surface and resolved input.
 */
function FieldSlotOutlet(props: {
  field: AdminDataField;
  fieldKey: string;
  context: RenderFieldsContext;
}): ReactNode {
  const { field, fieldKey, context } = props;
  const config = useVexConfig();
  // `field.admin.components`/`config.admin.components` are typed against the
  // framework-erased `ComponentHKT` on the plain core `AdminField`/
  // `VexClientConfig` types this component receives (ComponentContributionInput's
  // own JSDoc documents this exact erasure) — every component actually stored
  // there was authored through this React adapter's own field factories
  // (`text()`, `ui()`, …), so the values are genuinely `ReactHKT`-shaped at
  // runtime; this is the one place that fact gets asserted back into the type.
  const components = field.admin.components as unknown as {
    Input: ComponentOverrideInput<ReactHKT, unknown>[] | undefined;
    Label: ComponentOverrideInput<ReactHKT, unknown>[] | undefined;
    Description: ComponentOverrideInput<ReactHKT, unknown>[] | undefined;
    beforeInput: ComponentContributionInput<ReactHKT, unknown>[] | undefined;
    afterInput: ComponentContributionInput<ReactHKT, unknown>[] | undefined;
  };
  const rootOverrides = config.admin.components?.fields?.[field.type]?.Input as
    | ComponentOverrideInput<ReactHKT, unknown>[]
    | undefined;
  const InputComponent = useMemo(
    () =>
      resolveFieldInputComponent({
        fieldType: field.type,
        rootOverrides,
        fieldOverrides: components.Input,
      }),
    [field.type, components.Input, rootOverrides],
  );
  const inputProps: InputComponentProps<BaseFieldMeta, AdminField> = {
    name: fieldName(context, fieldKey),
    fieldDef: field,
    readOnly: Boolean(context.readOnly) || field.admin.readOnly,
    collection: context.collection,
    documentStatus: context.documentStatus,
  };
  const errorCount = useFieldErrorCount({ names: [inputProps.name] });
  return (
    <FieldConditionGate field={field} name={inputProps.name}>
      <div data-field-invalid={errorCount > 0 ? "" : undefined}>
        <SlotOutlet
          slotId={SLOT_IDS.field.beforeInput}
          builtins={[]}
          contributions={components.beforeInput}
          contributedProps={inputProps}
          conditionName={inputProps.name}
        />
        <SlotOverrideOutlet
          slotId={SLOT_IDS.field.label}
          overrides={components.Label}
          defaultComponent={() => null}
          props={inputProps}
        />
        <ComponentErrorBoundary id={SLOT_IDS.field.input}>
          <InputComponent {...inputProps} />
        </ComponentErrorBoundary>
        <SlotOverrideOutlet
          slotId={SLOT_IDS.field.description}
          overrides={components.Description}
          defaultComponent={() => null}
          props={inputProps}
        />
        <SlotOutlet
          slotId={SLOT_IDS.field.afterInput}
          builtins={[]}
          contributions={components.afterInput}
          contributedProps={inputProps}
          conditionName={inputProps.name}
        />
      </div>
    </FieldConditionGate>
  );
}

/**
 * Renders one field, recursing into `FormTabs`/`FormCollapsible`/`FormRow`/
 * `FormUI` for a `kind: "ui"` field and `FieldSlotOutlet` for a data field.
 * A `kind: "ui"` field's own `admin.readOnly` is OR-ed into the context its
 * contents render with, matching what `getDataFields` stamps onto each
 * flattened field.
 *
 * @throws {Error} When a data field's type has no registered input
 *   component (the same failure mode the removed `RenderFieldInputComponents`
 *   and every edit view's own field loop already threw) — surfaced by
 *   `resolveFieldInputComponent` inside `FieldSlotOutlet`.
 * @returns The rendered field, recursing into the appropriate container or `FieldSlotOutlet`.
 */
export function renderField(props: {
  field: AdminField;
  fieldKey: string;
  context: RenderFieldsContext;
}): ReactNode {
  const { field, fieldKey, context } = props;
  const uiContext = field.admin.readOnly ? { ...context, readOnly: true } : context;
  switch (field.type) {
    case ADMIN_FIELDS.tabs.type:
      return <FormTabs field={field} fieldKey={fieldKey} context={uiContext} />;
    case ADMIN_FIELDS.collapsible.type:
      return <FormCollapsible field={field} fieldKey={fieldKey} context={uiContext} />;
    case ADMIN_FIELDS.row.type:
      return <FormRow field={field} fieldKey={fieldKey} context={uiContext} />;
    case ADMIN_FIELDS.ui.type:
      return (
        <FieldConditionGate field={field} name={fieldName(context, fieldKey)}>
          <FormUI field={field} fieldKey={fieldKey} context={uiContext} />
        </FieldConditionGate>
      );
    default:
      return (
        <FieldSlotOutlet field={field} fieldKey={fieldKey} context={context} />
      );
  }
}

/**
 * Renders a `fields` map — the single renderer every field-owning surface (a
 * collection/global's own top-level fields, a `group`'s sub-fields, one
 * `array`/`blocks` item, a create modal's required-only subset) uses in
 * place of the removed `RenderFieldInputComponents`. Walks `fields` RAW —
 * `tabs()`/`collapsible()`/`row()`/`ui()` entries render themselves via
 * `renderField`; nothing here calls `getDataFields` (that function is for
 * schema/validation/type-gen/RBAC/index/version/list-column/default-value
 * consumers — Step 6 — never for rendering).
 *
 * Siblings lay out in a flex-wrap row at their resolved width
 * (`FieldLayoutItem`), collapsing to full width while the enclosing `form`
 * container is under 36rem (Interview Decision 4). `region`/`isTopLevel` partition a collection or
 * global's OWN top-level fields into the edit view's main/sidebar columns —
 * meaningless, and ignored, for a nested call (Interview Decision 5).
 *
 * @param props.fields - The field map this call renders — a resource's full
 *   field set, or one container's own sub-fields for a nested call.
 * @param props.collection - Forwarded to every `InputComponentProps.collection`.
 * @param props.namePrefix - Dot-prefix for every rendered field's form name —
 *   omit at the top level, pass the parent path for a nested call.
 * @param props.readOnly - OR'd with each field's own `admin.readOnly`.
 * @param props.region - Which top-level partition to render — `"main"`,
 *   `"sidebar"`, or `"all"` (default). Only consulted when `isTopLevel` is set.
 * @param props.fieldKeys - Readable `getDataFields` keys (RBAC-visible reads,
 *   or a create modal's required-only fields) — gates containers at every depth.
 * @param props.isTopLevel - Enables the `region` partition and every
 *   top-level `tabs()` field's `?<fieldKey>=` URL persistence.
 * @returns The rendered tree, or `null` when every entry is filtered out.
 *
 * @example
 * ```tsx
 * <AppForm form={form}>
 *   <RenderFields fields={collection.fields} collection={collection} isTopLevel region="main" />
 * </AppForm>
 * ```
 */
export function RenderFields(props: {
  fields: Record<string, AdminField>;
  collection: CollectionConfig | GlobalConfig;
  namePrefix?: string;
  readOnly?: boolean;
  documentStatus?: VexVersionStatus;
  region?: "main" | "sidebar" | "all";
  fieldKeys?: readonly string[];
  isTopLevel?: boolean;
}): ReactNode {
  const {
    fields,
    collection,
    namePrefix,
    readOnly,
    documentStatus,
    region = "all",
    fieldKeys,
    isTopLevel,
  } = props;

  const visible = useMemo(
    () => visibleFieldEntries({ fields, fieldKeys }),
    [fields, fieldKeys],
  );
  const partitioned = useMemo(
    () =>
      isTopLevel && region !== "all"
        ? visible.filter(([, field]) => field.admin.position === region)
        : visible,
    [visible, isTopLevel, region],
  );
  const context: RenderFieldsContext = {
    collection,
    namePrefix,
    readOnly,
    documentStatus,
    fieldKeys,
    isTopLevel,
  };

  if (partitioned.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4">
      {partitioned.map(([key, field]) => (
        <FieldLayoutItem key={key} width={fieldWidth(field)}>
          {renderField({ field, fieldKey: key, context })}
        </FieldLayoutItem>
      ))}
    </div>
  );
}
