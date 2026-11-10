import { httpRouter, type FunctionArgs } from "convex/server"

import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"
import { createAuth } from "./auth"

const http = httpRouter()

// Auth request handler - basePath hardcoded to /api/auth for now
const authRequestHandler = httpAction(async (ctx, request) => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const auth = createAuth(ctx)
  return await auth.handler(request)
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

const TELEMETRY_SCHEMA_VERSION = 1
const TELEMETRY_MAX_BODY_BYTES = 524_288

const telemetryEventsHandler = httpAction(async (ctx, request) => {
  const contentLength = request.headers.get("content-length")
  if (contentLength !== null && Number(contentLength) > TELEMETRY_MAX_BODY_BYTES) {
    return new Response(null, { status: 413 })
  }

  const bodyText = await request.text()
  if (new TextEncoder().encode(bodyText).length > TELEMETRY_MAX_BODY_BYTES) {
    return new Response(null, { status: 413 })
  }

  let body: unknown
  try {
    body = JSON.parse(bodyText)
  } catch {
    return new Response(null, { status: 400 })
  }

  if (typeof body !== "object" || body === null) {
    return new Response(null, { status: 400 })
  }
  if (!("schemaVersion" in body) || body.schemaVersion !== TELEMETRY_SCHEMA_VERSION) {
    return new Response(null, { status: 400 })
  }

  const payload = body as FunctionArgs<typeof internal.telemetry.ingest.ingest>
  try {
    await ctx.runMutation(internal.telemetry.ingest.ingest, payload)
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    return new Response(null, { status: 400 })
  }

  return new Response(null, { status: 204 })
})

http.route({
  handler: telemetryEventsHandler,
  method: "POST",
  path: "/telemetry/events",
})

export default http
