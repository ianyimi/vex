"use client";

import type { ArrayField, ArrayType, InputComponentProps } from "@vexcms/core";
import type { TypedFieldApi } from "./createFieldInput";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";
import { Button } from "../ui/button";
import { GripVertical, PlusIcon, TrashIcon } from "lucide-react";
import { fieldToInputComponent } from "../fields";
import { FormError } from "./FormError";
import { FormLabel } from "./FormLabel";
import { FormDescription } from "./FormDescription";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "../../styles/utils";

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
        <DragDropContext
          onDragStart={() => {
            document.body.style.overflowX = "hidden";
          }}
          onDragEnd={(res) => {
            document.body.style.overflowX = "";
            if (!res.destination) return;
            field.swapValues(res.source.index, res.destination.index);
          }}
        >
          <Droppable droppableId={`${name}`} direction="vertical">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                className={cn(
                  "flex flex-col gap-2 border-border rounded-sm",
                  snapshot.isDraggingOver && "bg-border/50",
                )}
                {...provided.droppableProps}
              >
                {items.map((_, index) => (
                  <Draggable
                    draggableId={`${name}[${index}]`}
                    index={index}
                    key={index}
                  >
                    {(provided, _snapshot) => (
                      <div
                        ref={provided.innerRef}
                        className="flex items-center gap-2 px-2"
                        {...provided.draggableProps}
                      >
                        <div
                          className="cursor-grab"
                          {...provided.dragHandleProps}
                        >
                          <GripVertical size={16} />
                        </div>
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
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          aria-label={`Remove item ${index + 1}`}
                        >
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <p className="text-sm text-muted-foreground">No items yet.</p>
      )}

      <FormError field={field} submissionAttempts={submissionAttempts} />
    </div>
  );
}
