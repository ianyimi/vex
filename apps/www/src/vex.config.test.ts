import { describe, expect, it } from "vitest"

import { TABLE_SLUG_USERS } from "~/db/constants"

import vexConfig from "./vex.config"

/**
 * Regression coverage for `mergeAuthCollections` dropping adapter-set admin
 * options when a project declares its own `users.ts`: this app's `users`
 * collection (`~/vexcms/collections/users.ts`) carries no `disableCreate` of
 * its own, so the merged collection only has it if the merge actually
 * combines the adapter's resolved `admin` with the project's, instead of one
 * replacing the other. Also checks the adapter's `email` field survives into
 * the default view columns, proving the merge keeps the adapter's fields
 * (not just its `admin` block) rather than the project's bare `name`-only
 * declaration winning outright.
 */
describe("vex.config — merged user collection", () => {
  it("keeps the auth adapter's disableCreate and email column after merging with this app's own users.ts", () => {
    const user = vexConfig.collections.find((c) => c.slug === TABLE_SLUG_USERS)
    expect(user).toBeDefined()
    expect(user?.disableCreate).toBe(true)
    expect(user?.admin.view.state.columns).toContain("email")
  })
})
