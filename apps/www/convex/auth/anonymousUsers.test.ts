// @vitest-environment edge-runtime
import { internal } from "@convex/_generated/api"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { USER_ROLES } from "~/db/constants"
import { createConvexTest, insertTestUser } from "~/testing/createConvexTest"

describe("purgeExpired", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("deletes an anonymous user aged 25h along with its session, account and apikey", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const { userId, sessionId } = await insertTestUser({ t, roles: [USER_ROLES.user], isAnonymous: true })
    const accountId = await t.run((ctx) =>
      ctx.db.insert("account", {
        accountId: String(userId),
        accessTokenExpiresAt: undefined,
        accessToken: undefined,
        createdAt: Date.now(),
        idToken: undefined,
        password: undefined,
        providerId: "anonymous",
        refreshToken: undefined,
        refreshTokenExpiresAt: undefined,
        scope: undefined,
        updatedAt: Date.now(),
        userId: String(userId),
      }),
    )
    const apikeyId = await t.run((ctx) =>
      ctx.db.insert("apikey", {
        configId: "test-config",
        createdAt: Date.now(),
        key: "test-key",
        referenceId: String(userId),
        updatedAt: Date.now(),
      }),
    )

    vi.setSystemTime(new Date("2026-11-07T01:00:00Z"))
    const result = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})

    expect(result).toEqual({ deleted: 1, rescheduled: false })
    expect(await t.run((ctx) => ctx.db.get(userId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(sessionId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(accountId))).toBeNull()
    expect(await t.run((ctx) => ctx.db.get(apikeyId))).toBeNull()
  })

  it("keeps an anonymous user aged 1h", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const { userId } = await insertTestUser({ t, roles: [USER_ROLES.user], isAnonymous: true })

    vi.setSystemTime(new Date("2026-11-06T01:00:00Z"))
    const result = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})

    expect(result).toEqual({ deleted: 0, rescheduled: false })
    expect(await t.run((ctx) => ctx.db.get(userId))).not.toBeNull()
  })

  it("keeps a non-anonymous user aged 25h", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const { userId } = await insertTestUser({ t, roles: [USER_ROLES.user] })

    vi.setSystemTime(new Date("2026-11-07T01:00:00Z"))
    const result = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})

    expect(result).toEqual({ deleted: 0, rescheduled: false })
    expect(await t.run((ctx) => ctx.db.get(userId))).not.toBeNull()
  })

  it("reschedules itself when 201 expired anonymous users exceed one batch, and finishes draining both runs", async () => {
    vi.setSystemTime(new Date("2026-11-06T00:00:00Z"))
    const t = createConvexTest()
    const userIds = await Promise.all(
      Array.from({ length: 201 }, () => insertTestUser({ t, roles: [USER_ROLES.user], isAnonymous: true })),
    )

    vi.setSystemTime(new Date("2026-11-07T01:00:00Z"))
    const firstRun = await t.mutation(internal.auth.anonymousUsers.purgeExpired, {})
    expect(firstRun).toEqual({ deleted: 200, rescheduled: true })

    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const remaining = await Promise.all(userIds.map(({ userId }) => t.run((ctx) => ctx.db.get(userId))))
    expect(remaining.every((user) => user === null)).toBe(true)
  })
})
