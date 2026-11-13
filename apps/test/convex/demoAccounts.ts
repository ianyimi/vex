import { v } from "convex/values";

import { TABLE_SLUG_FIELDS, TABLE_SLUG_USERS } from "~/db/constants";
import { find, update } from "~/vexcms/api";

import { internalMutation } from "./_generated/server";

/**
 * Patches a demo account's `roles`, by email. Called once per account from
 * `scripts/create-demo-accounts.mjs`, right after that account's Better Auth
 * sign-up — `roles` is `input: false`, so sign-up itself can never set it;
 * this is the only path that does. Internal only: never reachable from the
 * client, so it carries no RBAC check of its own, hence `access: { bypass: true }`
 * on both the lookup and the patch.
 *
 * @param args.email - The account's email, exactly as signed up.
 * @param args.roles - The full `roles` array to store (replaces, not merges).
 * @throws When no `user` row matches `email`.
 */
export const setRoles = internalMutation({
  args: {
    email: v.string(),
    roles: v.array(v.string()),
  },
  handler: async (ctx, { email, roles }) => {
    const [user] = await find({
      ctx,
      collection: TABLE_SLUG_USERS,
      withIndex: { name: "by_email", range: (q) => q.eq("email", email) },
      limit: 1,
      access: { bypass: true },
    });
    if (!user) {
      throw new Error(`demoAccounts:setRoles — no user found for ${email}`);
    }
    await update({
      ctx,
      collection: TABLE_SLUG_USERS,
      id: user._id,
      data: { roles },
      access: { bypass: true },
    });
  },
});

/**
 * Points one `fields` document's `relatedUser` relationship at a real `user`
 * document, by each side's email. Demo wiring for the `reviewer` role (which
 * can read/update `fields` but has no access to `user` at all): opening the
 * patched document's edit view as `reviewer` must show `AccessDeniedItemRow`
 * (the locked "Hidden User" row) on `relatedUser`, since the target document
 * resolves but the role can't read it. Internal only, same posture as
 * `setRoles`.
 *
 * @param args.fieldContactEmail - The target `fields` document's `contactEmail`.
 * @param args.userEmail - The `user` document's `email` to link `relatedUser` to.
 * @throws When no `fields` document matches `fieldContactEmail`, or no `user`
 * row matches `userEmail`.
 */
export const linkFieldRelatedUser = internalMutation({
  args: {
    fieldContactEmail: v.string(),
    userEmail: v.string(),
  },
  handler: async (ctx, { fieldContactEmail, userEmail }) => {
    const [field] = await find({
      ctx,
      collection: TABLE_SLUG_FIELDS,
      where: (q) => q.eq("contactEmail", fieldContactEmail),
      limit: 1,
      access: { bypass: true },
    });
    if (!field) {
      throw new Error(
        `demoAccounts:linkFieldRelatedUser — no fields document found for ${fieldContactEmail}`,
      );
    }
    const [user] = await find({
      ctx,
      collection: TABLE_SLUG_USERS,
      withIndex: { name: "by_email", range: (q) => q.eq("email", userEmail) },
      limit: 1,
      access: { bypass: true },
    });
    if (!user) {
      throw new Error(`demoAccounts:linkFieldRelatedUser — no user found for ${userEmail}`);
    }
    await update({
      ctx,
      collection: TABLE_SLUG_FIELDS,
      id: field._id,
      data: { relatedUser: [user._id] },
      access: { bypass: true },
    });
  },
});
