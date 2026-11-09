// @vitest-environment edge-runtime
import type schema from "@convex/schema"
import type { TestConvex } from "convex-test"

import { afterEach, describe, expect, it, vi } from "vitest"

import { AUTH_RATE_LIMIT_HEADERS, AUTH_RATE_LIMIT_NAMES } from "~/db/constants"
import { createConvexTest } from "~/testing/createConvexTest"

import { authRateLimiter, hashClientIp, limitAuthRequest } from "./rateLimits"

const SECRET = "test-proxy-secret"

function attestedRequest(props: { ip: string; path: string }) {
  return new Request(`https://example.convex.site${props.path}`, {
    headers: {
      [AUTH_RATE_LIMIT_HEADERS.clientIp]: props.ip,
      [AUTH_RATE_LIMIT_HEADERS.proxySecret]: SECRET,
    },
    method: "POST",
  })
}

function forgedRequest(props: { ip: string; path: string }) {
  return new Request(`https://example.convex.site${props.path}`, {
    headers: {
      [AUTH_RATE_LIMIT_HEADERS.clientIp]: props.ip,
      [AUTH_RATE_LIMIT_HEADERS.proxySecret]: "wrong-secret",
    },
    method: "POST",
  })
}

/**
 * Runs `limitAuthRequest` inside `t.run` and reduces its `Response | null`
 * result to a plain, Convex-serializable shape.
 *
 * `t.run`'s callback executes as a `convex-test` action under the hood
 * (`convex-test@0.0.38`'s `run()`, see its `dist/index.js`), so its return
 * value is round-tripped through `convexToJson` — which throws
 * ("Response {} is not a supported Convex type") on a real Fetch API
 * `Response`, including when a loop discards the result without asserting
 * on it. Every call site in this file needs the same workaround, so it
 * lives here once instead of being repeated at each of the 11 call sites
 * below.
 */
async function runLimitAuthRequest(
  t: TestConvex<typeof schema>,
  request: Request,
): Promise<null | { retryAfter: null | string; status: number }> {
  return t.run(async (ctx) => {
    const response = await limitAuthRequest({ ctx, request })
    return response === null ? null : { retryAfter: response.headers.get("Retry-After"), status: response.status }
  })
}

describe("limitAuthRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("returns null for a non-limited path", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    const result = await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.7", path: "/api/auth/get-session" }))

    expect(result).toBeNull()
  })

  it("allows 5 attested anonymous sign-ins from one IP, then 429s the 6th with a positive Retry-After", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    for (let i = 0; i < 5; i++) {
      const result = await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-in/anonymous" }))
      expect(result).toBeNull()
    }

    const sixth = await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-in/anonymous" }))

    expect(sixth).not.toBeNull()
    expect(sixth?.status).toBe(429)
    expect(Number(sixth?.retryAfter)).toBeGreaterThan(0)
  })

  it("still allows a different attested IP after the first IP is exhausted", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    for (let i = 0; i < 6; i++) {
      await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-in/anonymous" }))
    }

    const otherIp = await runLimitAuthRequest(t, attestedRequest({ ip: "198.51.100.1", path: "/api/auth/sign-in/anonymous" }))

    expect(otherIp).toBeNull()
  })

  it("draws a forged client-IP header with the wrong secret from the shared unattested bucket, regardless of the claimed IP", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    for (let i = 0; i < 30; i++) {
      const result = await runLimitAuthRequest(t, forgedRequest({ ip: `203.0.113.${i}`, path: "/api/auth/sign-in/anonymous" }))
      expect(result).toBeNull()
    }

    const thirtyFirst = await runLimitAuthRequest(t, forgedRequest({ ip: "203.0.113.99", path: "/api/auth/sign-in/anonymous" }))

    expect(thirtyFirst?.status).toBe(429)
  })

  it("allows 3 attested email sign-ups from one IP, then 429s the 4th with a positive Retry-After", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    for (let i = 0; i < 3; i++) {
      const result = await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-up/email" }))
      expect(result).toBeNull()
    }

    const fourth = await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.7", path: "/api/auth/sign-up/email" }))

    expect(fourth).not.toBeNull()
    expect(fourth?.status).toBe(429)
    expect(Number(fourth?.retryAfter)).toBeGreaterThan(0)
  })

  it("429s on the global user-creation limit once 600/hour is exhausted, even for a fresh per-IP bucket", async () => {
    vi.stubEnv("AUTH_PROXY_SECRET", SECRET)
    const t = createConvexTest()

    await t.run(async (ctx) => {
      for (let i = 0; i < 600; i++) {
        const result = await authRateLimiter.limit(ctx, AUTH_RATE_LIMIT_NAMES.globalUserCreation, {})
        expect(result.ok).toBe(true)
      }
    })

    const result = await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.200", path: "/api/auth/sign-in/anonymous" }))

    expect(result).not.toBeNull()
    expect(result?.status).toBe(429)
    expect(Number(result?.retryAfter)).toBeGreaterThan(0)
  })

  it("draws from the shared unattested bucket when AUTH_PROXY_SECRET is unset, regardless of a claimed attestation header", async () => {
    const t = createConvexTest()

    for (let i = 0; i < 30; i++) {
      const result = await runLimitAuthRequest(t, attestedRequest({ ip: `203.0.113.${i}`, path: "/api/auth/sign-in/anonymous" }))
      expect(result).toBeNull()
    }

    const thirtyFirst = await runLimitAuthRequest(t, attestedRequest({ ip: "203.0.113.99", path: "/api/auth/sign-in/anonymous" }))

    expect(thirtyFirst?.status).toBe(429)
  })
})

describe("hashClientIp", () => {
  it("is deterministic for the same ip and secret", async () => {
    const first = await hashClientIp({ ip: "203.0.113.7", secret: SECRET })
    const second = await hashClientIp({ ip: "203.0.113.7", secret: SECRET })

    expect(first).toBe(second)
  })

  it("does not contain the raw ip", async () => {
    const hash = await hashClientIp({ ip: "203.0.113.7", secret: SECRET })

    expect(hash).not.toContain("203.0.113.7")
  })
})
