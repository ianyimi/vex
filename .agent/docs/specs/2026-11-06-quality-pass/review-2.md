# Quality pass — K conformance review, pass 2 (2026-11-08)

Re-review of the packages that had an open `VIOLATION`/`GAP` row in `review-1.md`, after the
`apply:` decisions landed. Every open row was a file-role rule question, so the re-check is the
rule engine itself: `harness struct --check` → `✅ OK no naming violations` over the whole tree,
with the new and widened scopes in force. Negative test for the new rules: a scratch
`packages/telemetry/src/Bad-Name.ts` and `packages/react/src/bogus.ts` both failed the check
(`telemetry-package-files`, `react-feature-folders`), and were deleted.

Turning the rules on also surfaced two real misses, fixed in this pass:
`apps/www/src/components/ui/*.test.tsx` (colocated tests the old `host-app-ui-kebab` pattern
didn't allow — pattern widened for `.test`), and `packages/create-vexcms/src/installers/string-utils.ts`
(renamed `stringUtils.ts`, three imports repointed; `create-vexcms` tests 35/35).

## react

### Grouping

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | `react-feature-folders` closed list includes `server` (the `@vexcms/react/server` entry) | `packages/react/src/server/` | 1 | — | - |

## better-auth

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | `better-auth-package-files` | `packages/better-auth/src/**` | all files | — | - |

## telemetry

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | `telemetry-package-files` | `packages/telemetry/src/**` | all files | — | - |

## create-vexcms

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | `create-vexcms-src-files` | `packages/create-vexcms/src/**` (incl. `installers/stringUtils.ts`) | all files | — | - |

## apps/www

### File roles

| kind | rule/area | paths | count | proposed fix | decision |
|---|---|---|---|---|---|
| CONVENTION | `convex-resource-files` covers `apps/www/convex/{*.ts,auth/**,vex/**}` | `apps/www/convex/**` | all files | — | - |
| CONVENTION | `auth-file-roles` covers `apps/www/src/auth/**` | `apps/www/src/auth/**` | all files | — | - |
| CONVENTION | `vexcms-resource-defs` covers `apps/www/src/vexcms/collections/**` | `apps/www/src/vexcms/collections/**` | all files | — | - |
| CONVENTION | `host-app-ui-kebab` allows colocated `.test.tsx` | `apps/www/src/components/ui/*.test.tsx` | 6 | — | - |
