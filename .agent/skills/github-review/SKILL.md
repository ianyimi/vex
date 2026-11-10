---
name: github-review
description: Review new or changed pull requests, issues and Discussions on the GitHub repo and
  draft the replies. Triggers on "/github-review", "review the new PRs", "triage new issues",
  "check the discussions", "anything new on GitHub?". A ledger limits each run to items with
  outside activity since their last review, plus pull requests that went stale. Drafts only;
  the developer posts every reply.
harness_model_role: default
---

# GitHub Review

## Preflight
1. If `.agent/manifest.json` is missing → stop; tell the user to run `harness init`.
2. `gh auth status` succeeds; otherwise stop and ask the developer to log in.
3. Read `CONTRIBUTING.md`: it is the policy every review checks against.

## Steps
1. **List the work.** Run `node .agent/skills/github-review/scripts/ledger.mjs pending`, adding
   `--kind pr|issue|discussion` when the developer names one. It prints JSON:
   - `pending`: open items with outside activity (an author who is neither the developer nor a
     bot) since their last review, each with a `reason` (`new`, `new commits`, `new activity`);
   - `stale`: pull requests waiting on their author after `request-changes`, each with the
     CONTRIBUTING action due (`label` after 30 days, `close` 14 days after the stale comment).
   Both empty → report "nothing new" and stop.
2. **Review each pending item, one at a time**, with its checklist:
   - pull request → `references/pull-requests.md`
   - issue → `references/issues.md`
   - Discussion → `references/discussions.md`
   On a re-review (`reason` is not `new`), read the item's note first and review what changed
   since its last section.
3. **Write the note**: `.agent/docs/github/reviews/<kind>-<number>.md` (format below). A
   re-review appends a new dated section; earlier sections stay as written.
4. **Record it**, after the note exists:
   `node .agent/skills/github-review/scripts/ledger.mjs record --kind <kind> --number <n> --verdict <verdict>`.
5. **Stale pull requests**: for each `stale` row, draft the reply its `action` calls for (the
   stale comment, or the closing comment) into that item's note, then record verdict `stale`
   (for `label`) or `close`.
6. **Report** to the developer: one table (item linked, kind, verdict, one-line reason, note
   path), then every drafted reply ready to paste, and the labels or actions to take by hand.
   The developer posts, labels, assigns, and closes; this skill changes nothing on GitHub.

## Note format

```markdown
# <kind> #<number> — <title>

<url> · @<author>

## <YYYY-MM-DD> — <verdict>

### Findings
- <finding> — evidence: <command and output, measurement, or path:line>

### Drafted replies
**Summary comment**

<markdown>

**Inline — `path:line`**

<markdown>

### Actions for the developer
- <label to add, assignment, close, Vercel authorization, …>
```

## Drafted replies
- GitHub-flavored Markdown, in the developer's voice: first person "I". Follow
  `.agent/docs/standards/docs/voice-and-wording.md`.
- Pull request feedback is split into one summary comment plus one inline comment per finding,
  each headed with its `path:line`, so the developer can post it as a review.
- Every finding states what is wrong, the evidence, and the fix. The #68 review is the model:
  the measured table, the root cause in the code, the exact change.
- Short and specific. One thank-you at most.

## Verdicts
| Kind | Verdicts |
|---|---|
| `pr` | `approve`, `request-changes`, `close`, `needs-maintainer`, `stale` |
| `issue` | `verified`, `needs-repro`, `cant-reproduce`, `duplicate`, `redirect`, `close`, `needs-maintainer` |
| `discussion` | `answered`, `accept`, `ask-for-plan`, `decline`, `noted`, `needs-maintainer` |

`needs-maintainer` means the decision is the developer's (an assignment, a security report, a
diff the local-run gate stopped); the note says what to decide.
