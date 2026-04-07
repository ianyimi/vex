# Research — Tool Comparison for a Build

Given a freeform description of a problem or feature you need to build, this skill researches available tools, services, and libraries, surfaces their tradeoffs, and produces a structured comparison report with a ranking table.

## Usage

```
/research <freeform description of problem or feature>
```

**Examples:**
- `/research I need a real-time database for a multi-tenant SaaS app`
- `/research auth solution for a Next.js app with SSO, magic links, and RBAC`
- `/research background job queue for a Node.js backend — needs retries, scheduling, observability`
- `/research file storage and CDN for user-uploaded images and videos`

---

## Goal

The output is a single `.md` comparison report that gives you enough information to make a confident tool decision without having to visit every marketing page yourself. It covers what each tool offers, what it costs, what it restricts, and how it plays with your other tools — ranked by the criteria that actually matter for long-term maintainability.

---

## Process

### Phase 1: Understand the Problem

Parse the user's freeform input to extract:
- **The job to be done** — what the tool must accomplish
- **The project type** — web app, CLI, data pipeline, mobile, etc. (infer if not stated)
- **The tech stack** — any tools, languages, or frameworks already mentioned
- **Hard constraints** — anything that immediately disqualifies tools (e.g., "must be self-hostable", "no vendor lock-in", "free tier required")

### Phase 2: Research Available Tools

Search the web to build a comprehensive list of tools that solve this problem. Cast a wide net first — include:
- Established players (the ones everyone uses)
- Strong open-source alternatives
- Newer entrants worth knowing about
- Self-hostable options even if less known

For each tool, research:
1. **What it is** — category, what problem it solves, positioning
2. **Open source & self-hostable** — license type, whether a self-hosted version exists, how actively maintained
3. **Technical limits** — rate limits, storage caps, query complexity limits, data model restrictions, concurrency limits, payload size limits
4. **Vendor lock-in risk** — proprietary data formats, export options, how painful migration would be
5. **Pricing** — free tier details, pricing model (flat, usage-based, seat-based), ballpark cost at scale
6. **Ecosystem & integrations** — language SDKs (not just TypeScript — Python, Go, Rust, etc.), framework adapters, community size, third-party integrations
7. **DX / API ergonomics** — quality of the API design, SDK quality, documentation quality, local dev experience
8. **Maturity & stability** — how long it's been around, production adoption, funding/maintenance status

Aim for 4–8 tools. Fewer if the category is niche, more only if there are genuinely distinct options worth comparing.

### Phase 3: Score and Rank

Score each tool across the following criteria. **Adjust weighting based on project type** (e.g., a self-hosted internal tool weights open source higher; a funded startup might weight DX higher):

#### Ranking Criteria (default priority order)

| # | Criterion | What to score |
|---|-----------|---------------|
| 1 | **Open source & self-hostable** | Is it fully open source? Self-hostable with parity to hosted? Active maintenance? |
| 2 | **Technical limits** | Rate limits, storage caps, data model restrictions, query limits, concurrency. Do these fit the stated use case? |
| 3 | **Vendor lock-in risk** | Can you migrate? Is data exportable? How proprietary is the integration? |
| 4 | **Pricing** | Cost at the expected scale. Free tier generosity. Pricing model predictability. |
| 5 | **Ecosystem & integrations** | SDK coverage across languages. Framework support for the stated stack. Community size. |
| 6 | **DX / API ergonomics** | API design quality, docs quality, local dev experience, type safety |

Scoring scale: `★★★` (strong), `★★☆` (acceptable), `★☆☆` (weak), `✗` (disqualifying).

### Phase 4: Write the Comparison Report

Create the output file and save it:
- **If `agent-os/` folder exists:** save to `agent-os/research/tools/<topic-slug>.md`
- **Otherwise:** save to `research/tools/<topic-slug>.md` in the current working directory

Create any missing intermediate directories.

The topic slug should be kebab-case and describe the category, e.g. `realtime-database`, `auth-solution`, `job-queue-nodejs`.

#### Output File Structure

```markdown
# Tool Research: <Category / Problem>

> **Problem:** <one sentence — what you're trying to solve>
> **Project type:** <inferred project type>
> **Stack context:** <tools already in play, if any>
> **Hard constraints:** <any must-have requirements>
> **Date researched:** <YYYY-MM-DD>

---

## Summary

<2–3 sentences on what the category looks like right now — is it fragmented, dominated by one player, does open source have strong options, etc. Sets the context for the comparison.>

**Top pick:** <tool name> — <one sentence why>
**Runner-up:** <tool name> — <one sentence why>
**Best self-hosted option:** <tool name or "same as top pick">

---

## Tools Compared

### <Tool Name>

**What it is:** <one sentence>
**Open source:** <Yes — MIT/Apache/etc. | Partial — server is closed | No>
**Self-hostable:** <Yes (full parity) | Yes (limited) | No>

**Technical limits:**
- <Rate limit or relevant constraint>
- <Data model restriction if any>
- <Storage / query / size limits>

**Vendor lock-in risk:** <Low / Medium / High> — <why>

**Pricing:** <Free tier details. Paid tier starting price and model.>

**Ecosystem:** <SDK languages, notable framework adapters, community size>

**DX:** <API quality, docs, local dev story — 1–2 sentences>

**Best for:** <the specific use case or project type this fits>
**Watch out for:** <the main gotcha or reason you'd rule it out>

---

### <Tool Name>
...

---

## Ranking Table

| Tool | Open Source | Tech Limits | Lock-in Risk | Pricing | Ecosystem | DX | Notes |
|------|------------|-------------|-------------|---------|-----------|-----|-------|
| Tool A | ★★★ | ★★★ | ★★★ | ★★☆ | ★★★ | ★★★ | Best all-round |
| Tool B | ★☆☆ | ★★★ | ★☆☆ | ★★☆ | ★★★ | ★★★ | Strong DX, high lock-in |
| Tool C | ★★★ | ★★☆ | ★★★ | ★★★ | ★★☆ | ★★☆ | Best self-hosted |

> **Scoring:** ★★★ strong · ★★☆ acceptable · ★☆☆ weak · ✗ disqualifying
> Lock-in Risk: ★★★ = low risk, ★☆☆ = high risk

---

## How They Play Together

<If the user has an existing stack, explain how each top candidate integrates with it. What adapters exist, what you'd need to wire up manually, any known conflicts or complications.>

---

## Recommendation

<3–5 sentences. State a recommendation and justify it. If the answer depends on a specific constraint (e.g., "if you need self-hosting, pick X; if you need the best DX and don't mind vendor lock-in, pick Y"), say so explicitly. Don't hedge — make a call.>

---

## What I Didn't Cover

<Tools or categories that were considered but excluded from the comparison, and why. Keeps the report honest about its scope.>
```

### Phase 5: Report Back

After saving the file, tell the user:
- The path to the file
- The top pick and runner-up in one sentence each
- Any tools that were very close calls worth flagging

Do NOT paste the whole table in the chat — the file is the output. Just confirm it was created and give the high-level verdict.

---

## Key Principles

- **Honest about limits.** Every tool has them. Don't write marketing copy — surface the actual restrictions and gotchas a developer will hit in production.
- **Open source first.** Open source + self-hostable is the baseline to beat. A hosted-only closed-source tool needs to be significantly better in other criteria to rank above a solid open-source option.
- **Context-sensitive ranking.** The weights shift based on project type. A personal project ranks free tier more heavily. A startup product ranks ecosystem and DX higher. An enterprise system ranks lock-in risk and limits highest. Infer the context from the user's prompt and adjust accordingly.
- **No filler tools.** Don't pad the list with tools that are clearly outclassed. If a tool would only appear to lose in the table, leave it out.
- **Make a call.** The recommendation section exists because the user needs to decide. Don't hide behind "it depends" without giving a concrete answer for the most likely scenario.
