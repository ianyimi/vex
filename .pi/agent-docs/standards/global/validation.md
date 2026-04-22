## Validation Standards

### Validation Layers

This project validates data at multiple layers:

| Layer | Tool | Purpose |
|-------|------|---------|
| **Convex Functions** | Convex validators (`v`) | Runtime validation of function arguments |
| **Forms** | TanStack Form + Zod | Client-side validation with user feedback |
| **Schema (Forms/API)** | Zod | Shared validation schemas between layers |
| **Schema (Effect)** | Effect Schema | Typed errors and workflow data in Convex actions |

### Convex Argument Validation

**Always use validators on public functions**:
```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(v.literal("admin"), v.literal("member")),
    settings: v.optional(v.object({
      notifications: v.boolean(),
      theme: v.union(v.literal("light"), v.literal("dark")),
    })),
  },
  handler: async (ctx, args) => {
    // args are type-safe and validated
    return await ctx.db.insert("users", args);
  },
});
```

**Common Convex validators**:
```typescript
v.string()                          // String
v.number()                          // Number
v.boolean()                         // Boolean
v.id("tableName")                   // Document ID reference
v.array(v.string())                 // Array of strings
v.object({ key: v.string() })       // Object with shape
v.optional(v.string())              // Optional field
v.union(v.literal("a"), v.literal("b"))  // Enum/union
v.any()                             // Any (avoid when possible)
```

### Zod Schema Validation

**Define reusable schemas**:
```typescript
// lib/schemas/user.ts
import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]),
});

export const createUserSchema = userSchema.omit({ role: true }).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

**Validation patterns**:
```typescript
// String validations
z.string().min(1, "Required")
z.string().max(100, "Too long")
z.string().email("Invalid email")
z.string().url("Invalid URL")
z.string().regex(/^[a-z]+$/, "Lowercase only")

// Number validations
z.number().min(0, "Must be positive")
z.number().max(100, "Max 100")
z.number().int("Must be integer")

// Arrays
z.array(z.string()).min(1, "At least one required")
z.array(z.string()).max(10, "Max 10 items")

// Objects
z.object({}).strict()  // No extra keys allowed
z.object({}).passthrough()  // Allow extra keys

// Refinements
z.string().refine(
  (val) => !val.includes("bad"),
  "Cannot contain 'bad'"
)
```

### Form Validation with TanStack Form

**Integrate Zod with TanStack Form**:
```tsx
import { useForm } from "@tanstack/react-form";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Min 8 characters"),
});

function LoginForm() {
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: {
      onChange: ({ value }) => {
        const result = schema.safeParse(value);
        if (!result.success) {
          // Return field-specific errors
          const errors: Record<string, string> = {};
          result.error.issues.forEach((issue) => {
            const path = issue.path.join(".");
            errors[path] = issue.message;
          });
          return errors;
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      // Value is validated
    },
  });
}
```

**Field-level validation**:
```tsx
<form.Field
  name="email"
  validators={{
    onChange: ({ value }) => {
      if (!value) return "Email is required";
      if (!value.includes("@")) return "Invalid email";
      return undefined;
    },
    onBlur: ({ value }) => {
      // Additional validation on blur
    },
  }}
>
  {(field) => /* ... */}
</form.Field>
```

### Validation Timing

| Timing | Use Case |
|--------|----------|
| `onChange` | Real-time feedback for simple validations |
| `onBlur` | Expensive validations, async checks |
| `onSubmit` | Final validation before submission |
| `onChangeAsync` | Server-side checks (email exists, username taken) |

**Async validation with debounce**:
```tsx
<form.Field
  name="username"
  validators={{
    onChangeAsync: async ({ value }) => {
      const taken = await checkUsernameTaken(value);
      if (taken) return "Username already taken";
      return undefined;
    },
    onChangeAsyncDebounceMs: 500,
  }}
>
```

### Best Practices

- **Validate at boundaries**: Always validate in Convex functions (server-side)
- **Client-side for UX**: Use form validation for immediate feedback
- **Share schemas**: Define Zod schemas once, use in forms and API validation
- **Specific error messages**: Tell users exactly what's wrong and how to fix it
- **Fail early**: Validate before processing, not after
- **Allowlists over blocklists**: Define what's allowed, not what's forbidden
- **Sanitize input**: Prevent injection attacks by validating and escaping

### Cross-Field Validation

```typescript
const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"], // Show error on this field
  }
);
```

### Related Standards

- See [error-handling.md](./error-handling.md) for displaying validation errors
- See [frontend/forms.md](../frontend/forms.md) for form implementation
- See [backend/api.md](../backend/api.md) for Convex argument validation
