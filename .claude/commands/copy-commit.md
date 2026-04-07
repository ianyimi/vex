# Copy Commit — Copy the Commit Title to Clipboard

Find the most recent `.commit.md` file in `agent-os/implementation-log/` and copy only the first line (the commit title) to the clipboard using `pbcopy`.

## Usage

```
/copy-commit
```

No arguments. Always operates on the most recently written `.commit.md`.

## Related

`/copy-commit-body` — copies everything after the blank line (the commit body/description).

---

## Instructions

1. Find all `.commit.md` files under `agent-os/implementation-log/` — pattern `YYYY/MM/YYYY-MM-DD.commit.md` (or `YYYY-MM-DD.N.commit.md` for multiple runs in one day)
2. Sort by filename to find the most recent one
3. Run: `head -1 <path> | pbcopy` to copy only the title line to clipboard
4. Print the title in the conversation so the developer can confirm what was copied
5. Print the file path it came from

If no `.commit.md` files exist yet, say so and explain that `/sync-spec` generates them.

## Output format

```
Copied title to clipboard from: agent-os/implementation-log/YYYY/MM/YYYY-MM-DD.commit.md

feat(core): short summary under 72 chars

Run /copy-commit-body to copy the description.
```
