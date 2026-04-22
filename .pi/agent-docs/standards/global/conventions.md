## Project Conventions

### Directory Structure

```
your-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Auth-required routes (grouped)
│   │   ├── (public)/           # Public routes (grouped)
│   │   ├── layout.tsx          # Root layout
│   │   ├── globals.css         # Global styles, CSS variables
│   │   └── providers.tsx       # Context providers
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── forms/              # Form components
│   │   └── [feature]/          # Feature-specific components
│   ├── lib/
│   │   ├── utils.ts            # cn() and utilities
│   │   └── schemas/            # Zod schemas
│   └── hooks/                  # Custom React hooks
├── convex/
│   ├── _generated/             # Auto-generated (don't edit)
│   ├── schema.ts               # Database schema
│   ├── auth.ts                 # Auth configuration
│   ├── [resource].ts           # Resource queries/mutations
│   └── model/                  # Business logic helpers
├── e2e/                        # Playwright E2E tests
├── agent-os/                   # Agent documentation
│   ├── product/                # Mission, roadmap, tech stack
│   ├── specs/                  # Feature specifications
│   └── standards/              # Coding standards
└── public/                     # Static assets
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| React Components | `kebab-case.tsx` | `user-profile.tsx` |
| Pages (App Router) | `page.tsx` in folder | `app/dashboard/page.tsx` |
| Layouts | `layout.tsx` in folder | `app/dashboard/layout.tsx` |
| Convex functions | `kebab-case.ts` | `convex/workflows.ts` |
| Hooks | `use-*.ts` | `use-auth.ts` |
| Utilities | `kebab-case.ts` | `format-date.ts` |
| Types | `*.types.ts` or inline | `user.types.ts` |
| Tests | `*.test.ts` / `*.spec.ts` | `user.test.ts`, `auth.spec.ts` |
| Zod schemas | `*.schema.ts` | `user.schema.ts` |

### Component File Structure

```tsx
// user-profile.tsx

// 1. Imports (external, then internal, then relative)
import { useState } from "react";
import { useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";

import { UserAvatar } from "./user-avatar";

// 2. Types
interface UserProfileProps {
  userId: Id<"users">;
}

// 3. Component
export function UserProfile({ userId }: UserProfileProps) {
  // ...
}
```

### Convex Function Organization

```typescript
// convex/users.ts

// Imports
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserById } from "./model/users";

// Queries first
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, { id }) => {
    return await getUserById(ctx, id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// Then mutations
export const create = mutation({
  args: { name: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("users", args);
  },
});

export const update = mutation({ /* ... */ });
export const remove = mutation({ /* ... */ });
```

### Environment Variables

```bash
# .env.local (never commit)
CONVEX_DEPLOYMENT=dev:your-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Auth providers
BETTER_AUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

**Naming conventions**:
- `NEXT_PUBLIC_*` - Exposed to browser
- `CONVEX_*` - Convex-specific
- `*_SECRET` / `*_KEY` - Never expose publicly

### Git Conventions

**Branch naming**:
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation

**Commit messages**:
```
type: short description

- Bullet points for details
- Keep lines under 72 characters

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

### Code Review Checklist

- [ ] TypeScript types are explicit where needed
- [ ] Convex functions have argument validators
- [ ] Loading and error states are handled
- [ ] Accessibility is maintained (labels, ARIA)
- [ ] No console.log or debugging code
- [ ] Tests added for critical paths

### Testing Conventions

| Test Type | Location | Naming |
|-----------|----------|--------|
| Unit tests | Next to source file | `*.test.ts` |
| Component tests | Next to component | `*.test.tsx` |
| Convex tests | `convex/*.test.ts` | `*.test.ts` |
| E2E tests | `e2e/` folder | `*.spec.ts` |

### Related Standards

- See [coding-style.md](./coding-style.md) for code formatting
- See [tech-stack.md](./tech-stack.md) for technology choices
- See [testing/coverage.md](../testing/coverage.md) for testing strategy
