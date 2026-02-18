## Tech Stack

This document defines the technical stack for the Maprios project. Reference this for consistency across all development.

### Framework & Runtime

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Framework** | Next.js | 16.x | React framework with App Router |
| **Runtime** | Node.js | 20.x+ | Server runtime |
| **Language** | TypeScript | 5.x | Type-safe JavaScript |
| **Package Manager** | pnpm | 10.x | Fast, disk-efficient package manager |

### Frontend

| Category | Technology | Purpose |
|----------|------------|---------|
| **UI Framework** | React | 19.x with concurrent features |
| **CSS Framework** | Tailwind CSS | 4.x utility-first styling |
| **Component Library** | shadcn/ui | Pre-styled accessible components |
| **Component Primitives** | Base UI | Headless accessible primitives |
| **State (Server)** | TanStack Query | Server state, caching, mutations |
| **State (URL)** | nuqs | Type-safe URL search params |
| **Forms** | TanStack Form | Form state and validation |
| **Tables** | TanStack Table | Headless data table logic |
| **Icons** | Lucide React | Icon library |
| **Theming** | next-themes | Dark/light mode |

### Backend

| Category | Technology | Purpose |
|----------|------------|---------|
| **Database** | Convex | Real-time database with subscriptions |
| **Functions** | Convex | Serverless queries, mutations, actions |
| **Authentication** | Better Auth | OAuth with 20+ providers |
| **Auth Integration** | @convex-dev/better-auth | Better Auth + Convex |
| **Effect Core** | effect | Typed errors, retries, services in Convex actions |
| **Observability** | @effect/opentelemetry | OpenTelemetry tracing for workflows |

### AI & Automation

| Category | Technology | Purpose |
|----------|------------|---------|
| **AI Agents** | OpenAI Agents SDK | Workflow automation, error recovery |
| **Connector Architecture** | Effect Services | Type-safe connector interfaces with dependency injection |
| **Workflow Orchestration** | Effect + Convex | Effect for composition, Convex for state/scheduling |

### Testing

| Category | Technology | Purpose |
|----------|------------|---------|
| **Unit/Component** | Vitest | Fast unit and component tests |
| **Component Testing** | Testing Library | React component testing |
| **Convex Testing** | convex-test | In-memory Convex testing |
| **E2E Testing** | Playwright | Browser automation tests |
| **Accessibility** | axe-core | Automated a11y testing |

### Code Quality

| Category | Technology | Purpose |
|----------|------------|---------|
| **Linting** | ESLint | 9.x with flat config |
| **Formatting** | Prettier | Code formatting |
| **Type Checking** | TypeScript | Compile-time type safety |
| **Convex Linting** | @convex-dev/eslint-plugin | Convex-specific rules |

### Deployment

| Category | Technology | Purpose |
|----------|------------|---------|
| **Frontend Hosting** | Vercel | Edge and serverless functions |
| **Extended Compute** | Vercel Fluid Compute | Long-running AI workloads |
| **Backend Hosting** | Convex Cloud | Managed Convex deployment |

### Key Libraries

```json
{
  "dependencies": {
    "next": "^16.x",
    "react": "^19.x",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-form": "^1.x",
    "@tanstack/react-table": "^8.x",
    "convex": "^1.x",
    "better-auth": "^1.x",
    "@base-ui/react": "^1.x",
    "tailwindcss": "^4.x",
    "zod": "^4.x",
    "nuqs": "^2.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "latest",
    "tailwind-merge": "latest",
    "lucide-react": "^0.5.x",
    "next-themes": "^0.4.x",
    "effect": "^3.x",
    "@effect/opentelemetry": "^0.x"
  },
  "devDependencies": {
    "typescript": "^5.x",
    "vitest": "latest",
    "@playwright/test": "latest",
    "eslint": "^9.x",
    "prettier": "^3.x"
  }
}
```

### Related Standards

- See [backend/api.md](../backend/api.md) for Convex function patterns
- See [backend/effect.md](../backend/effect.md) for Effect usage in Convex actions
- See [frontend/components.md](../frontend/components.md) for shadcn usage
- See [testing/coverage.md](../testing/coverage.md) for testing strategy
