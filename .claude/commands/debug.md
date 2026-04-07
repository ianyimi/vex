# Debug — Bug Research and Fix Suggestion

Given a bug or error you're stuck on, this skill searches GitHub issues, Stack Overflow, and the broader web to find if others have hit the same problem — then presents its findings as a structured report and suggests the most likely fix.

## Usage

```
/debug <description of the bug and/or paste of the error message>
```

**Examples:**
- `/debug Convex mutation throwing "Value is not a valid Convex value" when I pass a Date object`
- `/debug Next.js 14 app router: cookies() called outside of request context in middleware`
- `/debug pnpm install failing with ENOENT on postinstall script in a monorepo — error: Cannot find module './dist/index.js'`
- `/debug better-auth session not persisting between page navigations in Next.js — token is set but useSession returns null on reload`

---

## Goal

Stop you from wasting hours on a bug that someone else already solved. The output is:
1. A `.md` research report saved to disk — what was found, where, and how others solved it
2. A **suggested fix** in the conversation — the most likely solution based on what was found

You still decide what to apply. Nothing changes in your code without your approval.

---

## Process

### Phase 1: Understand the Bug

Parse the user's input to identify:
- **The error message or symptom** — extract the exact error string if present
- **The tools and versions involved** — library names, framework versions, Node/runtime version
- **The context** — what were they doing when it broke, what code pattern triggered it
- **What they've already tried** — if mentioned, note this to avoid suggesting things already ruled out

If the error message is vague (e.g., "it doesn't work"), search based on the symptom description instead. Don't ask for clarification — work with what's there.

### Phase 2: Check the Implementation Log First

Before searching the web, check `agent-os/implementation-log/` for relevant context:

1. Search `.ideaLog.md` files for the affected file paths, function names, or package names mentioned in the bug
2. If a matching log entry is found, read it — it explains why the code was implemented the way it was, what was intentionally deferred, and any known issues noted at the time
3. Cross-reference the commit hash in the log with `git log` to see exactly what changed and when
4. If the log explains the root cause (e.g., "deferred edge case X"), skip web search and report the finding directly

Only proceed to web search if the implementation log doesn't explain the bug.

### Phase 3: Search for the Bug

Search across multiple sources in this order:

#### 1. GitHub Issues
Search the repos of the specific libraries involved:
- Query: `<exact error string> site:github.com`
- Also search: `<tool-name> <keyword from error> is:issue`
- Look for: open and closed issues, prioritize issues with accepted answers or many reactions
- Check comments — the fix is often buried in a comment thread, not the issue title

#### 2. Stack Overflow
- Query: `<error message or symptom> site:stackoverflow.com`
- Look for: accepted answers, answers with high vote counts
- Note the answer date — old answers may reference outdated APIs

#### 3. General Web Search
- Query: `<exact error string> fix` or `<symptom> <tool> solved`
- Look for: blog posts, framework-specific community forums, Reddit threads, official Discord archives if indexed
- Prefer recent results (within the last 2 years unless the tool is stable/old)

#### 4. Official Docs / Changelog
- Check if the tool's migration guide or changelog mentions this behavior
- Query: `<tool> changelog <version>` or `<tool> breaking changes`
- This catches version-mismatch bugs and deprecated API usage

Search until you find at least one credible solution or have exhausted 3+ searches with no result. Don't stop after a single search.

### Phase 4: Analyze Findings

For each relevant result found, assess:
- **Relevance** — does it match the exact error, or just a similar symptom?
- **Solution quality** — is there a concrete fix, or just "it worked for me" with no explanation?
- **Recency** — is this for the same version, or an old version where the API changed?
- **Confirmation** — did multiple people confirm the fix works?

Rank the solutions by confidence:
- `High confidence` — same exact error, confirmed fix, same library version range
- `Medium confidence` — similar error, plausible fix, may need adjustment
- `Low confidence` — related symptom, speculative solution, worth trying

### Phase 5: Write the Research Report

Create the output file and save it:
- **If `agent-os/` folder exists:** save to `agent-os/research/bugs/<slug>.md`
- **Otherwise:** save to `research/bugs/<slug>.md` in the current working directory

Create any missing intermediate directories.

The slug should describe the bug briefly in kebab-case, e.g. `convex-date-value-error`, `nextjs-cookies-middleware-context`, `better-auth-session-null-reload`.

#### Output File Structure

```markdown
# Bug Research: <Short Bug Description>

> **Error / Symptom:** <the exact error message or symptom as provided>
> **Tools involved:** <library/framework names and versions if known>
> **Date researched:** <YYYY-MM-DD>

---

## Summary

<2–3 sentences. What the bug is, why it happens (root cause if found), and what the fix looks like at a high level. If no fix was found, say so and explain what was found instead.>

---

## Root Cause

<Explanation of WHY this happens, not just what to do about it. If unknown, say so.
Example: "Convex serializes values to its own binary format — JavaScript Date objects are not in the allowed value types. You must convert to a Unix timestamp (number) before passing to a mutation.">

---

## Solutions Found

### Solution 1 — <Short Description> *(High / Medium / Low confidence)*

**Source:** [<link title>](<url>)
**Applies to:** <version range or conditions>

<Explanation of the fix — what to change and why it works. Be concrete.>

```<language>
// example code if available
```

---

### Solution 2 — <Short Description> *(Medium confidence)*

**Source:** [<link title>](<url>)
...

---

## What Didn't Work / Dead Ends

<Any solutions that looked promising but turned out to be wrong, outdated, or for a different version.
This prevents re-investigating the same dead ends.>

---

## Related Issues / Further Reading

<Links to related GitHub issues, discussions, or docs that didn't directly solve it but add useful context.>

---

## Search Queries Used

<List the exact searches run, so you can pick up where this left off if needed.>
```

### Phase 6: Suggest a Fix in the Conversation

After creating the file, present the suggested fix directly in the chat:

```
**Bug research saved to:** `<path>`

**Root cause:** <one sentence>

**Suggested fix:**
<concrete code change or action — specific enough to act on immediately>

**Confidence:** High / Medium / Low — <brief reason>

If this doesn't work, the research file has <N> alternative solutions and the exact search queries used.
```

Keep the in-chat suggestion brief and actionable. The file has the full context — the chat message is just enough to try the fix immediately.

Do NOT apply any code changes automatically. Present the fix and let the user decide.

---

## If Nothing Is Found

If searching turns up nothing useful after exhausting the available sources:

1. Note what was searched and what was found (or not found)
2. Suggest reformulating the search — offer 2–3 alternative search queries the user can try manually
3. Check if the tool has an official support channel (GitHub Discussions, Discord) and link to it
4. If the error message is generic or internal, suggest how to get a more specific error (e.g., enable verbose logging, add a try/catch to expose the stack trace)

Report this in the chat AND save the "dead end" research to the file — the search history is still useful.

---

## Key Principles

- **Search broadly, report specifically.** Cast a wide net in Phase 2, but only surface results that are actually relevant to this specific bug. Don't pad the report with tangentially related issues.
- **Root cause over workaround.** If a root cause explanation exists, lead with it. Understanding *why* the bug happens prevents you from hitting it again. A workaround with no explanation is a last resort.
- **Version awareness.** A solution for v2 of a library may not apply to v4. Always note the version context for each solution found.
- **Don't invent fixes.** Only suggest fixes that are grounded in something found during research. If nothing was found, say so — don't synthesize a solution from thin air.
- **Dead ends are valuable.** Documenting what didn't work saves future-you from retreading the same ground. Always record failed search attempts and ruled-out solutions.
- **The file persists, the chat doesn't.** Put everything in the file. The chat message is just the actionable extract.
