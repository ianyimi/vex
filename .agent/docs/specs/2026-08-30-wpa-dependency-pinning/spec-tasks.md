---
status: done
spec_id: 2026-08-30-wpa-dependency-pinning
touches:
  - "pnpm-workspace.yaml"
  - ".npmrc"
  - "package.json"
  - "packages/*/package.json"
  - "apps/*/package.json"
  - "scripts/check-packed-manifests.mjs"
  - ".changeset/*.md"
prompt_version: 1
---

# 2026-08-30-wpa-dependency-pinning — Tasks

Parent: `2026-08-30-launch-readiness` **WP-A**. All groups are `[agent]`.
No source file changes — manifests, catalog, and one new verification script.

**Must land before WP-5.** Published manifests inherit these values and
consumers cannot be un-shipped.

Steps are strictly sequential: each one's acceptance gate assumes the previous
landed. Steps 1–3 must produce **zero** `pnpm-lock.yaml` diff; step 4 is the
only one that changes published output; step 5 is install-policy only.

Session decisions: per-dep peer-range judgement (not a blanket floor);
`@vexcms/core` peers become `workspace:^`; `minimumReleaseAge: 4320`;
prune all 7 dead entries and sweep every straggler into the catalog.

## Step 1 — Prune dead catalog entries and the unused dep, then sort [agent]
Why: 6 of 88 catalog entries are referenced by **no** workspace manifest
(`@playwright/test`, `playwright`, `@testing-library/dom`,
`eslint-plugin-react`, `eslint-plugin-react-refresh`, `globals`) and
`packages/react` declares `@tanstack/zod-form-adapter@^0.42.1`, which is
imported nowhere in the repo. Pinning entries nothing consumes is pure noise,
and every dead entry is attack surface the moment someone *does* consume it.
Sorting happens here — while values are untouched — so step 3's diff is pure
value changes and stays reviewable.
Verify:
- [x] `pnpm install --no-frozen-lockfile`, then `git diff --numstat pnpm-lock.yaml`
      shows **0 insertions** (measured `0	25`) and
      `git diff -U0 pnpm-lock.yaml | grep '^+ *version:'` is empty — the lockfile
      only shrinks, nothing moves. (The dead *catalog* entries have no lockfile
      presence, but the removed **dependency** does, so "no lockfile change" was
      never achievable here.)
- [x] `pnpm build && pnpm test` green (933 tests)
- [x] `git diff pnpm-workspace.yaml` shows only deletions and line moves — no value edits

## Step 2 — Sweep every straggler version spec into the catalog [agent]
Why: 4 version specs bypass the catalog entirely, so A1's "the catalog is the
single place a version can move" claim is a half-truth: `react-dropzone@^15.0.0`
(`packages/react`), `convex@^1.44.0` (`apps/www`), `turbo@^2.8.10` and
`@changesets/cli@2.30.0` (root). `turbo` proves the point — `^2.8.10` has
already silently drifted to **2.10.4**.
Verify:
- [x] Every `dependencies`/`devDependencies` value in the root manifest,
      `packages/*/package.json`, and `apps/*/package.json` is exactly
      `catalog:` or a `workspace:` specifier — asserted by script, not eyeball
- [x] `pnpm install` reports no changes; `git diff --exit-code pnpm-lock.yaml` clean
- [x] `pnpm build && pnpm test` green

## Step 3 — Pin the default catalog exact [agent]
Why: 69 of 88 entries are ranges, so only `pnpm-lock.yaml` holds the versions
in place. Anything forcing re-resolution — a deleted lockfile, `pnpm update`, a
dependency bot, adding any package — moves them. The acute case is
`better-auth: ^1.5.0`, which resolves to **1.7.2** and violates
`@convex-dev/better-auth@0.11.5`'s `<1.7.0` peer; with
`strict-peer-dependencies=false` in `.npmrc` that installs **silently** and
fails at runtime. CI is protected by `--frozen-lockfile`; dev machines are not.
Every pinned value is copied from the lockfile's existing resolution, so the
install is provably a no-op.
Verify:
- [x] No `catalog:` value in `pnpm-workspace.yaml` contains `^ ~ > < *` or `||`
- [x] `pnpm install` reports no changes; `git diff --exit-code pnpm-lock.yaml` clean
      — this is the whole proof that nothing moved
- [x] `pnpm build && pnpm test` green

## Step 4 — Add `catalogs.peers` and repoint every peerDependency [agent]
Why: the published manifest of `@vexcms/core` today reads
`"convex": "1.44.0"`, `"lucide-react": "0.577.0"`,
`"@tanstack/react-table": "8.21.3"` — **exact**, because the peer says
`catalog:` and the catalog entry is exact. A consumer on convex 1.45.0 gets a
peer conflict. Step 3 makes this worse by pinning 69 more entries. Verified
separately: `@vexcms/core` is itself a `peerDependency` of `better-auth`,
`cli`, and `file-storage-convex` as `workspace:*`, which packs to the exact
`0.1.0-alpha.1` — the same bug, missed by the parent spec. Named catalogs let
one package name carry two specs for its two roles. Peer ranges are permanent
published promises, so each floor is justified individually rather than by a
blanket rule.
Verify:
- [x] `node scripts/check-packed-manifests.mjs` passes: for all 8 publishable
      packages, no `peerDependencies` value is a bare exact version, no
      `dependencies` value is a range, and no value leaks `catalog:`/`workspace:`
- [x] `next` peer floor is `>=15.0.0` — `NextAdminPage.tsx` awaits
      `props.params`, which is Next 15+ typing; `>=14.0.0` was a false promise
- [x] `pnpm install` reports no changes; `git diff --exit-code pnpm-lock.yaml` clean
- [x] `pnpm build && pnpm test` green

## Step 5 — Enable `minimumReleaseAge` and make the lifecycle-script gate explicit [agent]
Why: the highest-value control in WP-A, and the only one covering
**transitive** deps — pinning `nanoid: 5.1.16` says nothing about nanoid's own
tree. A 72h window means a freshly-compromised release is never installed;
the 2025 chalk/debug and shai-hulud compromises were detected within hours.
`onlyBuiltDependencies: []` is added as an explicit, greppable statement of the
posture pnpm 10 already has by default. Deliberately empty, not vacuous: a
fresh install blocks **7** scripts (core-js, esbuild x2, msw x2, sharp,
unrs-resolver) and the tree works anyway because the ones that matter ship
prebuilt platform binaries. Adding a name here grants install-time code
execution (AP-011: pair the promise with something that fails when it stops
holding).
Verify:
- [x] `pnpm config get minimumReleaseAge` → `4320`;
      `pnpm config get minimumReleaseAgeExclude --json` → `["@vexcms/*"]`
- [x] **Clean re-resolve gate:** in a scratch copy with `pnpm-lock.yaml` deleted,
      `pnpm install` succeeds and yields the same versions as step 3 pinned —
      proving no pinned version is younger than the 72h window and that A1's
      claim survives without the lockfile
- [x] `pnpm build && pnpm test` green

## Step 6 — Turn `strict-peer-dependencies` on [agent]
Why: `strict-peer-dependencies=false` is a blanket "ignore every peer conflict,
forever" — it is what let `@convex-dev/better-auth`'s violated peer install
silently, and it will hide the next one just as well. Measured across 4 scratch
scenarios: this is achievable **today on 0.11.5 with the patch intact** (no auth
bump, parent D1 preserved), and the auth upgrade would NOT have been sufficient
on its own. The real obstacle is `@daveyplate/better-auth-ui@3.4.0`'s 34
non-optional peers, whose `"@better-auth/passkey": ">=1.4.6"` auto-installs at
1.7.2 and then demands `better-auth@^1.7.2`. Replaces one global suppression
with three scoped, commented exceptions so any NEW mismatch fails loudly.
Verify:
- [x] A plain `pnpm install` (NO `--strict-peer-dependencies` flag) exits 0
- [x] `strictPeerDependencies: true` is in **pnpm-workspace.yaml**, not `.npmrc` —
      pnpm 10 ignores the `.npmrc` key (verified: it printed the conflict and
      exited 0), so putting it there ships a gate that fails nothing
- [x] Dropping one `allowedVersions` entry makes a plain install exit 1
      (measured), proving both strictness and that the rule is load-bearing
- [x] `pnpm build` → `Tasks: 10 successful, 10 total`; `pnpm test` → 933 passed
- [x] Every `allowedVersions` entry carries a comment naming what it suppresses
      and when it can be deleted

## Step 7 — Changeset [agent]
Why: steps 2–4 change the published manifests of all 8 packages, so consumers
only receive the peer-range fix through a release. Without a changeset the fix
sits in the repo and WP-5 publishes the old exact peers.
Verify:
- [x] `.changeset/*.md` bumps all 8 publishable packages `patch`
- [x] `pnpm changeset status` lists all 8 and no private package
- [x] `pnpm build && pnpm test` green
