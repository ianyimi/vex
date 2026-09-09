"use client";

import {
  type ArrayField,
  type ArrayType,
  type BaseFieldMeta,
  type InputComponentProps,
} from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { Droppable, Draggable, DragHandle } from "../ui/dnd";
import { TrashIcon } from "lucide-react";
import { fieldToInputComponent } from "../fields";
import { FormError } from "./FormError";
import { FormDescription } from "./FormDescription";

/**
 * Renders an array field as a dynamic list with add/remove controls.
 *
 * This component renders inside an `ArrayFieldInput` (which wraps a TanStack Form
 * array field with `mode="array"`). It maps over `field.state.value` and renders
 * each item as a sub-field using `form.Field name={\`${name}[${i}]\`}`.
 *
 * **Key features:**
 * - Renders each array item as a sub-field with the correct path (e.g., `"tags[0]"`)
 * - Provides add/remove controls for dynamic array manipulation
 * - Shows validation errors for the entire array field
 * - Respects `readOnly` — disables all controls when true
 *
 * @example
 * ```tsx
 * const ArrayFieldInput = createFieldInput<ArrayType[], ArrayField<ArrayType>>(
 *   ({ name, fieldDef, field, submissionAttempts }) => (
 *     <div className="flex flex-col gap-1.5">
 *       <FormArray
 *         name={name}
 *         field={field}
 *         fieldDef={fieldDef}
 *         readOnly={fieldDef.admin.readOnly}
 *         submissionAttempts={submissionAttempts}
 *       />
 *     </div>
 *   ),
 *   "array" // mode
 * )
 * ```
 *
 * @param props - Component props.
 * @returns The array's items list (draggable, with per-item remove controls
 *   and an add button), or a "No items yet." message when empty.
 * @throws {Error} When rendered outside `<AppForm>`, or when `fieldDef.items.type`
 *   has no registered input component.
 */
export function FormArray<
  TArrayType extends ArrayType = string,
  TFieldMeta extends BaseFieldMeta = BaseFieldMeta,
>({
  collection,
  name,
  field,
  fieldDef,
  index,
  readOnly,
  submissionAttempts,
}: InputComponentProps<TFieldMeta, ArrayField<TArrayType, TFieldMeta>> & {
  field: TypedFieldApi<TArrayType[]>;
  submissionAttempts: number;
}) {
  const form = useContext(AppFormContext);

  if (!form) {
    throw new Error(
      `FormArray "${name}" must be rendered inside <AppForm> or have a form context available.`,
    );
  }

  const itemFieldDef = fieldDef.items;
  const ItemInput = fieldToInputComponent(itemFieldDef.type);

  if (!ItemInput) {
    throw new Error("invalid array.items field type set");
  }

  function getNewItemDefault() {
    return itemFieldDef.defaultValue as TArrayType;
  }

  const items = field.state.value ?? [];
  const atMax = !!fieldDef.max && items.length >= fieldDef.max.value;

  return (
    <div
      role="group"
      aria-labelledby={`${name}-label`}
      aria-disabled={readOnly}
      className="flex flex-col gap-3 rounded-sm border-2 p-2"
    >
      <div className="flex gap-3">
        <div>
          <span
            id={`${name}-label`}
            className="relative flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {index !== undefined ? `[${index + 1}] - ` : ""}
            {fieldDef.label || name}
            {fieldDef.required && <span className="text-red-500">*</span>}
          </span>
          <FormDescription field={fieldDef} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled={readOnly || atMax}
            variant="outline"
            size="sm"
            onClick={() => field.pushValue(getNewItemDefault())}
            icon="Plus"
          >
            Add {fieldDef.labels.singular}
          </Button>
          {atMax && (
            <span className="text-xs text-muted-foreground">
              Maximum {fieldDef.max?.value} {fieldDef.labels.plural} reached
            </span>
          )}
        </div>
      </div>
      {items.length > 0 ? (
        <Droppable
          id={name}
          wrapperKey={name}
          onReorder={(from, to) => {
            field.moveValue(from, to);
          }}
        >
          {items.map((_, index) => (
            // `isDragDisabled` when read-only, so @hello-pangea/dnd nulls this
            // item's `dragHandleProps` and stops expecting a registered handle.
            // Without it the read-only `DragHandle` renders an inert div with no
            // handle props while the `Draggable` is still registered, and the
            // library logs "Unable to find drag handle" invariants on every
            // read-only render.
            <Draggable
              key={index}
              id={`${name}[${index}]`}
              index={index}
              isDragDisabled={readOnly}
            >
              <div className="flex items-center gap-2 px-2">
                <DragHandle disabled={readOnly} />
                <div className="flex-1">
                  <form.Field name={`${name}[${index}]`}>
                    {(subField) => (
                      <ItemInput
                        name={`${subField.name}`}
                        collection={collection}
                        fieldDef={itemFieldDef}
                        readOnly={readOnly}
                      />
                    )}
                  </form.Field>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={readOnly}
                  onClick={() => field.removeValue(index)}
                  className="text-muted-foreground hover:text-destructive shrink-0 transition-all duration-300"
                  aria-label={`Remove item ${index + 1} from ${fieldDef.label || name}`}
                >
                  <TrashIcon className="size-4" />
                </Button>
              </div>
            </Draggable>
          ))}
        </Droppable>
      ) : (
        <p className="text-muted-foreground text-sm">No items yet.</p>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
}
