/**
 * Builds a `databaseHooks.user.create.before` hook that stamps a distinct
 * role onto every user the Better Auth `anonymous()` plugin creates — lining
 * up `defineAccess({ anonRole })` with a real, inspectable role instead of
 * relying solely on the "roles resolved empty" fallback.
 *
 * Without this, an anonymous-plugin user still goes through the same
 * `additionalFields` default-fill as every other new user (better-auth's
 * adapter factory applies `roles`' configured `defaultValue` to any field the
 * creating call omits), so it silently ends up with the SAME role as a
 * regular signed-up account rather than a distinct anon one — and
 * `hasPermission`'s empty-roles → `anonRole` fallback never fires for it,
 * because its `roles` array is never actually empty.
 *
 * This hook runs before that default-fill (`databaseHooks` `create.before`
 * wins over field defaults) and only touches documents the anonymous plugin
 * created (`user.isAnonymous === true`); every other creation path is left
 * untouched.
 *
 * @param role - The role string to assign. Pass the same value given to
 *   `defineAccess({ anonRole })` so the two stay in lockstep by construction.
 * @returns A `databaseHooks.user` value — spread into `authOptions.databaseHooks.user`,
 *   or pass directly as `databaseHooks: { user: anonRoleDatabaseHook(role) }` when
 *   no other user hooks are configured.
 *
 * @example
 * ```ts
 * import { anonRoleDatabaseHook } from "@vexcms/better-auth";
 *
 * export const authOptions: BetterAuthOptions = {
 *   // ...
 *   databaseHooks: {
 *     user: anonRoleDatabaseHook(USER_ROLES.anon),
 *   },
 * };
 * ```
 */
export function anonRoleDatabaseHook(role: string): {
  create: {
    before: (
      user: Record<string, unknown>,
    ) => Promise<{ data: Record<string, unknown> }>;
  };
} {
  return {
    create: {
      before: async (user) => ({
        data: user.isAnonymous === true ? { ...user, roles: [role] } : user,
      }),
    },
  };
}
