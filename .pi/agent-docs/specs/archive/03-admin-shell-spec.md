# Admin Layout Spec

This document defines the base Next.js admin panel structure, layout, routing, and Better Auth integration.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 0.5

**Depends on**:
- [00-monorepo-setup-spec.md](./00-monorepo-setup-spec.md) - Package structure
- [04-auth-adapter-spec.md](./04-auth-adapter-spec.md) - Auth adapter interface

**Testing**: [11-testing-strategy-spec.md](./11-testing-strategy-spec.md) - E2E tests for admin flows

---

## Design Goals

1. **Next.js App Router** with standard conventions
2. **Better Auth** with email/password as default
3. **Minimal setup** - works out of the box with sensible defaults
4. **User customizable** - users can extend auth configuration themselves
5. **Responsive layout** with sidebar navigation
6. **Framework-specific package** - `@vexcms/admin-next` for Next.js, `@vexcms/admin-tanstack-start` for TanStack Start (Phase 4)

---

## Package Structure

The admin shell is split across two packages:
- `@vexcms/ui` — Shared React components (Layout, Header, forms, primitives)
- `@vexcms/admin-next` — Next.js specific (routing, Sidebar with next/link, server components)

```
packages/ui/                           # @vexcms/ui (shared)
├── src/
│   ├── primitives/                    # shadcn-based components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── layout/
│   │   ├── Layout.tsx                  # Main admin shell (no routing)
│   │   ├── Header.tsx                 # Top header bar
│   │   ├── UserMenu.tsx               # User dropdown
│   │   └── index.ts
│   ├── forms/
│   │   ├── FormProvider.tsx
│   │   ├── fields/                    # TextField, SelectField, etc.
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useField.ts
│   │   ├── useForm.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── tsup.config.ts

packages/admin-next/                   # @vexcms/admin-next
├── src/
│   ├── app/                           # App Router pages (exported for user to mount)
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   │   └── page.tsx
│   │   │   ├── sign-up/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (admin)/
│   │   │   ├── layout.tsx             # Admin shell layout
│   │   │   ├── page.tsx               # Dashboard
│   │   │   ├── [collection]/
│   │   │   │   ├── page.tsx           # List view
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx       # Create view
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx       # Edit view
│   │   │   └── globals/
│   │   │       └── [slug]/
│   │   │           └── page.tsx       # Global edit view
│   │   └── api/
│   │       └── auth/
│   │           └── [...all]/
│   │               └── route.ts       # Better Auth handler
│   ├── auth/
│   │   ├── config.ts                  # Default Better Auth config
│   │   ├── client.ts                  # Auth client
│   │   └── middleware.ts              # Auth middleware
│   ├── components/
│   │   ├── Sidebar.tsx                # Navigation sidebar (uses next/link)
│   │   └── auth/
│   │       ├── SignInForm.tsx
│   │       ├── SignUpForm.tsx
│   │       └── index.ts
│   ├── createVexAdmin.ts              # Setup function
│   └── index.ts                       # Exports
│
├── package.json
└── tsconfig.json
```

**Notes:**
- Both `@vexcms/ui` and `@vexcms/admin-next` are pre-built with tsup (compiled JS + types)
- Sidebar and AdminPage live in admin-next because they use `next/link` and `usePathname`
- Layout, Header, UserMenu are in ui because they don't need framework-specific imports
- AdminPage provides runtime routing based on config — no file-per-collection needed

---

## Type Definitions

### VexAdmin Configuration

```typescript
/**
 * Configuration for creating the Vex admin panel
 */
interface VexAdminConfig {
  /**
   * Vex configuration (collections, globals, etc.)
   */
  config: VexConfig;

  /**
   * Base path for admin routes (default: '/admin')
   */
  basePath?: string;

  /**
   * Better Auth configuration overrides
   * Users can extend/override default auth settings
   */
  auth?: {
    /**
     * Additional auth providers beyond email/password
     */
    providers?: AuthProvider[];

    /**
     * Custom session configuration
     */
    session?: SessionConfig;

    /**
     * Database adapter for Better Auth
     * Default: none (user must configure)
     */
    database?: DatabaseAdapter;
  };

  /**
   * Admin panel metadata
   */
  meta?: {
    title?: string;
    favicon?: string;
  };
}

/**
 * Return type from createVexAdmin
 */
interface VexAdminResult {
  /**
   * Auth handler for API routes
   */
  handlers: {
    GET: NextHandler;
    POST: NextHandler;
  };

  /**
   * Auth middleware
   */
  middleware: NextMiddleware;

  /**
   * Auth client for client components
   */
  authClient: AuthClient;

  /**
   * Server-side auth utilities
   */
  auth: {
    getSession: () => Promise<Session | null>;
    getUser: () => Promise<User | null>;
  };
}
```

---

## createVexAdmin Function

```typescript
// packages/admin-next/src/createVexAdmin.ts

import { betterAuth } from 'better-auth';
import { toNextJsHandler } from 'better-auth/next-js';
import type { VexAdminConfig, VexAdminResult } from './types';

export function createVexAdmin(config: VexAdminConfig): VexAdminResult {
  const basePath = config.basePath ?? '/admin';

  // Initialize Better Auth with defaults
  const auth = betterAuth({
    // Email/password enabled by default
    emailAndPassword: {
      enabled: true,
    },

    // User-provided database adapter (required)
    database: config.auth?.database,

    // Merge user providers
    socialProviders: config.auth?.providers ?? {},

    // Session config
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      ...config.auth?.session,
    },

    // Base path for auth routes
    basePath: '/api/auth',
  });

  // Create Next.js handlers
  const handlers = toNextJsHandler(auth);

  // Create middleware
  const middleware = createAuthMiddleware(auth, basePath);

  // Create auth client
  const authClient = createAuthClient({
    baseURL: '/api/auth',
  });

  return {
    handlers,
    middleware,
    authClient,
    auth: {
      getSession: () => auth.api.getSession({ headers: headers() }),
      getUser: async () => {
        const session = await auth.api.getSession({ headers: headers() });
        return session?.user ?? null;
      },
    },
  };
}
```

---

## User Setup

### 1. Create Vex Admin Instance

```typescript
// lib/vex-admin.ts
import { createVexAdmin } from '@vexcms/admin-next';
import vexConfig from '../vex.config';

export const vexAdmin = createVexAdmin({
  config: vexConfig,
  basePath: '/admin',
  auth: {
    // User must provide their own database adapter
    database: {
      // Example: Convex adapter (when available)
      // or any Better Auth supported adapter
    },
  },
});

export const { handlers, middleware, authClient, auth } = vexAdmin;
```

### 2. Create API Route

```typescript
// app/api/auth/[...all]/route.ts
import { handlers } from '@/lib/vex-admin';

export const { GET, POST } = handlers;
```

### 3. Create Middleware

```typescript
// middleware.ts
import { middleware } from '@/lib/vex-admin';

export default middleware;

export const config = {
  matcher: ['/admin/:path*'],
};
```

### 4. Use Admin Pages

The admin pages are pre-built in `@vexcms/admin-next`. Users import and re-export them:

```typescript
// app/admin/[[...slug]]/page.tsx
export { AdminPage as default } from '@vexcms/admin-next';
```

Or for more control, users can build their own pages using Vex components:

```typescript
// app/admin/page.tsx
import { Dashboard } from '@vexcms/admin-next';
import { auth } from '@/lib/vex-admin';

export default async function AdminDashboard() {
  const user = await auth.getUser();

  return <Dashboard user={user} />;
}
```

---

## Auth Middleware

```typescript
// packages/admin-next/src/auth/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export function createAuthMiddleware(auth: Auth, basePath: string) {
  return async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    // Skip auth routes
    if (pathname.startsWith('/api/auth')) {
      return NextResponse.next();
    }

    // Skip sign-in/sign-up pages
    if (pathname.startsWith(`${basePath}/sign-in`) || pathname.startsWith(`${basePath}/sign-up`)) {
      return NextResponse.next();
    }

    // Check for session cookie
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      // Redirect to sign-in
      const signInUrl = new URL(`${basePath}/sign-in`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // For Next.js 15.2+, can do full session validation
    // For older versions, cookie check is sufficient for middleware
    return NextResponse.next();
  };
}
```

---

## Layout Components

### Layout Component

```typescript
// packages/admin-next/src/components/layout/Layout.tsx
'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  config: VexConfig;
  user: User;
}

export function Layout({ children, config, user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="vex-shell">
      <Sidebar
        collections={config.collections}
        globals={config.globals}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="vex-main">
        <Header user={user} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="vex-content">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Sidebar Component

```typescript
// packages/admin-next/src/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { VexCollection, VexGlobal } from '@vexcms/core';

interface SidebarProps {
  collections: readonly VexCollection<any>[];
  globals?: readonly VexGlobal<any>[];
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ collections, globals, isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();

  // Group collections by admin.group
  const groupedCollections = groupCollections(collections);

  return (
    <aside className={`vex-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="vex-sidebar__logo">
        <Link href="/admin">Vex CMS</Link>
      </div>

      <nav className="vex-sidebar__nav">
        {/* Dashboard */}
        <Link
          href="/admin"
          className={`vex-sidebar__link ${pathname === '/admin' ? 'active' : ''}`}
        >
          Dashboard
        </Link>

        {/* Grouped Collections */}
        {Object.entries(groupedCollections).map(([group, items]) => (
          <div key={group} className="vex-sidebar__group">
            {group !== 'default' && (
              <h3 className="vex-sidebar__group-title">{group}</h3>
            )}
            {items.map((collection) => (
              <Link
                key={collection.name}
                href={`/admin/${collection.name}`}
                className={`vex-sidebar__link ${
                  pathname.startsWith(`/admin/${collection.name}`) ? 'active' : ''
                }`}
              >
                {collection.labels?.plural ?? collection.name}
              </Link>
            ))}
          </div>
        ))}

        {/* Globals */}
        {globals && globals.length > 0 && (
          <div className="vex-sidebar__group">
            <h3 className="vex-sidebar__group-title">Globals</h3>
            {globals.map((global) => (
              <Link
                key={global.slug}
                href={`/admin/globals/${global.slug}`}
                className={`vex-sidebar__link ${
                  pathname === `/admin/globals/${global.slug}` ? 'active' : ''
                }`}
              >
                {global.label ?? global.slug}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </aside>
  );
}

function groupCollections(collections: readonly VexCollection<any>[]) {
  const groups: Record<string, VexCollection<any>[]> = { default: [] };

  for (const collection of collections) {
    const group = collection.admin?.group ?? 'default';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(collection);
  }

  return groups;
}
```

### Header Component

```typescript
// packages/admin-next/src/components/layout/Header.tsx
'use client';

import { UserMenu } from './UserMenu';
import { Menu } from 'lucide-react';

interface HeaderProps {
  user: User;
  onMenuClick: () => void;
}

export function Header({ user, onMenuClick }: HeaderProps) {
  return (
    <header className="vex-header">
      <button
        className="vex-header__menu-btn"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu size={20} />
      </button>

      <div className="vex-header__spacer" />

      <UserMenu user={user} />
    </header>
  );
}
```

### UserMenu Component

```typescript
// packages/admin-next/src/components/layout/UserMenu.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuthClient } from '../auth/AuthContext';
import { ChevronDown, LogOut, User as UserIcon } from 'lucide-react';

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const authClient = useAuthClient();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/admin/sign-in';
  };

  return (
    <div className="vex-user-menu" ref={menuRef}>
      <button
        className="vex-user-menu__trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span className="vex-user-menu__avatar">
          {user.name?.charAt(0) ?? user.email?.charAt(0) ?? '?'}
        </span>
        <span className="vex-user-menu__name">{user.name ?? user.email}</span>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="vex-user-menu__dropdown">
          <div className="vex-user-menu__info">
            <p className="vex-user-menu__email">{user.email}</p>
          </div>
          <hr />
          <button onClick={handleSignOut} className="vex-user-menu__item">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Auth Pages

### Sign In Page

```typescript
// packages/admin-next/src/app/(auth)/sign-in/page.tsx
import { SignInForm } from '../../../components/auth/SignInForm';

export default function SignInPage() {
  return (
    <div className="vex-auth-page">
      <div className="vex-auth-card">
        <h1>Sign In</h1>
        <SignInForm />
      </div>
    </div>
  );
}
```

### SignInForm Component

```typescript
// packages/admin-next/src/components/auth/SignInForm.tsx
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthClient } from './AuthContext';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/admin';
  const authClient = useAuthClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? 'Sign in failed');
        return;
      }

      router.push(callbackUrl);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="vex-auth-form">
      {error && <div className="vex-auth-error">{error}</div>}

      <div className="vex-form-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>

      <div className="vex-form-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
      </div>

      <button type="submit" disabled={loading} className="vex-auth-submit">
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

---

## CSS Structure

Vex admin uses CSS custom properties for theming:

```css
/* packages/admin-next/src/styles/variables.css */
:root {
  /* Colors */
  --vex-bg: #ffffff;
  --vex-bg-secondary: #f8f9fa;
  --vex-text: #1a1a1a;
  --vex-text-muted: #6b7280;
  --vex-border: #e5e7eb;
  --vex-primary: #3b82f6;
  --vex-primary-hover: #2563eb;
  --vex-error: #ef4444;

  /* Spacing */
  --vex-sidebar-width: 256px;
  --vex-header-height: 56px;

  /* Typography */
  --vex-font-sans: system-ui, -apple-system, sans-serif;
  --vex-font-mono: ui-monospace, monospace;
}

/* Dark mode */
[data-theme='dark'] {
  --vex-bg: #1a1a1a;
  --vex-bg-secondary: #2d2d2d;
  --vex-text: #ffffff;
  --vex-text-muted: #9ca3af;
  --vex-border: #404040;
}
```

---

## Example App Setup

### apps/blog Setup

The example blog app will use the admin panel:

```typescript
// apps/blog/lib/vex-admin.ts
import { createVexAdmin } from '@vexcms/admin-next';
import vexConfig from '../vex.config';

export const vexAdmin = createVexAdmin({
  config: vexConfig,
  auth: {
    // For development, use a simple database
    // Users would configure their own adapter
  },
});

export const { handlers, middleware, authClient, auth } = vexAdmin;
```

```typescript
// apps/blog/app/admin/[[...slug]]/page.tsx
export { AdminPage as default } from '@vexcms/admin-next';
```

---

## Checklist

- [ ] Create admin package structure
- [ ] Implement createVexAdmin function
- [ ] Set up Better Auth with email/password
- [ ] Create auth middleware
- [ ] Build Layout, Sidebar, Header, UserMenu components
- [ ] Create SignInForm and SignUpForm components
- [ ] Create auth pages (sign-in, sign-up)
- [ ] Set up CSS variables and base styles
- [ ] Create placeholder pages for collections and globals
- [ ] Test auth flow end-to-end
- [ ] Document user setup steps
