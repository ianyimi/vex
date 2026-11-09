import { cronJobs } from "convex/server"

import { internal } from "./_generated/api"

const crons = cronJobs()

crons.hourly("purge expired anonymous users", { minuteUTC: 17 }, internal.auth.anonymousUsers.purgeExpired)

export default crons
