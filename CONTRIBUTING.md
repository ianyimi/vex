# Contributing to VexCMS

VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free
time. New issues are triaged within a week; how fast a fix lands depends on its severity and on
sponsorship.

## Where things go

| You have...                   | Goes to                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A question about using VexCMS | [Discussions → Q&A](https://github.com/ianyimi/vex/discussions/categories/q-a)                                                                        |
| An idea for a new feature     | [Discussions → Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) — a 👍'd idea becomes a tracked issue                              |
| A reproducible bug            | [an issue](https://github.com/ianyimi/vex/issues/new/choose)                                                                                          |
| A docs correction             | [an issue](https://github.com/ianyimi/vex/issues/new/choose)                                                                                          |
| A security vulnerability      | [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) (preferred) or `security@vexcms.dev` — never a public issue |

## Dev setup

```bash
git clone https://github.com/ianyimi/vex.git
cd vex
pnpm install
```

The root scripts run everything through [Turborepo](https://turbo.build):

| Command                       | What it does                                          |
| ----------------------------- | ----------------------------------------------------- |
| `pnpm build`                  | Builds every package and app                          |
| `pnpm typecheck`              | Typechecks the whole workspace                        |
| `pnpm test`                   | Runs Vitest in every package that has tests           |
| `pnpm lint` / `pnpm lint:fix` | ESLint over `packages/*/src/**/*.{ts,tsx}`            |
| `pnpm changeset`              | Records a changeset entry for your change (see below) |

To target one package or app, use `pnpm --filter <name> <script>` — e.g. `pnpm --filter @vexcms/core test`.

`apps/www` and `apps/test` need their own Convex deployment to run or build (`npx convex dev` inside
the app directory, same as the [quick start](README.md#quick-start)), so `pnpm build` fails on them
in a fresh clone. Working on `packages/*` doesn't need one: `pnpm build --filter='./packages/*'`
builds just the packages, and they test and typecheck standalone.

## Changesets

Every PR that changes published package behavior needs a changeset:

```bash
pnpm changeset
```

Pick the packages your change touches and `patch` as the bump — VexCMS is pre-1.0, so every release is
a patch (there's no `minor`/`major` distinction yet). Write a one-line summary; it becomes a line in
the package's CHANGELOG.

## Reproduction bar

Bug reports need either a reproduction link or clear numbered steps from a fresh install — not both.
A Convex-backed repro is a real ask for a stranger to set up, so the bar is "I can follow these steps
and see the bug," not "there's a hosted repo."

## What `status:` means

| Label                    | Meaning                                                   |
| ------------------------ | --------------------------------------------------------- |
| `status: needs-triage`   | Not yet looked at by a maintainer                         |
| `status: needs-repro`    | Reported but missing a reproduction link or clear steps   |
| `status: verified`       | Reproduced by a maintainer                                |
| `status: cant-reproduce` | A maintainer could not reproduce it from the report given |

## Before you open a PR

- Check for an existing issue or discussion first — a PR without one may be closed and asked to start there.
- Keep the diff scoped to the issue. Unrelated cleanups make review slower, not faster.
- Follow the [naming conventions](https://docs.vexcms.dev/dev/naming-conventions/) — file names, export
  shapes, and test placement are checked in review.

## PR checklist

- [ ] A changeset is added (`pnpm changeset`, `patch`)
- [ ] Tests added or updated for the behavior you changed
- [ ] Docs updated (`apps/docs`), if this changes a public API or documented behavior
- [ ] `pnpm typecheck && pnpm test && pnpm lint` pass locally

## Repo map

| Path                           | What's there                                                      |
| ------------------------------ | ----------------------------------------------------------------- |
| `packages/core`                | Field system, collections, access control, schema/type generation |
| `packages/react`               | The admin panel UI                                                |
| `packages/next`                | The Next.js framework adapter                                     |
| `packages/cli`                 | `vex` — `dev`, `deploy`, `generate`                               |
| `packages/better-auth`         | The Better Auth integration                                       |
| `packages/file-storage-convex` | The Convex file-storage adapter                                   |
| `packages/richtext-plate`      | The richtext field's Plate.js editor                              |
| `packages/create-vexcms`       | `pnpm create vexcms` scaffolder and its templates                 |
| `apps/www`                     | vexcms.dev, built on VexCMS itself                                |
| `apps/docs`                    | docs.vexcms.dev (Astro + Starlight)                               |
| `scripts/`                     | Repo-wide checks and sync scripts, run from root `package.json`   |
