# Copy Commit Body — Copy the Commit Description to Clipboard

Find the most recent `.commit.md` file in `agent-os/implementation-log/` and copy everything after the blank line (the commit body/description) to the clipboard using `pbcopy`.

## Usage

```
/copy-commit-body
```

No arguments. Always operates on the most recently written `.commit.md`.

## Related

`/copy-commit` — copies just the first line (the commit title).

---

## Instructions

1. Find all `.commit.md` files under `agent-os/implementation-log/` — pattern `YYYY/MM/YYYY-MM-DD.commit.md` (or `YYYY-MM-DD.N.commit.md` for multiple runs in one day)
2. Sort by filename to find the most recent one
3. Run: `tail -n +3 <path> | pbcopy` to copy everything from line 3 onward (skipping title and blank line)
4. Print the body content in the conversation so the developer can confirm what was copied
5. Print the file path it came from

If no `.commit.md` files exist yet, say so and explain that `/sync-spec` generates them.

## Output format

```
Copied body to clipboard from: agent-os/implementation-log/YYYY/MM/YYYY-MM-DD.commit.md

- Bullet describing the first meaningful change
- Bullet describing the second change

Spec: .rebuild/specs/NN-<name>.md (Step N)
Log: agent-os/implementation-log/YYYY/MM/YYYY-MM-DD.ideaLog.md

Run /copy-commit to copy the title.
```
