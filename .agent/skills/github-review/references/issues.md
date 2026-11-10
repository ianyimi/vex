# Issue checklist

1. **Kind.**
   - A feature request or a question → `redirect`: draft a reply pointing at
     [Ideas](https://github.com/ianyimi/vex/discussions/categories/ideas) or
     [Q&A](https://github.com/ianyimi/vex/discussions/categories/q-a); the developer closes it.
   - A security report → `needs-maintainer` at once, with a reply moving it to private
     vulnerability reporting. The note records only that it happened, none of its details.
   - Spam → `close`.
2. **Duplicates.** `gh search issues --repo {owner}/{repo} "<key terms>" --state all`. Found →
   `duplicate`, linking it.
3. **Completeness.** The bug form's versions, steps, expected and actual. No steps and no repro
   link → `needs-repro`, with a reply asking for exactly what's missing.
4. **Verify the claim** against `origin/dev`, not the working tree (it holds uncommitted work):
   `git show origin/dev:<path>`. When a failing test is cheap to write, write it in
   `git worktree add --detach ~/tmp/vex-review/issue-<n> origin/dev` and remove the worktree
   afterwards. Reproduced → `verified`. The code shows it can't happen as described →
   `cant-reproduce`, with the evidence.
5. **Labels.** Propose `type:`, `area:`/`adapter:`, and `status:` labels from
   `.github/labels.yml`; the developer applies them.
6. **Claims.** Someone asks to take an issue → `needs-maintainer`, with a recommendation:
   assign them, or say who claimed it first.
