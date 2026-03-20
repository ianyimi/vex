import { type Doc, type Id } from "@convex/_generated/dataModel"

import { type TABLE_SLUG_USERS } from "./constants"

export type User = Doc<typeof TABLE_SLUG_USERS>
export type UserID = Id<typeof TABLE_SLUG_USERS>
