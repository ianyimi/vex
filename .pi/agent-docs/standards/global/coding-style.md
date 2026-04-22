## Coding Style Standards

### TypeScript

**Strict type safety**:
- Enable strict mode in `tsconfig.json`
- Avoid `any` - use `unknown` and type guards instead
- Use explicit return types on exported functions
- Leverage type inference for local variables

```typescript
// Good - explicit types where needed
export function getUser(id: Id<"users">): Promise<Doc<"users"> | null> {
  // ...
}

// Good - inferred types for locals
const users = await ctx.db.query("users").collect();

// Bad - any type
function processData(data: any) { /* ... */ }
```

**Import organization** (enforced by ESLint):
```typescript
// 1. External packages
import { useQuery } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";

// 2. Internal aliases (@/)
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 3. Relative imports
import { UserCard } from "./user-card";
```

### React

**Component structure**:
```tsx
// 1. Imports
import { useState } from "react";

// 2. Types/interfaces
interface UserProfileProps {
  userId: Id<"users">;
  onUpdate?: () => void;
}

// 3. Component
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Hooks first
  const [isEditing, setIsEditing] = useState(false);
  const user = useQuery(api.users.get, { id: userId });

  // Early returns for loading/error
  if (user === undefined) return <Skeleton />;

  // Event handlers
  const handleSave = async () => {
    // ...
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

**Naming conventions**:
- Components: `PascalCase` - `UserProfile`, `WorkflowCard`
- Hooks: `camelCase` with `use` prefix - `useAuth`, `useWorkflow`
- Event handlers: `handle` prefix - `handleClick`, `handleSubmit`
- Boolean props: `is`/`has`/`can` prefix - `isLoading`, `hasError`, `canEdit`

### Convex

**Function naming**:
```typescript
// convex/users.ts
export const get = query({ /* ... */ });      // Get single item
export const list = query({ /* ... */ });     // Get multiple items
export const create = mutation({ /* ... */ }); // Create item
export const update = mutation({ /* ... */ }); // Update item
export const remove = mutation({ /* ... */ }); // Delete item (not "delete")
```

**File organization**:
```
convex/
├── _generated/          # Auto-generated (don't edit)
├── schema.ts            # Database schema
├── users.ts             # User queries/mutations
├── workflows.ts         # Workflow queries/mutations
└── model/               # Helper functions
    └── users.ts         # User business logic
```

### Tailwind CSS

**Class ordering** (enforced by Prettier plugin):
1. Layout (`flex`, `grid`, `block`)
2. Positioning (`relative`, `absolute`)
3. Box model (`w-`, `h-`, `p-`, `m-`)
4. Typography (`text-`, `font-`)
5. Visual (`bg-`, `border-`, `shadow-`)
6. Interactive (`hover:`, `focus:`)
7. Responsive (`sm:`, `md:`, `lg:`)

```tsx
// Good - logical ordering
<div className="flex items-center gap-4 p-4 text-sm bg-background border rounded-lg hover:bg-accent sm:p-6">

// Avoid - random ordering
<div className="hover:bg-accent p-4 flex border sm:p-6 bg-background text-sm gap-4 items-center rounded-lg">
```

### General Principles

- **Consistent naming**: Use established conventions across the codebase
- **Automated formatting**: Let Prettier handle spacing, line breaks
- **Meaningful names**: `getUserWorkflows` not `getUW` or `data`
- **Small functions**: Keep functions focused on single tasks
- **Remove dead code**: Delete unused code, don't comment it out
- **No backward compatibility hacks**: Change code directly, don't add shims
- **DRY principle**: Extract common logic, but don't over-abstract

### Related Standards

- See [conventions.md](./conventions.md) for project structure
- See [frontend/components.md](../frontend/components.md) for component patterns
- See [backend/api.md](../backend/api.md) for Convex function patterns
