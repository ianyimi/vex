"use client";

import type { ArrayField, ArrayType, InputComponentProps } from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { PlusIcon, TrashIcon } from "lucide-react";
import { fieldToInputComponent } from "../fields";
import { FormError } from "./FormError";
import { FormLabel } from "./FormLabel";
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
 *       <FormLabel field={fieldDef} name={name} />
 *       <FormArray
 *         name={name}
 *         field={field}
 *         fieldDef={fieldDef}
 *         readOnly={fieldDef.admin.readOnly}
 *         submissionAttempts={submissionAttempts}
 *       />
 *       <FormDescription field={fieldDef} />
 *     </div>
 *   ),
 *   "array" // mode
 * )
 * ```
 */
export function FormArray<TArrayType extends ArrayType = string>({
  name,
  field,
  fieldDef,
  index,
  readOnly,
  submissionAttempts,
}: InputComponentProps<ArrayField<TArrayType>> & {
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

  return (
    <div className="flex flex-col gap-3 p-2 border-2 rounded-sm">
      <div className="flex gap-3">
        <div>
          <FormLabel field={fieldDef} index={index} name={name} />
          <FormDescription field={fieldDef} />
        </div>
        <Button
          type="button"
          disabled={readOnly}
          variant="outline"
          size="sm"
          onClick={() => field.pushValue(getNewItemDefault())}
        >
          <PlusIcon size={20} className="inline mb-0.5 mr-1" />
          Add {fieldDef.labels.singular}
        </Button>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-col gap-2">
          {items.map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <form.Field name={`${name}[${index}]`}>
                  {(subField) => (
                    <ItemInput
                      name={`${subField.name}`}
                      fieldDef={itemFieldDef}
                      readOnly={readOnly}
                      index={index}
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
                className="mt-4 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Remove item ${index + 1}`}
              >
                <TrashIcon className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
}
