# Pull request checklist

Work top to bottom. A section that ends in `close` ends the review.

## 1. Policy (CONTRIBUTING.md)
- **Base** is `dev`. A fork PR on `master` → ask the author to retarget (the developer can also
  change the base); the `Base branch` check already fails.
- **Title** is `type(scope): description` (the `PR title` check shows it).
- **Anchor**: `Fixes #N` on a bug issue, or a link to an Ideas discussion labeled `accepted`.
  Typo and broken-link fixes need neither. No anchor → `close`, pointing at CONTRIBUTING.
- **Claim**: the bug issue has the author's claim comment; a `good first issue` is assigned to
  the author. Assigned to someone else → `close`, naming the assignee.
- **Big change** (public API, more than one package, a new field type, a new dependency): the
  discussion holds a plan the developer approved; otherwise `request-changes` asking for it.
- **Changeset** for a `packages/*` behavior or type change: `patch`; a breaking change carries
  **Breaking:** and **Migration:** text.
- **Template**: what and why, how verified, not verified, all filled in.
- **Maintainer edits**: `gh pr view <n> --json maintainerCanModify` is `true`.

## 2. Spam and farming
Signs: it promotes a tool or site; the diff doesn't address the linked issue; the description
claims things the diff doesn't contain; it's a drive-by on an issue assigned to someone else.
→ `close` with a one-line reason. Reference case: #70, an `llms.txt` "validated with" a
third-party AI-readiness suite, opened against #56, which asked for something else.

## 3. Read the whole diff
`gh pr diff <n>`, all of it, before running anything. Check every claim in the description
against the code.

**Local-run gate.** If the diff touches `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
`.npmrc`, any `*.config.*` file, `scripts/**`, or `.github/**`, don't run it: verdict
`needs-maintainer`, listing those paths, and finish the review read-only.

## 4. Run it in a throwaway worktree
The main working tree is never checked out, stashed, reset, or switched.

```bash
git fetch origin pull/<n>/head                     # updates FETCH_HEAD only
git worktree add --detach ~/tmp/vex-review/pr-<n> FETCH_HEAD
cd ~/tmp/vex-review/pr-<n>
pnpm install --frozen-lockfile
pnpm turbo run build typecheck test --filter=<each package the diff touches>
pnpm lint
```

- **Bug fix**: the regression test fails on the base and passes on the PR, twice each, to rule
  out a flake. For the base, check out the base commit
  (`gh pr view <n> --json baseRefOid`) with `git worktree add --detach ~/tmp/vex-review/pr-<n>-base <sha>`
  and copy only the PR's test files in.
- **Clean up**: `git worktree remove --force ~/tmp/vex-review/pr-<n>` (and `-base`).

## 5. UI changes: check in a browser
Find the vex-www preview of the PR's head:

```bash
sha=$(gh pr view <n> --json headRefOid --jq .headRefOid)
id=$(gh api "repos/{owner}/{repo}/deployments?sha=$sha&environment=Preview – vex-www" --jq '.[0].id')
gh api "repos/{owner}/{repo}/deployments/$id/statuses" --jq '.[0].environment_url'
```

- **No deployment** → the developer hasn't authorized the fork's Vercel build. Put "read the
  diff, then authorize the Vercel preview" in Actions for the developer (the build runs the
  fork's code with the project's Vercel secrets, `deploy:convex` included), and mark the
  browser check pending in the note.
- **Vercel login wall** → append
  `?x-vercel-protection-bypass=$VERCEL_AUTOMATION_BYPASS_SECRET&x-vercel-set-bypass-cookie=true`
  when that variable is set in the shell; otherwise ask the developer.
- Check the change at 375, 390, and 1280 px, light and dark. Measure what the PR claims: hit-test
  tap areas, read computed sizes, try the keyboard. A jsdom assertion is not layout evidence.

## 6. Verdict
`approve`, `request-changes`, `close`, or `needs-maintainer`.
