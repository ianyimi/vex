# Tech Stack

Inherits from project standard (`agent-os/standards/global/tech-stack.md`) with CMS-specific additions.

## Core

| Category | Technology | Purpose |
|----------|------------|---------|
| **Database** | Convex | Real-time database, serverless functions, file storage |
| **Authentication** | Better Auth | OAuth, sessions, integrated with Convex |
| **Schema Definition** | TypeScript + Zod | Type-safe collection/field definitions |

## Admin Panel (Next.js Package)

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | Next.js 16 | App Router, React 19 |
| **UI Components** | shadcn/ui | Accessible, customizable components |
| **Styling** | Tailwind CSS 4 | Utility-first CSS |
| **Forms** | TanStack Form | Form state management |
| **Tables** | TanStack Table | Data table for collection lists |
| **State** | TanStack Query + Convex | Server state with real-time subscriptions |

## Testing

| Category | Technology | Purpose |
|----------|------------|---------|
| **Unit/Integration** | Vitest | Fast, Vite-native testing |
| **Convex Testing** | convex-test | In-memory Convex for testing |
| **E2E** | Playwright | Browser automation for admin panel |
| **Accessibility** | axe-core | Automated a11y testing |

## Future Integrations (Post-MVP)

| Category | Technology | Purpose |
|----------|------------|---------|
| **File Storage** | S3 / S3-compatible / Vercel Blob | Alternative upload destinations |
| **Framework** | TanStack Start | Alternative to Next.js for admin panel |
| **Rich Text** | Lexical or TipTap | WYSIWYG editor (evaluate both) |

## Package Structure (Planned)

```
@vex/core          # Schema, hooks, access control (framework-agnostic)
@vex/convex        # Convex adapter (queries, mutations, storage)
@vex/admin-nextjs  # Admin panel for Next.js
@vex/admin-tanstack # Admin panel for TanStack Start (future)
```
