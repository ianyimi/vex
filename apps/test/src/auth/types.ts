import type { getSession } from "./serverUtils"

export type ServerAuthContext = Awaited<ReturnType<typeof getSession>>
