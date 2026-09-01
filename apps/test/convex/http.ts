import { httpRouter } from "convex/server"

import { httpAction } from "./_generated/server"
import { createAuth } from "./auth"

const http = httpRouter()

// Auth request handler - basePath hardcoded to /api/auth for now
const authRequestHandler = httpAction(async (ctx, request) => {
  // Suppress the oidc-provider deprecation warning spammed by @convex-dev/better-auth
  // on every request. Convex wraps console.warn per-invocation, so this must run
  // inside the handler (not at module level) to intercept after Convex's wrapper is set.
  // Remove once @convex-dev/better-auth migrates to @better-auth/oauth-provider.
  const _warn = console.warn
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("oidc-provider")) {
      return
    }
    _warn(...args)
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const auth = createAuth(ctx)
    return await auth.handler(request)
  } finally {
    console.warn = _warn
  }
})

// Register auth routes for GET and POST
http.route({
  handler: authRequestHandler,
  method: "GET",
  pathPrefix: "/api/auth/",
})

http.route({
  handler: authRequestHandler,
  method: "POST",
  pathPrefix: "/api/auth/",
})

export default http
