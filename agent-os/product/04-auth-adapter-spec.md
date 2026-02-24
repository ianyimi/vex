# Auth Adapter Spec

This document defines the authentication adapter interface for Vex CMS, with Better Auth as the default implementation.

**Referenced by**: [roadmap.md](./roadmap.md) - Phase 0.5

**Depends on**:
- [05-schema-field-system-spec.md](./05-schema-field-system-spec.md) - User collection definition
- [00-monorepo-setup-spec.md](./00-monorepo-setup-spec.md) - Package structure

---

## Design Goals

1. **Adapter interface in @vexcms/core** - Runtime-agnostic, can be implemented by any auth library
2. **Better Auth as default** - Email/password out of the box, users extend as needed
3. **User-configurable** - Users set up their own database adapter and providers
4. **Minimal defaults** - Only email/password enabled by default
5. **Future-proof** - Interface supports OAuth, magic links, 2FA for future adapters

---

## Adapter Interface

### Location: packages/core/src/adapters/auth.ts

```typescript
/**
 * Authentication adapter interface
 * Implemented by auth providers (Better Auth, Clerk, AuthJS, etc.)
 */
export interface AuthAdapter<TUser = DefaultUser, TSession = DefaultSession> {
  /**
   * Adapter identifier
   */
  readonly name: string;

  /**
   * Get the current session from a request
   * Returns null if not authenticated
   */
  getSession(request: Request): Promise<TSession | null>;

  /**
   * Get the current user from a session
   * Returns null if session is invalid or user doesn't exist
   */
  getUser(session: TSession): Promise<TUser | null>;

  /**
   * Get user by ID
   * Used for internal lookups
   */
  getUserById(id: string): Promise<TUser | null>;

  /**
   * Validate that a user has access to the admin panel
   * Can check roles, permissions, etc.
   */
  canAccessAdmin(user: TUser): boolean;

  /**
   * Sign out the current user
   * Clears session/cookies
   */
  signOut(request: Request): Promise<Response>;

  /**
   * Get auth-related API handlers
   * Mounted at /api/auth/*
   */
  handlers: AuthHandlers;

  /**
   * Get middleware for protecting routes
   */
  middleware: AuthMiddleware;

  /**
   * Get React components for auth UI
   * These are used by the admin shell
   */
  components: AuthComponents;
}

/**
 * Auth API handlers
 */
export interface AuthHandlers {
  /**
   * Handle GET requests to /api/auth/*
   */
  GET: (request: Request) => Promise<Response>;

  /**
   * Handle POST requests to /api/auth/*
   */
  POST: (request: Request) => Promise<Response>;
}

/**
 * Auth middleware function
 */
export type AuthMiddleware = (
  request: Request,
  context: { basePath: string }
) => Promise<Response | null>;

/**
 * Auth UI components
 */
export interface AuthComponents {
  /**
   * Sign in form component
   */
  SignInForm: React.ComponentType<SignInFormProps>;

  /**
   * Sign up form component (optional)
   */
  SignUpForm?: React.ComponentType<SignUpFormProps>;

  /**
   * User menu component for header
   */
  UserMenu: React.ComponentType<UserMenuProps>;
}

/**
 * Sign in form props
 */
export interface SignInFormProps {
  /**
   * Callback URL after successful sign in
   */
  callbackUrl?: string;

  /**
   * Called on successful sign in
   */
  onSuccess?: () => void;

  /**
   * Called on sign in error
   */
  onError?: (error: Error) => void;
}

/**
 * Sign up form props
 */
export interface SignUpFormProps {
  /**
   * Callback URL after successful sign up
   */
  callbackUrl?: string;

  /**
   * Called on successful sign up
   */
  onSuccess?: () => void;

  /**
   * Called on sign up error
   */
  onError?: (error: Error) => void;
}

/**
 * User menu props
 */
export interface UserMenuProps {
  /**
   * Current user
   */
  user: DefaultUser;
}
```

### Default Types

```typescript
/**
 * Default user type
 * Auth adapters should extend this with their own user type
 */
export interface DefaultUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
}

/**
 * Default session type
 */
export interface DefaultSession {
  user: DefaultUser;
  expires: Date;
}
```

---

## Better Auth Implementation

### Location: packages/admin/src/auth/better-auth-adapter.ts

```typescript
import { betterAuth } from 'better-auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { getSessionCookie } from 'better-auth/cookies';
import type { AuthAdapter, AuthHandlers, AuthMiddleware } from '@vexcms/core';
import { SignInForm } from '../components/auth/SignInForm';
import { SignUpForm } from '../components/auth/SignUpForm';
import { UserMenu } from '../components/layout/UserMenu';

export interface BetterAuthAdapterConfig {
  /**
   * Database adapter for Better Auth
   * Required - users must provide this
   */
  database: DatabaseAdapter;

  /**
   * Additional OAuth/social providers
   * Default: none (email/password only)
   */
  providers?: SocialProviders;

  /**
   * Session configuration
   */
  session?: {
    expiresIn?: number;
    updateAge?: number;
  };

  /**
   * Email/password configuration
   */
  emailAndPassword?: {
    enabled?: boolean;
    requireEmailVerification?: boolean;
  };

  /**
   * Role field on user to check for admin access
   * Default: 'role'
   */
  roleField?: string;

  /**
   * Roles that can access admin panel
   * Default: ['admin', 'editor', 'author']
   */
  adminRoles?: string[];
}

/**
 * Create a Better Auth adapter for Vex CMS
 */
export function createBetterAuthAdapter(
  config: BetterAuthAdapterConfig
): AuthAdapter {
  const {
    database,
    providers = {},
    session = {},
    emailAndPassword = { enabled: true },
    roleField = 'role',
    adminRoles = ['admin', 'editor', 'author'],
  } = config;

  // Initialize Better Auth
  const auth = betterAuth({
    database,
    emailAndPassword: {
      enabled: emailAndPassword.enabled ?? true,
      requireEmailVerification: emailAndPassword.requireEmailVerification ?? false,
    },
    socialProviders: providers,
    session: {
      expiresIn: session.expiresIn ?? 60 * 60 * 24 * 7, // 7 days
      updateAge: session.updateAge ?? 60 * 60 * 24, // 1 day
    },
    basePath: '/api/auth',
  });

  // Create Next.js handlers
  const nextHandlers = toNextJsHandler(auth);

  const adapter: AuthAdapter = {
    name: 'better-auth',

    async getSession(request: Request) {
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      return session;
    },

    async getUser(session) {
      return session?.user ?? null;
    },

    async getUserById(id: string) {
      // Better Auth stores users in the configured database
      // This would need to query the database directly
      const user = await auth.api.getUser({ userId: id });
      return user;
    },

    canAccessAdmin(user) {
      const role = user[roleField as keyof typeof user];
      if (!role) return false;
      return adminRoles.includes(role as string);
    },

    async signOut(request: Request) {
      return auth.api.signOut({ headers: request.headers });
    },

    handlers: {
      GET: nextHandlers.GET,
      POST: nextHandlers.POST,
    },

    middleware: createMiddleware(adminRoles, roleField),

    components: {
      SignInForm,
      SignUpForm,
      UserMenu,
    },
  };

  return adapter;
}

/**
 * Create auth middleware
 */
function createMiddleware(
  adminRoles: string[],
  roleField: string
): AuthMiddleware {
  return async (request, { basePath }) => {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Skip auth API routes
    if (pathname.startsWith('/api/auth')) {
      return null;
    }

    // Skip sign-in/sign-up pages
    if (
      pathname.startsWith(`${basePath}/sign-in`) ||
      pathname.startsWith(`${basePath}/sign-up`)
    ) {
      return null;
    }

    // Check session cookie
    const sessionCookie = getSessionCookie(request);

    if (!sessionCookie) {
      // Redirect to sign-in
      const signInUrl = new URL(`${basePath}/sign-in`, request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return Response.redirect(signInUrl);
    }

    // Cookie exists, allow request
    // Full role checking happens in page components
    return null;
  };
}
```

---

## Usage in Vex Config

### Basic Usage (Email/Password Only)

```typescript
// vex.config.ts
import { defineConfig } from '@vexcms/core';
import { createBetterAuthAdapter } from '@vexcms/admin/auth';

const authAdapter = createBetterAuthAdapter({
  database: myDatabaseAdapter, // User provides this
});

export default defineConfig({
  collections: [users, posts, pages],
  admin: {
    user: 'users',
    auth: authAdapter,
  },
});
```

### With OAuth Providers

```typescript
// vex.config.ts
import { defineConfig } from '@vexcms/core';
import { createBetterAuthAdapter } from '@vexcms/admin/auth';

const authAdapter = createBetterAuthAdapter({
  database: myDatabaseAdapter,
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
});

export default defineConfig({
  collections: [users, posts, pages],
  admin: {
    user: 'users',
    auth: authAdapter,
  },
});
```

### Custom Role Configuration

```typescript
const authAdapter = createBetterAuthAdapter({
  database: myDatabaseAdapter,
  roleField: 'userRole', // Custom field name
  adminRoles: ['superadmin', 'admin'], // Only these roles can access admin
});
```

---

## Future Adapters

The adapter interface supports building adapters for other auth libraries:

### Clerk Adapter (Future)

```typescript
// @vexcms/auth-clerk (future package)
import { createClerkAdapter } from '@vexcms/auth-clerk';

const authAdapter = createClerkAdapter({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY!,
  secretKey: process.env.CLERK_SECRET_KEY!,
});
```

### AuthJS Adapter (Future)

```typescript
// @vexcms/auth-authjs (future package)
import { createAuthJSAdapter } from '@vexcms/auth-authjs';

const authAdapter = createAuthJSAdapter({
  providers: [GitHub, Google],
  adapter: PrismaAdapter(prisma),
});
```

---

## Admin Layout Integration

The admin shell uses the auth adapter:

```typescript
// packages/admin/src/next/app/(admin)/layout.tsx
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Layout } from '../../../components/layout/Layout';
import { getVexConfig } from '../../config';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const config = getVexConfig();
  const authAdapter = config.admin.auth;

  // Get session
  const request = new Request('http://localhost', {
    headers: headers(),
  });
  const session = await authAdapter.getSession(request);

  if (!session) {
    redirect('/admin/sign-in');
  }

  // Get user and check admin access
  const user = await authAdapter.getUser(session);

  if (!user || !authAdapter.canAccessAdmin(user)) {
    redirect('/admin/sign-in?error=unauthorized');
  }

  return (
    <Layout config={config} user={user}>
      {children}
    </Layout>
  );
}
```

---

## Database Adapter Note

Better Auth requires a database adapter. For Phase 1, users must configure this themselves. Options include:

- **Prisma adapter** - `better-auth/adapters/prisma`
- **Drizzle adapter** - `better-auth/adapters/drizzle`
- **MongoDB adapter** - `better-auth/adapters/mongodb`
- **SQLite adapter** - For development

In a future phase, we can create a Convex database adapter for Better Auth so auth data lives in the same database as content.

---

## Type Integration with User Collection

The auth adapter should be compatible with the user collection defined in vex.config.ts:

```typescript
// Vex user collection
const users = defineCollection('users', {
  fields: {
    name: text({ required: true }),
    email: email({ required: true }),
    role: select({
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'editor', label: 'Editor' },
        { value: 'author', label: 'Author' },
      ],
    }),
    // Better Auth will add its own fields:
    // - emailVerified
    // - createdAt
    // - updatedAt
  },
});
```

The auth adapter syncs with this collection when users sign up or update their profile.

---

## Checklist

- [ ] Define AuthAdapter interface in @vexcms/core
- [ ] Define default User and Session types
- [ ] Implement createBetterAuthAdapter in @vexcms/admin
- [ ] Create SignInForm component
- [ ] Create SignUpForm component
- [ ] Create auth middleware
- [ ] Integrate with admin shell layout
- [ ] Test email/password authentication flow
- [ ] Document database adapter setup
- [ ] Document adding OAuth providers
