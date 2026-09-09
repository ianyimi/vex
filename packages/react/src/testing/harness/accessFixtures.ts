import type { ReactNode } from "react";
import { createElement } from "react";
import { render, type RenderResult } from "@testing-library/react";
import {
  defineAccess,
  defineCollection,
  text,
  type VexAccessConfig,
  type VexApiAuth,
} from "@vexcms/core";
import { VexAccessProvider } from "../../context/VexAccessContext";
import { VexAuthProvider } from "../../context/VexAuthContext";

/**
 * One collection, one shared `defineAccess` matrix, three roles — reused by every
 * factory that needs a real RBAC/collection pair to render against instead of a
 * mock. Generalizes the inline setup proven in `hooks/usePermission.test.tsx`.
 */
export const testCollection = defineCollection({
  slug: "posts",
  fields: {
    status: text({ index: "by_status" }),
  },
});

const access = defineAccess({
  roles: ["denied", "allowed", "scoped"] as const,
  resources: [testCollection],
  userCollectionSlug: "users",
  userRolesField: "roles",
  permissions: {
    // No grants declared for `posts` — every action fails closed (P-007).
    denied: { posts: {} },
    // Role-level allow-all — the documented posture for "grants everything".
    allowed: { posts: { "*": true } },
    // Doc-scoped: only documents with `status: "published"` are readable.
    scoped: {
      posts: {
        read: {
          constraints: ({ q }) => q.withIndex("by_status", (ix) => ix.eq("status", "published")),
        },
      },
    },
  },
});

/**
 * One entry per RBAC scenario every factory in this package renders against.
 * `anonymous`/`denied`/`allowed`/`scoped` all point at the same shared `access`
 * matrix — what distinguishes a scenario is which `testUsers` role (if any) is
 * paired with it at the call site, not a different config per key.
 */
export const testAccess: {
  none: undefined;
  anonymous: VexAccessConfig;
  denied: VexAccessConfig;
  allowed: VexAccessConfig;
  scoped: VexAccessConfig;
} = {
  none: undefined,
  anonymous: access,
  denied: access,
  allowed: access,
  scoped: access,
};

/**
 * Fake users, one per role that needs a signed-in caller (`none`/`anonymous` render with
 * no user). Typed `Record<string, unknown>` to match `VexApiAuth["user"]`, the same shape
 * `usePermission.test.tsx`'s own `asUser` helper returns.
 */
export const testUsers: {
  denied: Record<string, unknown>;
  allowed: Record<string, unknown>;
  scoped: Record<string, unknown>;
} = {
  denied: { _id: "u1", roles: "denied" },
  allowed: { _id: "u2", roles: "allowed" },
  scoped: { _id: "u3", roles: "scoped" },
};

/**
 * Wraps `ui` in the real `VexAccessProvider`/`VexAuthProvider` pair — the same
 * providers `usePermission` reads through in the app, so every factory renders
 * against actual RBAC resolution instead of a stubbed context value.
 *
 * @param ui - The tree to render inside both providers.
 * @param options - Optional scenario wiring.
 * @param options.access - The access config to provide; omit to leave RBAC unconfigured.
 * @param options.auth - The `{ user }` caller to provide; defaults to `{ user: null }`.
 * @returns The `@testing-library/react` render result.
 */
export function renderWithVexProviders(
  ui: ReactNode,
  options?: { access?: VexAccessConfig; auth?: VexApiAuth },
): RenderResult {
  const auth = options?.auth ?? { user: null };
  // `children` goes in the props object, not positionally: both providers declare
  // `children` as a required prop, and `createElement`'s positional-children overload
  // does not satisfy it for a non-generic component (tsc rejects the third argument
  // even though React assigns it at runtime).
  return render(
    createElement(VexAccessProvider, {
      access: options?.access,
      children: createElement(VexAuthProvider, { value: auth, children: ui }),
    }),
  );
}
