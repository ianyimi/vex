/// <reference types="vite/client" />

import type { Id } from "@convex/_generated/dataModel"
import type { TestConvex } from "convex-test"

import rateLimiterTest from "@convex-dev/rate-limiter/test"
import schema from "@convex/schema"
import { convexTest } from "convex-test"

import { TABLE_SLUG_SESSIONS, TABLE_SLUG_USERS } from "~/db/constants"

export interface InsertTestUserResult {
  identity: TestUserIdentity
  sessionId: Id<"session">
  userId: Id<"user">
}

/**
 * An identity shape ready for `t.withIdentity(identity)`. `email` is
 * required (not optional, unlike `convex-test`'s own `UserIdentity`): every
 * caller this harness builds resolves through `createGetAuth`, which looks
 * the subject up by `_id`, and `vex/firstUser.ts#promoteFirstAdmin` separately
 * reads `identity.email` to find the same user by its `by_email` index, so an
 * identity missing `email` silently breaks that one caller.
 */
export type TestUserIdentity = {
  email: string
  sessionId: string
  subject: string
}

const testModules = import.meta.glob("../../convex/**/*.ts")

/**
 * Builds one `convex-test` instance wired the way every real deployment is:
 * schema from `@convex/schema`, every Convex module under `convex/` resolved
 * through `import.meta.glob` (a module-loader map `convex-test` requires
 * explicitly — passing only `schema` throws `import.meta.glob is not a
 * function` against convex-test's prebuilt dist), and the rate limiter
 * component pre-registered so any test touching an auth mutation that calls
 * `rateLimiter.limit(...)` does not throw on an unregistered component.
 *
 * @returns A fresh `convex-test` instance. Call once per test (or per
 *   `describe` block that shares fixtures) — state does not reset between
 *   calls to the SAME instance, so reusing one across unrelated tests leaks
 *   data between them.
 */
export function createConvexTest(): TestConvex<typeof schema> {
  const t = convexTest(schema, testModules)
  // Registered before `t` escapes: the component has to exist before any
  // function that references `components.rateLimiter` executes.
  rateLimiterTest.register(t)
  return t
}

/**
 * Inserts one `user` row plus a matching `session` row, and returns an
 * identity ready for `t.withIdentity(...)`.
 *
 * @param props.t - The `createConvexTest()` instance to seed.
 * @param props.roles - The `roles` array stamped onto the inserted user —
 *   drives which `USER_ROLES` permission set the identity resolves to once
 *   `t.withIdentity(identity)` wraps it.
 * @param props.isAnonymous - Stamped onto the user row as `isAnonymous`.
 *   Omit for a normal (non-anonymous-plugin) user.
 * @param props.email - Overrides the generated default
 *   `${props.roles.join("-")}@test.local`. Pass a fixed value when a test
 *   needs to assert on the email itself.
 * @returns `{ userId, sessionId, identity }` — `identity.subject` is the
 *   inserted user's `_id` (stringified), `identity.sessionId` is the
 *   inserted session's `_id` (stringified), and `identity.email` matches the
 *   user row, so `t.withIdentity(identity)` resolves through
 *   `createGetAuth` (subject → `ctx.db.get(TABLE_SLUG_USERS, subject)`) and
 *   through `promoteFirstAdmin`'s separate `by_email` lookup identically.
 */
export async function insertTestUser(props: {
  email?: string
  isAnonymous?: boolean
  roles: string[]
  t: TestConvex<typeof schema>
}): Promise<InsertTestUserResult> {
  const email = props.email ?? `${props.roles.join("-")}@test.local`
  const { userId, sessionId } = await props.t.run(async (ctx) => {
    const now = Date.now()
    const insertedUserId = await ctx.db.insert(TABLE_SLUG_USERS, {
      name: "Test user",
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
      roles: props.roles,
      isAnonymous: props.isAnonymous,
    })
    const insertedSessionId = await ctx.db.insert(TABLE_SLUG_SESSIONS, {
      token: crypto.randomUUID(),
      expiresAt: now + 60 * 60 * 1000,
      createdAt: now,
      updatedAt: now,
      userId: String(insertedUserId),
    })
    return { userId: insertedUserId, sessionId: insertedSessionId }
  })
  const identity = { subject: String(userId), sessionId: String(sessionId), email }
  return { userId, sessionId, identity }
}
