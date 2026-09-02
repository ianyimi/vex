# Custom Admin Components Implementation Spec

This document defines the implementation plan for Vex CMS custom admin panel components. It covers the hooks API for building custom field components, component registration, and UI fields.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 1.8

**Depends on**: [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) - Field types and metadata

---

## Design Goals

1. **PayloadCMS-familiar API** - Mirror `useField`, `useForm`, `useFormFields` patterns for easy migration
2. **Minimal component props** - Components receive `path` and `field` config, use hooks for state
3. **Legend State for reactivity** - Use @legendapp/state for performant, fine-grained form state
4. **TanStack Form integration** - Use @tanstack/react-form for form inputs and validation
5. **Export input primitives** - `TextInput`, `SelectInput`, etc. for composition in custom fields
6. **UI fields** - Support non-persisted fields for computed displays, actions, and embedded widgets

---

## How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CUSTOM FIELD COMPONENT FLOW                       │
│                                                                      │
│  1. Field config specifies custom component                          │
│     └── admin: { components: { Field: '~/components/ColorField' } }  │
│                                                                      │
│  2. Form renders field component with props                          │
│     └── <ColorField path="primaryColor" field={fieldConfig} />       │
│                                                                      │
│  3. Component uses hooks to interact with form state                 │
│     ├── const { value, setValue } = useField({ path })               │
│     ├── const { submit, isSubmitting } = useForm()                   │
│     └── const title = useFormFields(s => s.title.value)              │
│                                                                      │
│  4. Component renders custom UI                                      │
│     └── <ColorPicker value={value} onChange={setValue} />            │
│                                                                      │
│  5. Changes flow back to form state                                  │
│     └── Legend State updates → TanStack Form validates → UI syncs    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Type Definitions

### Field Component Props

```typescript
/**
 * Props passed to all field components (built-in and custom)
 */
interface FieldComponentProps<TField extends VexField<any, any> = VexField<any, any>> {
  /**
   * Dot-notation path to this field in the form
   * e.g., "title", "meta.description", "blocks.0.content"
   */
  path: string;

  /**
   * Field configuration from collection/block definition
   * Includes _meta with label, description, required, admin config, etc.
   */
  field: TField;

  /**
   * Schema path for nested fields (differs from path for array items)
   * e.g., path="blocks.0.title" but schemaPath="blocks.title"
   */
  schemaPath?: string;
}

/**
 * Props for specific field types (narrowed generics)
 */
type TextFieldComponentProps = FieldComponentProps<VexField<any, TextFieldMeta>>;
type SelectFieldComponentProps = FieldComponentProps<VexField<any, SelectFieldMeta<string>>>;
type UploadFieldComponentProps = FieldComponentProps<VexField<any, UploadFieldMeta>>;
// ... etc for each field type
```

### Form State Types

```typescript
import { Observable } from '@legendapp/state';

/**
 * State for a single field in the form
 */
interface FieldState<TValue = unknown> {
  /** Current field value */
  value: TValue;

  /** Initial value when form loaded */
  initialValue: TValue;

  /** Whether field has been modified */
  isDirty: boolean;

  /** Whether field has been touched (blurred) */
  isTouched: boolean;

  /** Validation error message (null if valid) */
  error: string | null;

  /** Whether field is currently validating */
  isValidating: boolean;

  /** Custom components for this field */
  customComponents?: {
    Field?: React.ComponentType<FieldComponentProps>;
    Cell?: React.ComponentType<CellComponentProps>;
    Filter?: React.ComponentType<FilterComponentProps>;
  };

  /** Row data for array fields */
  rows?: RowState[];
}

/**
 * Row state for array/blocks fields
 */
interface RowState {
  id: string;
  isCollapsed: boolean;
  blockType?: string; // For blocks fields
}

/**
 * Complete form state (Legend State observable)
 */
interface FormState {
  /** All field states keyed by path */
  fields: Record<string, FieldState>;

  /** Whether form has been submitted */
  isSubmitted: boolean;

  /** Whether form is currently submitting */
  isSubmitting: boolean;

  /** Whether form is processing in background (autosave) */
  isBackgroundProcessing: boolean;

  /** Whether any field has been modified */
  isModified: boolean;

  /** Whether form is initializing */
  isInitializing: boolean;

  /** Whether form passes validation */
  isValid: boolean;

  /** Document ID (null for create) */
  documentId: string | null;

  /** Collection name */
  collection: string;
}

/**
 * Observable form state type
 */
type ObservableFormState = Observable<FormState>;
```

### Hook Return Types

```typescript
/**
 * Return type for useField hook
 */
interface UseFieldReturn<TValue = unknown> {
  /** Current field value */
  value: TValue;

  /** Initial value when form loaded */
  initialValue: TValue;

  /** Set field value */
  setValue: (value: TValue, options?: SetValueOptions) => void;

  /** Field path */
  path: string;

  /** Whether field has validation error */
  showError: boolean;

  /** Error message (null if valid) */
  errorMessage: string | null;

  /** Whether field is disabled */
  disabled: boolean;

  /** Whether form is initializing */
  formInitializing: boolean;

  /** Whether form is submitting */
  formSubmitting: boolean;

  /** Whether form has been submitted */
  formSubmitted: boolean;

  /** Whether field value passes validation */
  valid: boolean;

  /** Mark field as touched */
  setTouched: (touched: boolean) => void;

  /** Row states for array fields */
  rows?: RowState[];

  /** Filter options for relationship/select fields */
  filterOptions?: FilterOption[];
}

interface SetValueOptions {
  /** Don't mark form as modified */
  disableModifyingForm?: boolean;
}

/**
 * Return type for useForm hook
 */
interface UseFormReturn {
  /** Submit the form */
  submit: (options?: SubmitOptions) => Promise<SubmitResult>;

  /** Validate all fields */
  validateForm: () => Promise<boolean>;

  /** Reset form to initial state */
  reset: (data?: Record<string, unknown>) => void;

  /** Get all field values as data object */
  getData: () => Record<string, unknown>;

  /** Get data at specific path */
  getDataByPath: <T = unknown>(path: string) => T;

  /** Get sibling data (for conditional fields) */
  getSiblingData: (path: string) => Record<string, unknown>;

  /** Get field state */
  getField: (path: string) => FieldState | undefined;

  /** Dispatch field action (add row, remove row, etc.) */
  dispatchFields: (action: FieldAction) => void;

  /** Add a row to array/blocks field */
  addFieldRow: (options: AddRowOptions) => void;

  /** Remove a row from array/blocks field */
  removeFieldRow: (options: RemoveRowOptions) => void;

  /** Move a row in array/blocks field */
  moveFieldRow: (options: MoveRowOptions) => void;

  /** Form state flags */
  isSubmitting: boolean;
  isSubmitted: boolean;
  isModified: boolean;
  isValid: boolean;
  isInitializing: boolean;
  disabled: boolean;

  /** Set form-level state */
  setModified: (modified: boolean) => void;
  setSubmitted: (submitted: boolean) => void;
  setProcessing: (processing: boolean) => void;
  setDisabled: (disabled: boolean) => void;

  /** Form ref for native form element */
  formRef: React.RefObject<HTMLFormElement>;
}

interface SubmitOptions {
  /** Skip client-side validation */
  skipValidation?: boolean;

  /** Additional data to merge */
  overrides?: Record<string, unknown>;

  /** Action URL override */
  action?: string;
}

interface SubmitResult {
  success: boolean;
  data?: Record<string, unknown>;
  errors?: ValidationError[];
}
```

### Admin Config Types

```typescript
/**
 * Extended admin config for fields with custom components
 */
interface FieldAdminConfig extends BaseAdminConfig {
  /**
   * Custom components for this field
   */
  components?: {
    /**
     * Custom field component (replaces entire field rendering)
     * Import path string resolved at build time
     */
    Field?: string;

    /**
     * Custom cell component for list view
     */
    Cell?: string;

    /**
     * Custom filter component for list filtering
     */
    Filter?: string;

    /**
     * Custom label component
     */
    Label?: string;

    /**
     * Custom error component
     */
    Error?: string;

    /**
     * Custom description component
     */
    Description?: string;
  };
}
```

### UI Field Types

```typescript
/**
 * UI field metadata - no database column, renders component only
 */
interface UIFieldMeta extends BaseFieldMeta {
  readonly type: 'ui';

  admin: BaseAdminConfig & {
    /**
     * Required: component to render
     */
    components: {
      Field: string;
    };
  };
}

/**
 * UI field has no validator (not stored in database)
 */
type UIField = VexField<never, UIFieldMeta>;
```

---

## Hooks Implementation

### useField

```typescript
/**
 * @vexcms/admin-next/hooks/useField.ts
 *
 * Get and set the value of a form field
 */
interface UseFieldOptions {
  /**
   * Field path. If not provided, uses path from FieldPathContext.
   */
  path?: string;

  /**
   * Client-side validation function
   */
  validate?: (value: unknown) => string | null | Promise<string | null>;
}

function useField<TValue = unknown>(
  options?: UseFieldOptions
): UseFieldReturn<TValue>;
```

#### `useField`

Primary hook for custom field components.

**Must accomplish:**
- Get path from options or from FieldPathContext
- Subscribe to field state in Legend State store
- Return current value, setValue function, error state
- Handle form-level disabled state
- Support nested paths (dot notation)

**Implementation outline:**

```typescript
import { useObservable, useSelector } from '@legendapp/state/react';
import { useFormContext } from './FormContext';
import { useFieldPath } from './FieldPathContext';

export function useField<TValue = unknown>(
  options: UseFieldOptions = {}
): UseFieldReturn<TValue> {
  const formState = useFormContext();
  const contextPath = useFieldPath();
  const path = options.path ?? contextPath;

  if (!path) {
    throw new Error('useField requires a path via options or FieldPathContext');
  }

  // Subscribe to specific field state (fine-grained reactivity)
  const fieldState = useSelector(() => formState.fields[path].get());
  const formFlags = useSelector(() => ({
    isSubmitting: formState.isSubmitting.get(),
    isSubmitted: formState.isSubmitted.get(),
    isInitializing: formState.isInitializing.get(),
    disabled: formState.disabled.get(),
  }));

  const setValue = useCallback((value: TValue, opts?: SetValueOptions) => {
    formState.fields[path].value.set(value);
    formState.fields[path].isDirty.set(true);

    if (!opts?.disableModifyingForm) {
      formState.isModified.set(true);
    }

    // Trigger validation if configured
    if (options.validate) {
      validateField(path, value, options.validate);
    }
  }, [path, options.validate]);

  const setTouched = useCallback((touched: boolean) => {
    formState.fields[path].isTouched.set(touched);
  }, [path]);

  return {
    value: fieldState?.value as TValue,
    initialValue: fieldState?.initialValue as TValue,
    setValue,
    path,
    showError: formFlags.isSubmitted && !!fieldState?.error,
    errorMessage: fieldState?.error ?? null,
    disabled: formFlags.disabled,
    formInitializing: formFlags.isInitializing,
    formSubmitting: formFlags.isSubmitting,
    formSubmitted: formFlags.isSubmitted,
    valid: !fieldState?.error,
    setTouched,
    rows: fieldState?.rows,
    filterOptions: fieldState?.filterOptions,
  };
}
```

**Edge cases:**
- Path doesn't exist in form state: return undefined values, don't error (field may be conditionally rendered)
- Deeply nested path: traverse Legend State properly
- Array index paths: handle `items.0.name` correctly
- Field removed while hook mounted: handle gracefully

---

### useForm

```typescript
/**
 * @vexcms/admin-next/hooks/useForm.ts
 *
 * Get form state and methods
 */
function useForm(): UseFormReturn;
```

#### `useForm`

Access form-level state and actions.

**Must accomplish:**
- Return submit, validate, reset functions
- Return form state flags (isSubmitting, isModified, etc.)
- Provide getData/getDataByPath utilities
- Provide array manipulation functions (addFieldRow, removeFieldRow, etc.)

**Implementation outline:**

```typescript
import { useSelector } from '@legendapp/state/react';
import { useFormContext, useFormActions } from './FormContext';

export function useForm(): UseFormReturn {
  const formState = useFormContext();
  const actions = useFormActions();

  const flags = useSelector(() => ({
    isSubmitting: formState.isSubmitting.get(),
    isSubmitted: formState.isSubmitted.get(),
    isModified: formState.isModified.get(),
    isValid: formState.isValid.get(),
    isInitializing: formState.isInitializing.get(),
    disabled: formState.disabled.get(),
  }));

  return {
    submit: actions.submit,
    validateForm: actions.validateForm,
    reset: actions.reset,
    getData: actions.getData,
    getDataByPath: actions.getDataByPath,
    getSiblingData: actions.getSiblingData,
    getField: (path) => formState.fields[path].get(),
    dispatchFields: actions.dispatchFields,
    addFieldRow: actions.addFieldRow,
    removeFieldRow: actions.removeFieldRow,
    moveFieldRow: actions.moveFieldRow,
    ...flags,
    setModified: (v) => formState.isModified.set(v),
    setSubmitted: (v) => formState.isSubmitted.set(v),
    setProcessing: (v) => formState.isSubmitting.set(v),
    setDisabled: (v) => formState.disabled.set(v),
    formRef: actions.formRef,
  };
}
```

**Edge cases:**
- Called outside FormProvider: throw helpful error
- Submit while already submitting: prevent double submit
- Reset with partial data: merge with defaults

---

### useFormFields

```typescript
/**
 * @vexcms/admin-next/hooks/useFormFields.ts
 *
 * Select specific fields from form state (performance optimization)
 */
type FieldsSelector<TResult> = (fields: Record<string, FieldState>) => TResult;

function useFormFields<TResult>(selector: FieldsSelector<TResult>): TResult;
```

#### `useFormFields`

Select specific fields for performance (avoids re-render on unrelated field changes).

**Must accomplish:**
- Accept selector function
- Only re-render when selected value changes
- Use Legend State's fine-grained reactivity

**Implementation:**

```typescript
import { useSelector } from '@legendapp/state/react';
import { useFormContext } from './FormContext';

export function useFormFields<TResult>(
  selector: FieldsSelector<TResult>
): TResult {
  const formState = useFormContext();

  return useSelector(() => {
    const fields = formState.fields.get();
    return selector(fields);
  });
}
```

**Usage example:**

```typescript
// Only re-renders when title or slug change
const { title, slug } = useFormFields((fields) => ({
  title: fields.title?.value as string,
  slug: fields.slug?.value as string,
}));
```

---

### useAllFormFields

```typescript
/**
 * @vexcms/admin-next/hooks/useAllFormFields.ts
 *
 * Get all form fields (use sparingly - re-renders on any field change)
 */
function useAllFormFields(): Record<string, FieldState>;
```

#### `useAllFormFields`

Get all fields at once. Use sparingly.

**Must accomplish:**
- Return all field states
- Warn in dev mode about performance implications

**Implementation:**

```typescript
export function useAllFormFields(): Record<string, FieldState> {
  const formState = useFormContext();

  if (process.env.NODE_ENV === 'development') {
    console.warn(
      'useAllFormFields causes re-render on any field change. ' +
      'Consider useFormFields with a selector for better performance.'
    );
  }

  return useSelector(() => formState.fields.get());
}
```

---

### State Flag Hooks

```typescript
/**
 * Individual state flag hooks for granular subscriptions
 */
function useFormSubmitted(): boolean;
function useFormProcessing(): boolean;
function useFormModified(): boolean;
function useFormInitializing(): boolean;
function useFormBackgroundProcessing(): boolean;
```

Each subscribes only to its specific flag, minimizing re-renders.

---

## Form Provider

### FormProvider Component

```typescript
/**
 * @vexcms/admin-next/components/FormProvider.tsx
 *
 * Provides form state context to field components
 */
interface FormProviderProps {
  /** Initial form data */
  initialData?: Record<string, unknown>;

  /** Collection configuration */
  collection: VexCollection<any>;

  /** Document ID (null for create) */
  documentId?: string | null;

  /** Form submission handler */
  onSubmit?: (data: Record<string, unknown>) => Promise<void>;

  /** Children */
  children: React.ReactNode;

  /** Disable all fields */
  disabled?: boolean;
}
```

#### `FormProvider`

Provides Legend State store and TanStack Form integration.

**Must accomplish:**
- Initialize Legend State observable with field states from collection config
- Set up TanStack Form instance for validation
- Provide context for hooks
- Handle form submission with validation
- Support autosave integration

**Implementation outline:**

```typescript
import { observable } from '@legendapp/state';
import { useForm as useTanStackForm } from '@tanstack/react-form';
import { createContext, useContext, useMemo, useRef } from 'react';

const FormStateContext = createContext<ObservableFormState | null>(null);
const FormActionsContext = createContext<FormActions | null>(null);

export function FormProvider({
  initialData,
  collection,
  documentId,
  onSubmit,
  children,
  disabled = false,
}: FormProviderProps) {
  // Initialize Legend State store
  const formState = useMemo(() => {
    const fields = buildInitialFieldStates(collection.config.fields, initialData);

    return observable<FormState>({
      fields,
      isSubmitted: false,
      isSubmitting: false,
      isBackgroundProcessing: false,
      isModified: false,
      isInitializing: false,
      isValid: true,
      documentId: documentId ?? null,
      collection: collection.name,
    });
  }, []);

  // TanStack Form for validation
  const tanstackForm = useTanStackForm({
    defaultValues: initialData ?? {},
    onSubmit: async ({ value }) => {
      formState.isSubmitting.set(true);
      try {
        await onSubmit?.(value);
        formState.isSubmitted.set(true);
        formState.isModified.set(false);
      } finally {
        formState.isSubmitting.set(false);
      }
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const actions = useMemo(() => ({
    submit: tanstackForm.handleSubmit,
    validateForm: async () => {
      await tanstackForm.validate();
      return tanstackForm.state.isValid;
    },
    reset: (data?: Record<string, unknown>) => {
      tanstackForm.reset(data);
      // Reset Legend State
      const fields = buildInitialFieldStates(collection.config.fields, data);
      formState.fields.set(fields);
      formState.isModified.set(false);
      formState.isSubmitted.set(false);
    },
    getData: () => tanstackForm.state.values,
    getDataByPath: <T,>(path: string) => getByPath(tanstackForm.state.values, path) as T,
    getSiblingData: (path: string) => getSiblingData(tanstackForm.state.values, path),
    dispatchFields: (action: FieldAction) => dispatchFieldAction(formState, action),
    addFieldRow: (opts: AddRowOptions) => addRow(formState, opts),
    removeFieldRow: (opts: RemoveRowOptions) => removeRow(formState, opts),
    moveFieldRow: (opts: MoveRowOptions) => moveRow(formState, opts),
    formRef,
  }), [tanstackForm, collection]);

  return (
    <FormStateContext.Provider value={formState}>
      <FormActionsContext.Provider value={actions}>
        <form ref={formRef} onSubmit={tanstackForm.handleSubmit}>
          {children}
        </form>
      </FormActionsContext.Provider>
    </FormStateContext.Provider>
  );
}

export function useFormContext(): ObservableFormState {
  const ctx = useContext(FormStateContext);
  if (!ctx) {
    throw new Error('useFormContext must be used within FormProvider');
  }
  return ctx;
}

export function useFormActions(): FormActions {
  const ctx = useContext(FormActionsContext);
  if (!ctx) {
    throw new Error('useFormActions must be used within FormProvider');
  }
  return ctx;
}
```

---

## Field Path Context

```typescript
/**
 * @vexcms/admin-next/components/FieldPathContext.tsx
 *
 * Provides current field path for nested field components
 */
const FieldPathContext = createContext<string | null>(null);

export function FieldPathProvider({
  path,
  children,
}: {
  path: string;
  children: React.ReactNode;
}) {
  return (
    <FieldPathContext.Provider value={path}>
      {children}
    </FieldPathContext.Provider>
  );
}

export function useFieldPath(): string | null {
  return useContext(FieldPathContext);
}
```

Used by RenderFields to provide path context so custom components can call `useField()` without explicitly passing path.

---

## Component Registration & Resolution

### Build-Time Resolution

Component paths are resolved at build time (similar to PayloadCMS).

```typescript
/**
 * Field config with custom component
 */
const colorField = text({
  label: 'Primary Color',
  admin: {
    components: {
      Field: '~/components/admin/ColorField',
    },
  },
});
```

### Resolution Process

1. **Schema parsing**: Extract component paths from field configs
2. **Build step**: Generate import map for all custom components
3. **Runtime**: RenderFields looks up component from import map

```typescript
/**
 * Generated at build time
 * @vexcms/admin-next/.generated/componentMap.ts
 */
import ColorField from '~/components/admin/ColorField';
import IconPicker from '~/components/admin/IconPicker';

export const componentMap: Record<string, React.ComponentType<FieldComponentProps>> = {
  '~/components/admin/ColorField': ColorField,
  '~/components/admin/IconPicker': IconPicker,
};
```

### RenderField Component

```typescript
/**
 * @vexcms/admin-next/components/RenderField.tsx
 *
 * Renders a single field with appropriate component
 */
interface RenderFieldProps {
  path: string;
  field: VexField<any, any>;
  schemaPath?: string;
}

function RenderField({ path, field, schemaPath }: RenderFieldProps) {
  const customComponentPath = field._meta.admin?.components?.Field;

  // Check for custom component
  if (customComponentPath) {
    const CustomComponent = componentMap[customComponentPath];
    if (CustomComponent) {
      return (
        <FieldPathProvider path={path}>
          <CustomComponent path={path} field={field} schemaPath={schemaPath} />
        </FieldPathProvider>
      );
    }
    console.warn(`Custom component not found: ${customComponentPath}`);
  }

  // Use built-in component based on field type
  const BuiltInComponent = builtInComponents[field._meta.type];
  return (
    <FieldPathProvider path={path}>
      <BuiltInComponent path={path} field={field} schemaPath={schemaPath} />
    </FieldPathProvider>
  );
}
```

---

## Input Primitives

### Exported Primitives

```typescript
/**
 * @vexcms/admin-next/components/inputs/index.ts
 *
 * Exportable input primitives for custom field composition
 */
export { TextInput } from './TextInput';
export { TextareaInput } from './TextareaInput';
export { NumberInput } from './NumberInput';
export { SelectInput } from './SelectInput';
export { CheckboxInput } from './CheckboxInput';
export { DateInput } from './DateInput';
export { RelationshipInput } from './RelationshipInput';
export { UploadInput } from './UploadInput';
```

### TextInput Example

```typescript
/**
 * @vexcms/admin-next/components/inputs/TextInput.tsx
 */
interface TextInputProps {
  /** Input value */
  value: string;

  /** Change handler */
  onChange: (value: string) => void;

  /** Blur handler */
  onBlur?: () => void;

  /** Placeholder text */
  placeholder?: string;

  /** Disabled state */
  disabled?: boolean;

  /** Error state */
  hasError?: boolean;

  /** HTML input type */
  type?: 'text' | 'email' | 'url' | 'password';

  /** Additional class names */
  className?: string;

  /** Input ID */
  id?: string;

  /** Aria label */
  'aria-label'?: string;

  /** Min/max length */
  minLength?: number;
  maxLength?: number;
}

export function TextInput({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  hasError,
  type = 'text',
  className,
  id,
  'aria-label': ariaLabel,
  minLength,
  maxLength,
}: TextInputProps) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'vex-input',
        hasError && 'vex-input--error',
        disabled && 'vex-input--disabled',
        className
      )}
      id={id}
      aria-label={ariaLabel}
      aria-invalid={hasError}
      minLength={minLength}
      maxLength={maxLength}
    />
  );
}
```

### Using Primitives in Custom Field

```typescript
// ~/components/admin/ColorField.tsx
'use client';

import { useField } from '@vexcms/admin-next';
import { TextInput } from '@vexcms/admin-next/inputs';
import type { FieldComponentProps } from '@vexcms/admin-next';

export default function ColorField({ path, field }: FieldComponentProps) {
  const { value, setValue, showError, errorMessage, disabled } = useField<string>({ path });

  return (
    <div className="vex-field">
      <label className="vex-field__label">
        {field._meta.label}
        {field._meta.required && <span className="vex-field__required">*</span>}
      </label>

      <div className="flex gap-2">
        {/* Color preview */}
        <div
          className="w-10 h-10 rounded border"
          style={{ backgroundColor: value || '#000000' }}
        />

        {/* Use primitive input */}
        <TextInput
          value={value ?? ''}
          onChange={setValue}
          placeholder="#000000"
          disabled={disabled}
          hasError={showError}
        />

        {/* Color picker button */}
        <ColorPickerPopover value={value} onChange={setValue} />
      </div>

      {showError && (
        <p className="vex-field__error">{errorMessage}</p>
      )}

      {field._meta.description && (
        <p className="vex-field__description">{field._meta.description}</p>
      )}
    </div>
  );
}
```

---

## UI Fields

### Definition

```typescript
/**
 * @vexcms/core/fields/ui.ts
 *
 * UI field factory - creates non-persisted fields
 */
interface UIFieldOptions {
  /** Display label */
  label?: string;

  /** Admin configuration (component required) */
  admin: {
    components: {
      /** Required: component to render */
      Field: string;
    };
    /** Conditional display */
    condition?: (data: any, siblingData: any) => boolean;
    /** Position in form */
    position?: 'main' | 'sidebar';
  };
}

function ui(options: UIFieldOptions): UIField {
  return {
    _validator: undefined, // No validator - not stored
    _meta: {
      type: 'ui',
      label: options.label,
      admin: options.admin,
    },
  };
}
```

### Schema Generation

UI fields are skipped during `vex.schema.ts` generation:

```typescript
// In generateVexSchema()
function extractValidators(fields: Record<string, VexField<any, any>>) {
  const validators: Record<string, Validator> = {};

  for (const [name, field] of Object.entries(fields)) {
    // Skip UI fields - they have no database representation
    if (field._meta.type === 'ui') {
      continue;
    }

    validators[name] = extractValidator(field);
  }

  return validators;
}
```

### UI Field Examples

```typescript
// Word count display
ui({
  label: 'Word Count',
  admin: {
    components: {
      Field: '~/components/admin/WordCount',
    },
  },
}),

// SEO score indicator
ui({
  label: 'SEO Score',
  admin: {
    components: {
      Field: '~/components/admin/SEOScore',
    },
    position: 'sidebar',
  },
}),

// Action button
ui({
  admin: {
    components: {
      Field: '~/components/admin/SyncToCRM',
    },
  },
}),
```

### UI Field Component Example

```typescript
// ~/components/admin/WordCount.tsx
'use client';

import { useFormFields } from '@vexcms/admin-next';
import type { FieldComponentProps } from '@vexcms/admin-next';

export default function WordCount({ field }: FieldComponentProps) {
  // Watch the content field
  const content = useFormFields((fields) => fields.content?.value as string);

  const wordCount = content?.split(/\s+/).filter(Boolean).length ?? 0;
  const charCount = content?.length ?? 0;

  return (
    <div className="vex-ui-field">
      {field._meta.label && (
        <label className="vex-field__label">{field._meta.label}</label>
      )}
      <div className="text-sm text-muted-foreground">
        {wordCount} words · {charCount} characters
      </div>
    </div>
  );
}
```

---

## Configuration Examples

### Custom Field Component

```typescript
// collections/pages.ts
import { defineCollection, text, blocks } from '@vexcms/core';
import { pageBlocks } from '../blocks';

export const pages = defineCollection('pages', {
  fields: {
    title: text({ label: 'Title', required: true }),

    // Custom color picker field
    primaryColor: text({
      label: 'Primary Color',
      defaultValue: '#3b82f6',
      admin: {
        components: {
          Field: '~/components/admin/ColorField',
        },
      },
    }),

    // Custom icon selector
    icon: text({
      label: 'Icon',
      admin: {
        components: {
          Field: '~/components/admin/IconPicker',
        },
      },
    }),

    content: blocks({ blocks: pageBlocks }),
  },
});
```

### UI Fields for Display

```typescript
// collections/posts.ts
import { defineCollection, text, textarea, ui } from '@vexcms/core';

export const posts = defineCollection('posts', {
  fields: {
    title: text({ label: 'Title', required: true }),
    content: textarea({ label: 'Content', required: true }),

    // UI field: word count display
    wordCount: ui({
      label: 'Statistics',
      admin: {
        components: {
          Field: '~/components/admin/ContentStats',
        },
      },
    }),

    // UI field: SEO preview
    seoPreview: ui({
      label: 'Search Preview',
      admin: {
        components: {
          Field: '~/components/admin/SEOPreview',
        },
        position: 'sidebar',
      },
    }),

    metaTitle: text({ label: 'Meta Title' }),
    metaDescription: textarea({ label: 'Meta Description' }),
  },
});
```

### Using Hooks in Custom Components

```typescript
// ~/components/admin/SEOPreview.tsx
'use client';

import { useFormFields, useFormModified } from '@vexcms/admin-next';
import type { FieldComponentProps } from '@vexcms/admin-next';

export default function SEOPreview({ field }: FieldComponentProps) {
  const { title, metaTitle, metaDescription, slug } = useFormFields((fields) => ({
    title: fields.title?.value as string,
    metaTitle: fields.metaTitle?.value as string,
    metaDescription: fields.metaDescription?.value as string,
    slug: fields.slug?.value as string,
  }));

  const isModified = useFormModified();

  const displayTitle = metaTitle || title || 'Untitled';
  const displayUrl = `https://example.com/${slug || 'page'}`;

  return (
    <div className="vex-ui-field">
      <label className="vex-field__label">
        {field._meta.label}
        {isModified && <span className="text-yellow-500 ml-2">Unsaved</span>}
      </label>

      {/* Google-style preview */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="text-blue-600 text-lg hover:underline cursor-pointer">
          {displayTitle}
        </div>
        <div className="text-green-700 text-sm">{displayUrl}</div>
        <div className="text-gray-600 text-sm line-clamp-2">
          {metaDescription || 'No description provided'}
        </div>
      </div>
    </div>
  );
}
```

---

## File Structure

Form hooks, field components, and input primitives live in `@vexcms/ui` (shared).
Framework-specific component resolution and routing lives in `@vexcms/admin-next`.

```
packages/ui/                       # @vexcms/ui (shared React components)
├── src/
│   ├── hooks/
│   │   ├── useField.ts          # Primary field hook
│   │   ├── useForm.ts           # Form state hook
│   │   ├── useFormFields.ts     # Selector hook
│   │   ├── useAllFormFields.ts  # All fields hook
│   │   ├── useFormSubmitted.ts  # State flag hooks
│   │   ├── useFormProcessing.ts
│   │   ├── useFormModified.ts
│   │   ├── useFormInitializing.ts
│   │   └── index.ts             # Re-exports
│   │
│   ├── forms/
│   │   ├── FormProvider.tsx     # Form context provider
│   │   ├── FieldPathContext.tsx # Field path context
│   │   ├── RenderField.tsx      # Field renderer
│   │   ├── RenderFields.tsx     # Renders all fields for a collection
│   │   │
│   │   ├── inputs/              # Exportable input primitives
│   │   │   ├── TextInput.tsx
│   │   │   ├── TextareaInput.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   ├── SelectInput.tsx
│   │   │   ├── CheckboxInput.tsx
│   │   │   ├── DateInput.tsx
│   │   │   ├── RelationshipInput.tsx
│   │   │   ├── UploadInput.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── fields/              # Built-in field components
│   │       ├── TextField.tsx
│   │       ├── NumberField.tsx
│   │       ├── SelectField.tsx
│   │       ├── CheckboxField.tsx
│   │       ├── DateField.tsx
│   │       ├── RelationshipField.tsx
│   │       ├── ArrayField.tsx
│   │       ├── GroupField.tsx
│   │       ├── BlocksField.tsx
│   │       ├── UploadField.tsx
│   │       ├── UIField.tsx
│   │       └── index.ts
│   │
│   ├── primitives/              # shadcn-based UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   └── index.ts
│   │
│   ├── layout/
│   │   ├── Layout.tsx            # Main admin shell (no routing)
│   │   ├── Header.tsx           # Top header bar
│   │   ├── UserMenu.tsx         # User dropdown
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── field.ts             # FieldComponentProps, etc.
│   │   ├── form.ts              # FormState, UseFieldReturn, etc.
│   │   └── index.ts
│   │
│   └── index.ts                 # Public exports
│
├── package.json
├── tsconfig.json
└── tsup.config.ts

packages/admin-next/               # @vexcms/admin-next
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx          # Uses next/link, usePathname
│   │   └── .generated/
│   │       └── componentMap.ts  # Generated import map for custom components
│   │
│   └── index.ts                 # Re-exports from @vexcms/ui + Next.js specific
│
├── package.json
└── tsconfig.json

packages/core/                     # @vexcms/core (no React)
├── src/
│   └── fields/
│       └── ui.ts                # ui() field factory
```

**Notes:**
- `@vexcms/ui` is pre-built with tsup (users get compiled JS + types)
- Users can import UI components directly: `import { Button, TextField } from '@vexcms/ui'`
- `@vexcms/admin-next` re-exports ui components for convenience
- Custom component resolution (componentMap) is framework-specific (build tooling differs)

---

## Package Exports

```typescript
// @vexcms/ui main export (shared components)
export {
  // Hooks
  useField,
  useForm,
  useFormFields,
  useAllFormFields,
  useFormSubmitted,
  useFormProcessing,
  useFormModified,
  useFormInitializing,
  useFormBackgroundProcessing,

  // Form Components
  FormProvider,
  FieldPathProvider,
  RenderField,
  RenderFields,

  // Layout Components
  Layout,
  Header,
  UserMenu,

  // Primitives (shadcn-based)
  Button,
  Card,
  Input,
  Select,
  Checkbox,

  // Input Primitives
  TextInput,
  TextareaInput,
  NumberInput,
  SelectInput,
  CheckboxInput,
  DateInput,
  RelationshipInput,
  UploadInput,

  // Field Components
  TextField,
  NumberField,
  SelectField,
  // ... etc

  // Types
  type FieldComponentProps,
  type UseFieldReturn,
  type UseFormReturn,
  type FieldState,
  type FormState,
} from '@vexcms/ui';

// @vexcms/admin-next re-exports ui + adds Next.js specific
export {
  // Re-export everything from @vexcms/ui
  // Plus Next.js specific:
  Sidebar,           // Uses next/link
  createVexAdmin,    // Setup function
} from '@vexcms/admin-next';
```

**Usage:**
- Import shared components from `@vexcms/ui` directly
- Import from `@vexcms/admin-next` for convenience (re-exports ui + adds Next.js specific)
- Users building custom admin views can use `@vexcms/ui` without the full admin package

---

## Testing Requirements

- Unit tests for `useField` hook (value get/set, error state, disabled state)
- Unit tests for `useForm` hook (submit, validate, reset)
- Unit tests for `useFormFields` selector (re-render optimization)
- Unit tests for UI field schema exclusion
- Integration tests for custom component rendering
- Integration tests for field path context propagation
- Integration tests for Legend State + TanStack Form sync
- E2E tests for custom field interaction
- E2E tests for UI field computed values
- Performance tests for large forms (many fields)
