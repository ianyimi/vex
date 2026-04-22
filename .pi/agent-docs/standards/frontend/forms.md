## Form Handling Standards (TanStack Form + shadcn)

### Overview

This project uses **TanStack Form** for form state management integrated with **shadcn/ui** components:
- Type-safe form handling with full TypeScript support
- Field-level and form-level validation
- Support for async validation and complex form patterns

### Basic Form Structure

```tsx
import { useForm } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ContactForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
    },
    onSubmit: async ({ value }) => {
      // Handle form submission
      console.log(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Name</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">
                {field.state.meta.errors.join(", ")}
              </p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Email</Label>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
          </div>
        )}
      </form.Field>

      <Button type="submit" disabled={form.state.isSubmitting}>
        {form.state.isSubmitting ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
}
```

### Field State

Each field provides access to:
- `field.state.value` - Current field value
- `field.state.meta.errors` - Array of validation errors
- `field.state.meta.isTouched` - Whether field has been interacted with
- `field.state.meta.isDirty` - Whether value differs from initial
- `field.handleChange(value)` - Update field value
- `field.handleBlur()` - Mark field as touched

### Validation

**Validation timing options**:
- `onChange` - Validate as user types
- `onBlur` - Validate when field loses focus
- `onSubmit` - Validate on form submission

**Field-level validation**:
```tsx
<form.Field
  name="email"
  validators={{
    onChange: ({ value }) => {
      if (!value) return "Email is required";
      if (!value.includes("@")) return "Invalid email format";
      return undefined;
    },
    onBlur: ({ value }) => {
      // Additional validation on blur
    },
  }}
>
  {(field) => (
    // ... field rendering
  )}
</form.Field>
```

**Async validation** (e.g., checking if email exists):
```tsx
<form.Field
  name="email"
  validators={{
    onChangeAsync: async ({ value }) => {
      const exists = await checkEmailExists(value);
      if (exists) return "Email already registered";
      return undefined;
    },
    onChangeAsyncDebounceMs: 500, // Debounce async validation
  }}
>
  {(field) => /* ... */}
</form.Field>
```

**Form-level validation** (cross-field validation):
```tsx
const form = useForm({
  defaultValues: { password: "", confirmPassword: "" },
  validators: {
    onChange: ({ value }) => {
      if (value.password !== value.confirmPassword) {
        return "Passwords do not match";
      }
      return undefined;
    },
  },
  onSubmit: async ({ value }) => { /* ... */ },
});
```

### Integration with Zod

Use Zod schemas for validation:
```tsx
import { z } from "zod";

const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be 18 or older"),
});

type UserFormData = z.infer<typeof userSchema>;

function UserForm() {
  const form = useForm({
    defaultValues: { name: "", email: "", age: 0 } as UserFormData,
    validators: {
      onChange: ({ value }) => {
        const result = userSchema.safeParse(value);
        if (!result.success) {
          return result.error.flatten().fieldErrors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => { /* ... */ },
  });
}
```

### shadcn Component Integration

**Select fields**:
```tsx
<form.Field name="role">
  {(field) => (
    <div className="space-y-2">
      <Label>Role</Label>
      <Select
        value={field.state.value}
        onValueChange={field.handleChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="admin">Admin</SelectItem>
          <SelectItem value="user">User</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )}
</form.Field>
```

**Checkbox fields**:
```tsx
<form.Field name="acceptTerms">
  {(field) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
      />
      <Label htmlFor={field.name}>Accept terms and conditions</Label>
    </div>
  )}
</form.Field>
```

**Switch fields**:
```tsx
<form.Field name="notifications">
  {(field) => (
    <div className="flex items-center justify-between">
      <Label htmlFor={field.name}>Enable notifications</Label>
      <Switch
        id={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
      />
    </div>
  )}
</form.Field>
```

### Dynamic Fields (Arrays)

```tsx
<form.Field name="emails" mode="array">
  {(field) => (
    <div className="space-y-2">
      {field.state.value.map((_, index) => (
        <form.Field key={index} name={`emails[${index}]`}>
          {(subField) => (
            <div className="flex gap-2">
              <Input
                value={subField.state.value}
                onChange={(e) => subField.handleChange(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => field.removeValue(index)}
              >
                Remove
              </Button>
            </div>
          )}
        </form.Field>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => field.pushValue("")}
      >
        Add Email
      </Button>
    </div>
  )}
</form.Field>
```

### Form Submission with Convex

```tsx
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateUserForm() {
  const createUser = useMutation(api.users.create);

  const form = useForm({
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => {
      try {
        await createUser(value);
        // Handle success (toast, redirect, etc.)
      } catch (error) {
        // Handle error
      }
    },
  });

  // ... form rendering
}
```

### Best Practices

- **Use field-level validation** for isolated field rules
- **Use form-level validation** for cross-field dependencies
- **Debounce async validation** to avoid excessive API calls
- **Show errors after touch** - only display errors after `isTouched` is true
- **Disable submit during submission** - use `form.state.isSubmitting`
- **Reset form on success** - call `form.reset()` after successful submission
- **Handle loading states** - show spinners during async operations

### Error Display Pattern

```tsx
{field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
  <p className="text-sm text-destructive">
    {field.state.meta.errors[0]}
  </p>
)}
```

### Related Standards

- See [components.md](./components.md) for shadcn component usage
- See [data-fetching.md](./data-fetching.md) for Convex integration with TanStack Query
