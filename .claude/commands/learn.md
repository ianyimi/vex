# Learn — Curated Doc Guide for Tool Implementation

Given a freeform description of what you're building and which tools you'll use, this skill researches official documentation and produces a curated reading guide so you know exactly what to read, in what order, and when to stop.

## Usage

```
/learn <freeform description>
```

**Examples:**
- `/learn I'm building a real-time presence system using Convex and Liveblocks`
- `/learn setting up file uploads with Convex file storage and an R2 bucket`
- `/learn I need to implement row-level access control in Convex using Better Auth`

---

## Goal

The output is a single `.md` reading guide — not a tutorial, not a summary. It is a **curated list of exact doc pages and sections** that tells you:
- What each page covers
- How it fits into the feature you're building
- What to look for and focus on
- When to stop reading that page and move on

This saves you from opening 15 browser tabs and not knowing where to start.

---

## Process

### Phase 1: Parse the Feature and Tools

Extract from the user's freeform input:
- **What they're building** — the feature, system, or integration
- **Which tools are involved** — libraries, services, frameworks, APIs

If the tools are ambiguous or only partially named, infer the most likely ones based on the context. Do NOT ask the user — make a best guess and note your assumptions in the output file.

### Phase 2: Search for Documentation

For each tool identified, use web search to find:
1. The official documentation homepage
2. The specific sections relevant to the feature being built (not the whole docs)
3. Any API reference pages directly needed
4. Any relevant "Getting Started" or "Concepts" pages that establish the mental model
5. Any integration guides between the tools (e.g., "Convex + Better Auth setup guide")

Search strategy:
- Start with `<tool> official docs <specific topic>`
- Also search `<tool> <other tool> integration`
- Look for exact anchor links (`#section-name`) when a page is long — link directly to the relevant section
- Prefer official docs over community guides, but include community guides if they fill a gap the official docs leave

### Phase 3: Build the Reading Order

Order the reading list so it follows a logical learning path:
1. **Concepts first** — pages that explain the mental model (what a thing is, how it works)
2. **Setup / configuration** — how to wire it up
3. **Core API** — the specific functions, methods, or endpoints you'll actually call
4. **Integration** — how the tools connect to each other
5. **Edge cases / advanced** — limits, gotchas, advanced config only if directly relevant

Do NOT include:
- Pages that are only tangentially related
- Marketing pages or changelog pages
- Pages that duplicate what another link already covers

### Phase 4: Write the Reading Guide

Create the output file and save it:
- **If `agent-os/` folder exists:** save to `agent-os/research/docs/<topic-slug>.md`
- **Otherwise:** save to `research/docs/<topic-slug>.md` in the current working directory

Create any missing intermediate directories.

The topic slug should be kebab-case and describe the feature, e.g. `convex-liveblocks-presence`, `r2-file-uploads`, `convex-rbac-better-auth`.

#### Output File Structure

```markdown
# Reading Guide: <Feature Name>

> **What you're building:** <one-sentence description>
> **Tools covered:** <comma-separated list>
> **Estimated reading time:** <X–Y min> (links only — skip anything marked "skip unless needed")

---

## Overview

<2–3 sentences explaining how the tools connect to accomplish this feature. 
This is the mental model the reading list is building toward. Read this first 
so you know what the destination looks like before you start.>

---

## Reading List

### 1. <Tool Name> — <Page/Section Title>
**Link:** <exact URL with anchor if applicable>
**What it covers:** <one sentence — what is on this specific page/section>
**Why it matters here:** <one sentence — how it connects to the feature you're building>
**Focus on:** <specific methods, concepts, or sections to pay attention to>
**Stop when:** <what signals you've gotten what you need — e.g. "stop after the 'Mutations' section">

---

### 2. <Tool Name> — <Page/Section Title>
...

---

## Integration Points

<Bullet list of the key integration points between the tools — where one tool hands off to another. 
This helps you know which doc pages are talking to each other.>

---

## What to Ignore (For Now)

<Short list of doc sections or features that are adjacent but not needed for this specific feature. 
Saves time from going down rabbit holes.>

---

## Assumptions

<If any tools were inferred or the feature had ambiguous aspects, note them here so the user can correct the guide if needed.>
```

### Phase 5: Report Back

After saving the file, tell the user:
- The path to the file
- How many links were found
- Any tools where the docs were thin or hard to navigate (flag these)
- Any major gaps where you couldn't find a relevant doc page

Do NOT summarize the reading guide content in the chat — the file is the output. Just confirm it was created and where to find it.

---

## Key Principles

- **Exact links only.** No vague "check the docs for X" — every item must have a real URL. If you can't find a specific page, say so rather than linking to the homepage.
- **Context over content.** The value is not in explaining the tool — it's in telling the user *why* they need to read this specific page *for this specific feature*. Always answer: "why am I reading this right now?"
- **Order matters.** A reading list in the wrong order wastes time. Dependencies come first — if page B assumes you've read page A, A comes first.
- **Scope tightly.** Five great links beat fifteen mediocre ones. Cut anything that isn't directly needed to implement the stated feature.
- **Flag the unfamiliar.** If a tool is obscure, niche, or has poor docs, note that explicitly so the user knows to budget more time for that part.
