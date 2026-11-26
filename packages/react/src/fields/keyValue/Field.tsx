"use client";

import { useContext, useMemo, useState, type ComponentType } from "react";
import { useForm, type AnyFieldApi } from "@tanstack/react-form";
import {
  relationship,
  VERSION_STATUSES,
  type AdminDataField,
  type CollectionSlug,
  type FieldComponentProps,
  type KeyValueField as KeyValueFieldDef,
  type VexVersionStatus,
} from "@vexcms/core";
import { KeyValueField, useFieldContext } from "../../forms";
import { useVexConfig, VexConfigContext } from "../../config/VexConfigContext";
import { Input } from "../../ui/input";
import { fieldToFieldComponent } from "../registry";
import { AdminFieldBinding } from "../AdminFieldBinding";
import { RelationshipEmpty, RelationshipFilledState, RelationshipPicker } from "../relationship";
import { useNullToggle } from "../useNullToggle";

/**
 * String-keyed row's key control — a plain text input, no registry dispatch
 * (a record key is a scalar string, not itself an `AdminDataField`).
 *
 * @returns A text input bound to the row's key.
 */
function KeyValueStringKeyControl(props: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  readOnly: boolean;
  duplicate: boolean;
  keyLabel: string;
}) {
  return (
    <div>
      <Input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onBlur={props.onBlur}
        disabled={props.readOnly}
        aria-invalid={props.duplicate}
        aria-label={props.keyLabel}
        aria-required="true"
        placeholder="Key"
      />
      {props.duplicate && <p className="text-xs text-destructive">Duplicate key</p>}
    </div>
  );
}

/**
 * Id-keyed row's key control — reuses the relationship field's own
 * empty/filled/picker presentational components against a synthetic,
 * always-single `relationship()` field def built from `fieldDef.keys.collection`,
 * driven entirely by local row state (no TanStack field, no nuqs modal
 * state — a row picker is ephemeral per-session UI, not a deep-linkable
 * target, unlike the top-level relationship field's own picker).
 *
 * @returns The relationship empty/filled/picker presentation for the row's key.
 */
function KeyValueIdKeyControl(props: {
  collectionSlug: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  readOnly: boolean;
  documentStatus: VexVersionStatus | undefined;
  duplicate: boolean;
  keyLabel: string;
}) {
  const config = useVexConfig();
  const [isOpen, setIsOpen] = useState(false);
  const relationshipFieldDef = useMemo(
    () => relationship({ collection: { slug: props.collectionSlug as CollectionSlug }, required: true }),
    [props.collectionSlug],
  );
  const targetCollection = config.collections.find((c) => c.slug === props.collectionSlug);
  const drafts = props.documentStatus === VERSION_STATUSES.draft.key;

  if (!targetCollection) {
    return (
      <p className="text-xs text-destructive">
        Unknown collection: <code>{props.collectionSlug}</code>
      </p>
    );
  }

  const docIds = props.value ? [props.value] : [];

  return (
    <div role="group" aria-label={props.keyLabel} onBlur={props.onBlur}>
      {docIds.length === 0 ? (
        <RelationshipEmpty
          fieldDef={relationshipFieldDef}
          targetCollection={targetCollection}
          readOnly={props.readOnly}
          onPickerOpen={() => setIsOpen(true)}
        />
      ) : (
        <RelationshipFilledState
          fieldDef={relationshipFieldDef}
          targetCollection={targetCollection}
          docIds={docIds}
          drafts={drafts}
          readOnly={props.readOnly}
          onRemove={() => props.onChange("")}
          onClear={() => props.onChange("")}
          openPicker={() => setIsOpen(true)}
        />
      )}
      {isOpen && (
        <RelationshipPicker
          fieldDef={relationshipFieldDef}
          targetCollection={targetCollection}
          selectedIds={docIds}
          drafts={drafts}
          onSelect={(ids) => {
            setIsOpen(false);
            props.onChange(ids[0] ?? "");
          }}
          onCancel={() => setIsOpen(false)}
        />
      )}
      {props.duplicate && <p className="text-xs text-destructive">Duplicate key</p>}
    </div>
  );
}

/**
 * One row's value control — the value field's own registry component
 * (`fieldToFieldComponent`, same dispatch `PrimitiveArrayItemControl` uses),
 * bound through a tiny per-row scratch `useForm()` instance rather than the
 * real outer field: a record's entries are addressed by arbitrary user-typed
 * keys, which can contain the `.`/`[`/`]` characters TanStack Form's own
 * path parser splits on, so the value can never be bound at a real path
 * composed from the key. The scratch form's single field is named `rowId`
 * (deterministic — `useKeyValueRows`' `useId()`-prefixed counter, safe,
 * unique within this field instance, dot/bracket-free, and identical on the
 * server and the client so hydration never disagrees on it), and
 * `AdminFieldBinding`'s existing `field` escape hatch (documented for "an
 * explicit field instance... outside the normal admin wiring") provides it
 * directly. A `listeners.onChange` propagates every edit back to
 * `useKeyValueRows`, which recomputes the real `Record<K, V>` and commits it
 * to the outer field — this scratch form never submits anything itself.
 *
 * `useForm({ defaultValues: { [props.rowId]: props.value } })` runs on
 * every render, not just mount, and `FormApi.update` (verified against
 * `@tanstack/form-core`) already re-adopts a changed `defaultValues` into
 * the live value whenever the scratch form itself is untouched — the exact
 * "untouched fields follow the server" rule `useLiveFieldMerge` applies
 * manually at the top-level form, here for free because this scratch form
 * has exactly one field, so form-wide `isTouched` and this row's own
 * touched state are the same thing. An EXTERNAL `props.value` change (the
 * row's key survived `useKeyValueRows`' reseed-by-key reconciliation, but
 * its stored value changed under it — a version switch, a post-save reset,
 * a live merge) reaches this control as a new prop and the scratch form
 * adopts it on its own; a row the user has started editing keeps the
 * user's value, same as `useLiveFieldMerge`'s own per-field freeze.
 *
 * KNOWN GAP: nested per-row validation errors are not wired — only the
 * keyValue field's OWN aggregate error (shown under the whole field) exists
 * in this version.
 *
 * @returns The row value's registry-dispatched field control.
 */
function KeyValueRowValueControl(props: {
  rowId: string;
  valueField: AdminDataField;
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly: boolean;
  collection: FieldComponentProps["collection"];
}) {
  /**
   * `fieldToFieldComponent`'s return type omits the `field` escape hatch
   * every registry `*FieldAdmin` component actually accepts (each one wraps
   * itself in its own `AdminFieldBinding`, see `KeyValueFieldAdmin` above for
   * the same pattern) — widened here so this row's scratch `rowForm` field
   * can be forced through directly. Without it, the value admin's own
   * internal `AdminFieldBinding` falls back to `useFormContext()` +
   * `form.Field(name)` against the OUTER real document form (since nothing
   * else overrides `formContext` for a bare `useForm()` scratch instance),
   * opening a stray top-level field keyed by the row's UUID instead of
   * writing through `rowForm`.
   */
  type ValueFieldAdminComponent = ComponentType<
    FieldComponentProps<{}, AdminDataField> & { field?: AnyFieldApi }
  >;
  const ValueFieldAdmin = fieldToFieldComponent(props.valueField.type) as
    | ValueFieldAdminComponent
    | undefined;
  if (!ValueFieldAdmin) {
    throw new Error("invalid keyValue.value field type set");
  }
  const rowForm = useForm({ defaultValues: { [props.rowId]: props.value } });

  return (
    <rowForm.Field
      name={props.rowId}
      listeners={{ onChange: ({ value }) => props.onChange(value) }}
    >
      {(field) => (
        <ValueFieldAdmin
          name={props.rowId}
          fieldDef={props.valueField}
          readOnly={props.readOnly}
          collection={props.collection}
          field={field}
        />
      )}
    </rowForm.Field>
  );
}

/**
 * The keyValue field's own render body — reads the `FieldApi` the enclosing
 * `AdminFieldBinding` provides to drive the null toggle (a nullable keyValue
 * renders the container null toggle) and maps `fieldDef` onto the app
 * form's `KeyValueField` row editor.
 *
 * @param props - {@link FieldComponentProps} narrowed to `KeyValueField`.
 * @returns The keyValue's `KeyValueField` body.
 */
function KeyValueFieldAdminInner(props: FieldComponentProps<{}, KeyValueFieldDef>) {
  const field = useFieldContext<Record<string, unknown> | null>();
  const config = useContext(VexConfigContext);
  const readOnly = props.readOnly || props.fieldDef.admin.readOnly;
  const valueFieldDef = props.fieldDef.value;
  const keyLabel = props.fieldDef.keys
    ? (config?.collections.find((c) => c.slug === props.fieldDef.keys!.collection.slug)?.labels
        .singular ?? "Key")
    : "Key";
  const { isNull, onIsNullChange } = useNullToggle({
    field,
    nullable: props.fieldDef.nullable,
    emptyValue: () => ({}),
  });
  return (
    <div role="group" aria-labelledby={`${props.name}-label`} aria-disabled={readOnly}>
      <KeyValueField<unknown>
        label={props.fieldDef.label || props.name}
        keyLabel={keyLabel}
        description={props.fieldDef.description}
        required={props.fieldDef.required}
        index={props.index}
        readOnly={readOnly}
        defaultOpen={!props.fieldDef.admin.defaultCollapsed}
        entryLabel="Entry"
        pluralLabel="Entries"
        createValue={() => valueFieldDef.defaultValue}
        isNull={isNull}
        onIsNullChange={onIsNullChange}
        renderKey={({ row, duplicate, onChange, onBlur }) =>
          props.fieldDef.keys ? (
            <KeyValueIdKeyControl
              collectionSlug={props.fieldDef.keys.collection.slug}
              value={row.key}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={readOnly}
              documentStatus={props.documentStatus}
              duplicate={duplicate}
              keyLabel={keyLabel}
            />
          ) : (
            <KeyValueStringKeyControl
              value={row.key}
              onChange={onChange}
              onBlur={onBlur}
              readOnly={readOnly}
              duplicate={duplicate}
              keyLabel={keyLabel}
            />
          )
        }
        renderValue={({ row, onChange }) => (
          <KeyValueRowValueControl
            rowId={row.rowId}
            valueField={valueFieldDef}
            value={row.value}
            onChange={onChange}
            readOnly={readOnly}
            collection={props.collection}
          />
        )}
      />
    </div>
  );
}

/**
 * KeyValue admin field — binds `props.name` to the nearest `<AppForm>` (or
 * an explicit `field` prop) via `AdminFieldBinding`, then renders the app
 * form's `KeyValueField` row editor configured for this field instance.
 *
 * @param props - {@link FieldComponentProps} narrowed to `KeyValueField`.
 * @returns The app form's `KeyValueField`, configured for this field instance.
 */
export function KeyValueFieldAdmin(
  props: FieldComponentProps<{}, KeyValueFieldDef> & { field?: AnyFieldApi },
) {
  return (
    <AdminFieldBinding name={props.name} field={props.field}>
      <KeyValueFieldAdminInner {...props} />
    </AdminFieldBinding>
  );
}
