import type { ReactNode } from "react";
import type { FieldApi } from "@tanstack/react-form";
import type { AdminField, InputComponentProps } from "@vexcms/core";
import { useContext } from "react";
import { AppFormContext } from "./AppFormContext";

/**
 * A TanStack Form `FieldApi` narrowed to a specific value type.
 *
 * Use this as the type for a field input component's `field` prop when you need
 * an explicit, typed field outside of `<AppForm>` context.
 *
 * @example
 * ```tsx
 * const form = useForm<{ title: string }>({ ... })
 *
 * <form.Field name="title">
 *   {(field) => (
 *     <TextFieldInput
 *       name="title"
 *       fieldDef={titleField}
 *       readOnly={false}
 *       field={field}
 *     />
 *   )}
 * </form.Field>
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypedFieldApi<TValue> = FieldApi<any, any, any, any, TValue>;

/**
 * Creates a typed field input component, handling all TanStack Form wiring.
 *
 * Every field type in `@vexcms/react` is built with this factory. The render
 * function receives a `TypedFieldApi<TValue>` so `field.state.value` is typed
 * to `TValue` with no casts needed inside the render.
 *
 * Two usage paths:
 * - **`field` prop omitted — inside `<AppForm>`:** reads the form from `AppFormContext`,
 *   calls `form.Field name={props.name}` internally, and casts the value to `TValue`.
 * - **`field` prop provided — anywhere:** uses the field directly. Value is already
 *   typed from the `FieldApi` generic.
 *
 * **How field components know the field name:** `props.name` from `InputComponentProps`
 * is the collection field key (e.g. `"title"`). It is passed directly to `form.Field`
 * as the `name`, connecting the input to the matching key in `form.defaultValues`.
 *
 * @param render - Renders the field UI. Receives base `InputComponentProps` plus a
 *   `field: TypedFieldApi<TValue>` — use `field.state.value`, `field.handleChange`,
 *   `field.handleBlur`, and `field.state.meta.errors` for all form interactions.
 * @returns A React component accepting `InputComponentProps<TField> & { field?: TypedFieldApi<TValue> }`.
 * @throws {Error} When `field` is omitted and the component is rendered outside `<AppForm>`.
 *
 * @example
 * ```tsx
 * export const TextFieldInput = createFieldInput<string, TextField>(
 *   ({ name, fieldDef, readOnly, field }) => (
 *     <div className="flex flex-col gap-1.5">
 *       <Label htmlFor={name}>{fieldDef.label || name}</Label>
 *       <Input
 *         id={name}
 *         value={field.state.value ?? ""}
 *         onChange={(e) => field.handleChange(e.target.value)}
 *         onBlur={field.handleBlur}
 *         readOnly={readOnly}
 *       />
 *       {field.state.meta.errors[0] && (
 *         <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
 *       )}
 *     </div>
 *   ),
 * )
 * ```
 */
export function createFieldInput<TValue, TField extends AdminField>(
  render: (
    // eslint-disable-next-line no-unused-vars
    props: InputComponentProps<TField> & { field: TypedFieldApi<TValue> },
  ) => ReactNode,
) {
  return function FieldInput(
    props: InputComponentProps<TField> & { field?: TypedFieldApi<TValue> },
  ) {
    const form = useContext(AppFormContext);

    if (props.field) {
      return render({ ...props, field: props.field });
    }

    if (!form) {
      throw new Error(
        `Field "${props.name}" must be rendered inside <AppForm> or receive an explicit field prop.`,
      );
    }

    return (
      <form.Field name={props.name}>
        {(fieldApi: TypedFieldApi<TValue>) =>
          render({ ...props, field: fieldApi })
        }
      </form.Field>
    );
  };
}
