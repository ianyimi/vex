import { httpRouter } from "convex/server"

import { betterAuthClient, createAuth } from "./auth"

const http = httpRouter()

betterAuthClient.registerRoutes(http, createAuth)

export default http
