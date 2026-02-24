import { httpRouter } from "convex/server"

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

export default http
