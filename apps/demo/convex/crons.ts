import { cronJobs } from "convex/server"

import { internal } from "./_generated/api"

const crons = cronJobs()

// Reset the demo site database every day at midnight UTC
crons.daily(
  "reset-demo-site",
  { hourUTC: 0, minuteUTC: 0 },
  internal.seed.resetAndReseed,
)

export default crons
