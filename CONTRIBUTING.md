# Contributing to VexCMS

VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free
time. New issues are triaged within a week; how fast a fix lands depends on its severity and on
sponsorship.

## Where things go

| You have...                   | Goes to                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| A question about using VexCMS | [Discussions → Q&A](https://github.com/ianyimi/vex/discussions/categories/q-a)                                                                        |
| An idea for a new feature     | [Discussions → Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) — 👍 the ideas you want; I label the ones I'll take `accepted`     |
| A reproducible bug            | [an issue](https://github.com/ianyimi/vex/issues/new/choose)                                                                                          |
| A docs correction             | [an issue](https://github.com/ianyimi/vex/issues/new/choose)                                                                                          |
| A security vulnerability      | [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) (preferred) or `security@vexcms.dev` — never a public issue |

Issues are for things that are broken. A feature request opened as an issue is closed with a
pointer to Ideas.

## Before you write code

Every pull request starts from one of these:

- **A bug fix** links its issue. Comment on the issue to say you're taking it. On a
  `good first issue`, wait until I assign it to you, so two people don't build the same fix.
- **A feature** links an Ideas discussion labeled `accepted`. If it changes a public API,
  touches more than one package, adds a field type, or adds a dependency, post a plan in that
  discussion first — what changes, the public API, and the alternatives you considered — and
  wait for my OK before you write code.
- **A typo or broken-link fix** needs neither. Open the pull request directly.

A pull request without one of these is closed with a pointer back here.

## Opening a pull request

- Fork the repo, branch off `dev`, and open the pull request against `dev`, not `master`.
  `master` only receives releases.
- Title it `type(scope): description`, in [Conventional Commits](https://www.conventionalcommits.org/)
  form — for example `fix(react): show a toast when a media upload fails`. Commits inside the
  pull request can be anything: I squash-merge, so the title becomes the commit.
- Put `Fixes #123` in the description, or the link to the accepted discussion.
- Leave **Allow edits by maintainers** on.
- Keep the diff scoped to the issue. Unrelated cleanups make review slower, not faster.

The [contributing workflow](https://docs.vexcms.dev/dev/contributing/) covers dev setup, running
the checks, changesets, and how a merged change reaches a release.

## What a pull request needs

- **A changeset**, if it changes a published package (`packages/*`): `pnpm changeset`, then
  `patch`. Every change is a `patch`, breaking ones included; describe a breaking change under
  **Breaking:** with migration steps, and I set the final version bump. Docs-only and
  `apps/*`-only changes need none.
- **Tests** for the behavior it changes. A bug fix comes with a regression test that fails
  without the fix.
- **A browser check** for a UI change. Unit tests run in jsdom, which has no layout, so they
  can't prove sizes, clipping, or overflow. Say what you checked and at which widths.
- **Docs** (`apps/docs`), if it changes a public API or documented behavior.
- **Code that follows** the [naming conventions](https://docs.vexcms.dev/dev/naming-conventions/)
  and the [testing and code style](https://docs.vexcms.dev/dev/testing-and-code-style/) rules.
  Reviews check both.
- **Your own verification.** Run every check you mention in the description. AI tools are
  welcome, and the bar is the same for every line however it was written: you ran it, you
  checked it, and you can explain it.

## Review

- CI must pass. On your first contribution, CI waits until I approve the run.
- I check UI changes in a browser on the pull request's Vercel preview, which I approve after
  reading the diff.
- I give every pull request a first review within a week. After you push changes, I review again
  within a week.

## Stale pull requests

If I've asked for changes and there's been no reply for 30 days, I add the `stale` label and
leave a comment. After 14 more days without a reply, I close the pull request; you can reopen it
any time.

When a stale fix is close and the issue matters, I may finish it myself, either by pushing to
your branch or by opening a new pull request that credits you with a `Co-authored-by:` trailer.

## Licensing

Your contribution is licensed under Apache-2.0, the same as the rest of VexCMS (section 5 of the
[Apache License](LICENSE)). There's no CLA to sign and no sign-off line to add.

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
