---
status: in-progress
spec_id: 2026-11-22-project-init-agent-skill
touches:
  - skills/**
  - apps/docs/src/content/docs/guides/agent-skills.mdx
  - apps/docs/public/agent-setup.md
  - apps/docs/astro.config.mjs
  - apps/docs/src/content/docs/dev/naming-conventions.mdx
  - apps/docs/src/content/docs/dev/project-structure.mdx
  - .agent/docs/standards/naming-conventions.md
prompt_version: 1
---

# 2026-11-22-project-init-agent-skill — Spec

## Overview

Launch plan item 20 (SKILL, `v0.1.0-final-sprint.md` § 3b; business decisions D4-10 and D11-4: only
the project-init skill ships at launch). VexCMS users get one installable Agent Skill,
`vexcms-project-init`, which their coding agent follows to take an empty folder to a running
project with a signed-in admin and then, if the user wants, to the first collections and globals.
It ships the way Convex ships agent setup: a public `skills/<name>/SKILL.md` folder installed with
`npx skills add`, a docs page with install and invocation tables, and a one-shot `agent-setup.md`
an agent can be pointed at. Both are wired into the docs site's llms.txt output. COPY (item 21)
links the guide from the README.

## Design Decisions

1. **Agent Skills format with no extensions**: frontmatter `name`, `description` and
   `license: Apache-2.0`, progressive disclosure through `references/`. Why: it's the open standard
   (agentskills.io) that this repo's harness skills, Convex's `convex/agent-skills` and the `skills`
   CLI all use, so the skill installs into Claude Code, Cursor, Codex, Copilot and others.
2. **A public root `skills/` folder in this monorepo**, installed with
   `npx skills add ianyimi/vex --skill <name>`. Why: the `skills` CLI looks in a root `skills/` and
   not in `.agent/skills/`, so the harness's internal skills stay out of what users can install.
   `npx skills add . --list` from the repo root shows exactly the public set (checked; the Convex
   skills committed under `apps/test/.agents/skills` aren't picked up because the root folder is
   found first). Mirrors `convex/agent-skills`' `skills/<name>/` layout.
3. **Name `vexcms-project-init` (developer decision)**. The spec requires `name` to equal the
   folder name, and it is also the slash command. Why: a `vexcms-` prefix can't collide in a shared
   `.agents/skills/` with another vendor's generic `project-init`; installing a second skill of the
   same name overwrites the first. Same idea as Convex's `convex-*` names.
4. **Numbering lives in `skills/README.md` (and the guide's table), never in names.** Why: the
   number would otherwise end up in the slash command. A naming rule (`agent-skill-folders`) pins
   the folder shape for skill 02 and later; the README's "Adding a skill" section is the recipe.
5. **Quickstart only, then a checkpoint (developer decision).** The skill automates the docs
   quickstart up to a signed-in admin, then asks whether to continue into the content model. That
   phase lives in `references/content-model.md` and is loaded only on yes. Deploy stays in the
   deployment guide.
6. **Non-default scaffold options go to the user (developer decision).** `--yes` fixes port 3010,
   email/password on and no OAuth. Anything else means the user runs the interactive
   `create-vexcms` in their own terminal. Why: most agent shells can't answer inquirer prompts, and
   the CLI's own path is the tested one; hand-editing what the CLI generates isn't.
7. **Convex AI files are offered, not forced (developer decision).** `npx convex ai-files install`
   writes `AGENTS.md`/`CLAUDE.md` sections and 30+ Convex skills into the user's repo, so it needs
   consent. It includes Convex's own check for silent download failures (`agent-setup.md`).
8. **Step 5 passes `--configure new --project <name> --dev-deployment cloud`** (run-through finding
   1). Why: a bare `npx convex dev --once` in a shell with no TTY silently created a local anonymous
   deployment even with the CLI logged in. The done check requires `dev:` plus a `.convex.cloud`
   URL.
9. **Install globally in the guide.** `vexcms-project-init` runs before the project exists, and
   `create-vexcms .` refuses a folder that isn't empty, which a project-scoped install (`.agents/`,
   `skills-lock.json`) would make it. The skill also scaffolds into a subfolder whenever the folder
   isn't empty.
10. **A static `agent-setup.md` (developer decision)**, served from `apps/docs/public/` at
    `https://docs.vexcms.dev/agent-setup.md`. It loads the skill through `npx skills use` (prints
    the skill, no install), with a raw-GitHub fallback. Mirrors `convex.dev/agent-setup.md`.
11. **llms.txt wiring**: one `details` line in `starlightLlmsTxt` pointing at `agent-setup.md` and
    the guide, and `guides/agent-skills*` promoted to sit right after the quickstart in
    `llms-small.txt`/`llms-full.txt`. Why: llms.txt can't list a non-page file except as prose, and
    agents read the head of the file first.
12. **Guide URL `/guides/agent-skills/`**: the path COPY's approved README text already links
    (`10-handoffs.md` H10). The guide is autogenerated into the Guides sidebar group, so no sidebar
    edit is needed.
13. **pnpm only**: the docs, templates and LI run-throughs prove the pnpm path. The PM item
    widens support separately.
14. **Validation by a real run** (Convex's contributing rule; developer chose static checks plus a
    full run-through under a scoped P-024 exception). Findings and fixes: `runthrough.md`.
15. **Mirrors**: the folder layout, the install command and the docs page's install and invocation
    tables follow Convex's `agent-skills` repo and its docs page "Convex Agent Skills".
    `agent-setup.md` follows `convex.dev/agent-setup.md`. The skill body follows this repo's
    harness skills (numbered steps, explicit stop points, a references file behind a pointer, per
    `shared-references/writing-for-agents.md`). Deviation: harness skills use `harness_model_role`
    frontmatter; public skills use only spec fields plus `license`.

## Out of Scope

- The README link and section (COPY, item 21).
- Production deploy inside the skill (`/guides/deployment/` covers it).
- Adopting existing Convex tables, and a config-generator skill (a future numbered skill,
  `10-handoffs.md` H11b).
- TanStack Start; any package manager other than pnpm.
- Shipping skills inside the `create-vexcms` templates; a CI validator for `skills/`.
- skills.sh listing, Claude plugin marketplace manifests, MCP servers.
- Fixing the marketing scaffold's `src/lib/metadata.ts` TS2352 after codegen (run-through finding
  4; reported to the developer).

## Implementation

### Step 1 — `skills/` folder and the `vexcms-project-init` skill [agent]

- [x] `skills/README.md`
- [x] `skills/vexcms-project-init/SKILL.md`
- [x] `skills/vexcms-project-init/references/content-model.md`
- [x] `.agent/docs/standards/naming-conventions.md`: `agent-skill-folders` rule
- [x] `apps/docs/src/content/docs/dev/naming-conventions.mdx`: rule entry
- [x] `apps/docs/src/content/docs/dev/project-structure.mdx`: `skills/` paragraph

#### skills/README.md

````markdown
# VexCMS agent skills

[Agent Skills](https://agentskills.io) for coding agents that work on VexCMS projects. Each skill
is one folder holding a `SKILL.md` that an agent loads when the task matches its description.
Install guide: https://docs.vexcms.dev/guides/agent-skills/

| #   | Skill                                                 | What it does                                                                                                                        |
| --- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 01  | [`vexcms-project-init`](vexcms-project-init/SKILL.md) | Scaffolds a new VexCMS project and runs it locally up to a signed-in admin, then offers to model the first collections and globals. |

```bash
# Install one skill for every coding agent on this machine
npx skills add ianyimi/vex --skill vexcms-project-init -g

# Or print it for the current agent without installing anything
npx skills use ianyimi/vex@vexcms-project-init
```

## Adding a skill

- Take the next number. Numbers set the order in this table and in the docs guide; they never
  appear in folder or skill names, because the name is also the slash command.
- Folder `skills/vexcms-<task>/`. The frontmatter `name` equals the folder name (lowercase letters,
  digits and single hyphens), plus a `description` that says what the skill does and when to use
  it (1024 characters at most) and `license: Apache-2.0`.
- One task per skill: a skill makes the agent do something. Background reading belongs in the
  docs, and a skill links the docs page rather than copying it.
- Keep `SKILL.md` under 500 lines. Detail that only some runs need goes in `references/*.md`, one
  level deep, linked from `SKILL.md` by relative path.
- Add the row here and in the table in `apps/docs/src/content/docs/guides/agent-skills.mdx`.
- Check that `npx skills add . --list`, run from the repo root, lists every skill in this table
  and nothing else.
- Validate it by running it: give an agent only the skill (`npx skills use ./skills/<name>`) in a
  throwaway project, note where it gets stuck, and fix the skill.
````

#### skills/vexcms-project-init/SKILL.md

````markdown
---
name: vexcms-project-init
description: Scaffold a new VexCMS project (type-safe headless CMS built on Convex and Next.js) and get it running locally — create-vexcms, a Convex dev deployment, the auth environment variables, both dev servers and the first admin account — then offer to model the first content. Use when the user wants to start, create, set up or initialize a VexCMS project, or asks for a CMS on Convex.
license: Apache-2.0
---

# VexCMS project init

Takes an empty folder to a running VexCMS project with a signed-in admin. Run every command
yourself. Stop only at the steps marked **Ask** (you need an answer) or **User** (only the user can
do it: a browser, a login, an interactive prompt), and wait for the reply before going on.

VexCMS is pre-release: scaffold with the `@alpha` tag. On npm, `latest` still points to an old,
unrelated line. Docs: https://docs.vexcms.dev. The whole docs set in one file for agents:
https://docs.vexcms.dev/llms-small.txt.

## 1. Check the machine and the folder

- `node --version` must be 22 or newer (the scaffold's `engines`). `pnpm --version` must work. If
  either fails → **User**: ask them to install it (https://nodejs.org, https://pnpm.io/installation).
- Pick the target:
  - The current folder is empty → scaffold into `.`.
  - It isn't empty → scaffold into a new subfolder named after the project. This includes a folder
    that holds only `.agents/`, `.claude/` or `skills-lock.json` from installing this skill.
    `create-vexcms` refuses a target that isn't empty.
  - The folder already holds a Next.js or Convex app (`package.json` lists `next` or `convex`) →
    stop and tell the user: this skill scaffolds new projects only, and it doesn't add VexCMS to
    an existing app.
  - A `pnpm-workspace.yaml` exists here or in a parent folder → include the monorepo question in
    step 2.

## 2. Ask the setup questions — **Ask**

Ask all of these in one message, with the defaults shown:

1. Project name — an npm package name: lowercase, no spaces. Default: `my-vexcms-app`, or the
   folder name when scaffolding into `.`.
2. Starter — **marketing site** (default: pages, headers, footers, themes, a site-settings global,
   8 content blocks, a seeded home page) or **bare** (`--bare`: auth, admin panel, media and users;
   no content collections).
3. Multi-tenant organizations? (`--orgs`, default no)
4. Only inside a pnpm workspace: a standalone project, or a new app in this workspace
   (`--monorepo`: scaffolds `apps/<name>` and leaves git and install to the workspace)?
5. Keep the other defaults — dev server port `3010`, email/password sign-in, no OAuth providers?

Answer 5 is yes → step 3a. Answer 5 is no → step 3b.

## 3. Scaffold

### 3a. Defaults

```bash
pnpm create vexcms@alpha <name> --yes        # add --bare / --orgs / --monorepo per the answers
cd <name>                                    # skip when the target is "."
pnpm install                                 # with --monorepo: run it from the workspace root
```

`--yes` answers every prompt with its default: git init on, dependency install off. The scaffold
writes `.env.local` with a generated `BETTER_AUTH_SECRET`, `SITE_URL`, `NEXT_PUBLIC_SITE_URL`, and
placeholder Convex URLs.

### 3b. Other port, sign-in methods or OAuth providers — **User**

The CLI's prompts need an interactive terminal. Give the user this command to run in their own
terminal, from the current folder:

```bash
pnpm create vexcms@alpha <name>              # plus --bare / --orgs / --monorepo per the answers
```

Add the flags before handing it over: the prompts never ask for the starter, so a bare project
needs `--bare` on this command. The CLI asks, in order: framework (Next.js), dev server port,
email/password sign-in, organizations (skipped with `--orgs`), OAuth providers, git init, and
install dependencies (default no). Wait until they say it finished, then `cd <name>` and run
`pnpm install` unless they let the CLI install.

Then, for both paths: read the port from the `dev` script in `package.json`
(`next dev --port=<port>`). The steps below call it `<port>`.

## 4. Offer Convex's agent files — **Ask**

A VexCMS project is a Convex project. Ask: "Also install Convex's AI files? `npx convex ai-files
install` adds Convex's coding guidelines, a Convex section in `AGENTS.md` and `CLAUDE.md`, and
Convex's agent skills." On yes, run it in the project folder. It exits 0 even when a download
fails, so afterwards check that `convex/_generated/ai/guidelines.md` and `.agents/skills` exist,
and run it again if either is missing.

## 5. Create a Convex dev deployment

```bash
npx convex dev --once --configure new --project <name> --dev-deployment cloud
```

This creates a Convex project with a cloud dev deployment, writes `CONVEX_DEPLOYMENT`,
`NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` into `.env.local` in place of the
placeholders, and pushes the functions. Pass the flags: a bare `npx convex dev --once` in a shell
that can't answer prompts silently creates a local anonymous deployment instead.

- The user wants an existing Convex project → **Ask** for its slug and use
  `--configure existing --project <slug>` instead.
- It asks for a team → **Ask** which team, and add `--team <team-slug>`.
- Done when `.env.local` has `CONVEX_DEPLOYMENT=dev:…` and a `NEXT_PUBLIC_CONVEX_URL` ending in
  `.convex.cloud`. `CONVEX_DEPLOYMENT=anonymous:…` or a `http://127.0.0.1` URL means no cloud
  deployment was created, most often because the Convex CLI isn't logged in → **User**: ask them
  to run `npx convex login` in their terminal, then run the same command again.

## 6. Push the auth variables to the deployment

Better Auth runs inside the Convex deployment and never reads `.env.local`, so the deployment
needs its own copy of two values:

```bash
npx convex env set SITE_URL http://localhost:<port>
npx convex env set BETTER_AUTH_SECRET <the BETTER_AUTH_SECRET value from .env.local>
```

Read the secret from `.env.local` and pass it straight to the command. Never echo it into the chat.
A missing or mismatched value here causes a `403` on the first sign-in.

OAuth providers chosen in 3b → **User**: each needs a client ID and secret from the provider's
developer console, with the callback URL `http://localhost:<port>/api/auth/callback/<provider>`.
Put both values in `.env.local` (the scaffold wrote the variable names, e.g. `GITHUB_CLIENT_ID`)
and set each one on the deployment with `npx convex env set`. Details:
https://docs.vexcms.dev/guides/auth/.

## 7. Start the dev servers

Two long-running processes. Start each one in the background (or in its own terminal) and leave
both running:

```bash
pnpm vex:dev    # generates the Convex schema and types from src/vex.config.ts, runs convex dev, watches
pnpm dev        # Next.js on <port>
```

Wait until `vex:dev` prints `Convex functions ready!` and Next.js prints `Ready`. On the
marketing starter, seed the starter content once while `vex:dev` is running:

```bash
pnpm seed
```

Done when `curl -s -o /dev/null -w '%{http_code}' http://localhost:<port>/` prints `200`. The first
request compiles the page and can take 15–30 seconds; allow for that before treating it as hung.

## 8. Create the admin account — **User**

Ask the user to open `http://localhost:<port>` and sign up. On a bare project that's the
**Create Admin Account** button. On the marketing starter, they click **Sign in** in the header,
then **Sign Up** inside the sign-in form. The first account becomes the admin and lands in
`/admin`. No account exists before that, and no credentials are pre-seeded.

Wait until they confirm, then check: `npx convex data user` shows their account with `admin` in
`roles`.

## 9. Report, then checkpoint — **Ask**

Tell the user:

- the project folder, `http://localhost:<port>` and `http://localhost:<port>/admin`;
- the two running processes (`pnpm vex:dev`, `pnpm dev`) and how to stop them;
- `.env.local` holds secrets and is gitignored; keep it out of commits and chat;
- next reading: https://docs.vexcms.dev/guides/quickstart/ (what each step did) and
  https://docs.vexcms.dev/guides/deployment/ (going to production).

Then ask: "Continue into the content model? I'll ask what content the site needs and write the
first collections and globals." Yes → follow `references/content-model.md`. No → stop here.

## Troubleshooting

| Symptom                                                      | Cause and fix                                                                                                            |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `Current directory is not empty`                             | The target holds files. Scaffold into a new subfolder (step 1).                                                          |
| `403` on the first sign-in                                   | Step 6 was skipped, or `SITE_URL` on the deployment has the wrong port. Rerun step 6.                                    |
| The app calls `placeholder.convex.cloud` or `127.0.0.1:3210` | Step 5 didn't create a cloud dev deployment. Rerun step 5, then restart `pnpm dev`.                                      |
| `pnpm seed` fails on a bare project                          | Only the marketing starter has a seed. Skip it.                                                                          |
| Type errors in `convex/vex.schema.ts` or `src/vex.types.ts`  | Both are generated from `src/vex.config.ts`. Fix the config, never these files; `pnpm vex:dev` regenerates them on save. |
````

#### skills/vexcms-project-init/references/content-model.md

````markdown
# Content model — after the checkpoint

Goal: the user's first collections and globals are defined, registered, generated and
typechecking, and each one shows up in `/admin`. Keep `pnpm vex:dev` and `pnpm dev` running from
step 7.

The field API changes between alphas. Before writing a field, read its page for the installed
version: `https://docs.vexcms.dev/fields/<type>/` (`text`, `textarea`, `richtext`, `number`,
`checkbox`, `date`, `select`, `relationship`, `upload`, `array`, `group`, `blocks`, and the rest
in the docs sidebar). `@vexcms/core` in `package.json` shows the installed version.

## 1. Ask what the content is — **Ask**

Ask in one message:

- What does the site publish or store? (For example: blog posts with authors and tags, a product
  catalog, events.)
- For each kind of item: which fields an editor fills in, which ones are required, which point to
  other items (a relationship), and which are images or files (an upload).
- One-off settings such as the site name, contact email or social links → a global, not a
  collection.
- Should any of it have drafts and published versions? (`versions: { drafts: true }`)

Propose the model as a short table (collection or global → field → field type → required) and get
a yes before writing any file.

## 2. Write it the way the project already does

Copy the shape of the files the scaffold already has: `src/vexcms/collections/users.ts` on a bare
project, `src/vexcms/collections/pages.ts` and `src/vexcms/globals/siteSettings.ts` on the
marketing starter.

- **Slug constant**: add `TABLE_SLUG_<NAME>` to `src/db/constants/index.ts`, in the same style as
  `TABLE_SLUG_IMAGES`.
- **Collection**: `src/vexcms/collections/<camelCaseName>.ts` exports a `defineCollection({ … })`
  from `@vexcms/core`. Export it from `src/vexcms/collections/index.ts`.
- **Global**: `src/vexcms/globals/<camelCaseName>.ts` exports a `defineGlobal({ … })`. Export it
  from `src/vexcms/globals/index.ts` (on a bare project, create the folder and its `index.ts`).
  Guide: https://docs.vexcms.dev/guides/globals/.
- **Register**: add each collection to `collections: [...]` and each global to `globals: [...]` in
  `src/vex.config.ts`.
- **Rich text**: a `richtext()` field needs an editor adapter, or the admin panel shows a
  configuration error in place of the editor. Install `@vexcms/richtext-plate` at the same version
  as `@vexcms/core` in `package.json` (`pnpm add @vexcms/richtext-plate@<that version>`) and set
  `editor: plateEditor()` (imported from `@vexcms/richtext-plate`) in the `defineConfig({ … })`
  of `src/vex.config.ts`. Details: https://docs.vexcms.dev/fields/richtext/.
- **Access**: `src/auth/access.ts` gives the `admin` role every permission (`"*": true`), so admins
  can edit the new content without changes. The `user` role, which also covers signed-out
  visitors (`anonRole`), is denied anything not listed. Only when signed-in non-admin users need
  the new content, add the collection to `resources` and give `user` a rule. Guide:
  https://docs.vexcms.dev/guides/access-control/.
- **Generated files**: `convex/vex.schema.ts`, `src/vex.types.ts` and `convex/_generated/` are
  generated. Never edit them; change the config instead.

## 3. Check

- `pnpm vex:dev` regenerates the schema and types on save. Without it running, use
  `pnpm vex:generate` once.
- `pnpm typecheck` reports no errors in the files you wrote or changed. Run it once before step 2
  as well: an error that's already there comes from the scaffold. Report it to the user and
  leave it alone; fixing it isn't part of this task.
- **User**: ask them to reload `/admin`, confirm each new collection and global is in the sidebar,
  and create one document in each.

## 4. Showing the content on the site — only when asked

Reading content in the Next.js app is its own task and isn't part of project init. Point the user
to https://docs.vexcms.dev/guides/local-api/ (queries) and
https://docs.vexcms.dev/guides/caching-and-seo/ (prerendering and revalidation); add
https://docs.vexcms.dev/guides/live-preview/ for page-like content.
````

#### .agent/docs/standards/naming-conventions.md

After the `docs-content-kebab` rule:

```yaml
  - id: agent-skill-folders
    pattern: '^(vexcms-[a-z0-9]+(-[a-z0-9]+)*|README\.md)$'
    scope: ["skills/*"]
    description: The public `skills/` folder holds one folder per installable Agent Skill, named `vexcms-<task>` (the frontmatter `name` must equal it and it is the slash command), plus the numbered index README.md. The number lives only in the README table, never in the name. See /dev/naming-conventions/#agent-skill-folders.
    examples: ["skills/vexcms-project-init", "skills/README.md"]
    counter_examples: ["skills/01-project-init", "skills/project-init", "skills/vexcms_project_init"]
```

#### apps/docs/src/content/docs/dev/naming-conventions.mdx

After `#### docs-content-kebab`:

```mdx
#### agent-skill-folders

The public `skills/` folder holds one folder per installable agent skill, named
`vexcms-<task>`. A skill's frontmatter `name` must equal its folder name, and
it is also the slash command, so the skill's number lives only in
`skills/README.md`'s table.

- **OK:** `skills/vexcms-project-init`, `skills/README.md`
- **Not OK:** `skills/01-project-init`, `skills/project-init`
```

#### apps/docs/src/content/docs/dev/project-structure.mdx

After the template paragraph in "Packages, apps, and templates":

```mdx
The root `skills/` folder isn't a package. It holds the
[agent skills](/guides/agent-skills/) users install into their own coding
agents with `npx skills add ianyimi/vex`: one `vexcms-<task>/SKILL.md` folder
per skill, numbered in `skills/README.md`. It isn't built or published to npm;
the `skills` CLI reads it straight from GitHub.
```

Verify: `npx skills add . --list` from the repo root → `Found 1 skill`, `vexcms-project-init`;
`npx skills use ./skills/vexcms-project-init` prints the skill and its download folder;
`harness doctor` → `naming-violations` OK.

### Step 2 — Docs guide, `agent-setup.md`, llms.txt wiring [agent]

- [x] `apps/docs/src/content/docs/guides/agent-skills.mdx`
- [x] `apps/docs/public/agent-setup.md`
- [x] `apps/docs/astro.config.mjs` (lock taken and released): `details` line, `promote` entry

#### apps/docs/src/content/docs/guides/agent-skills.mdx

````mdx
---
title: Agent skills
description: Install the VexCMS agent skills into Claude Code, Cursor, Codex and other coding agents, and let your agent scaffold and run a new VexCMS project.
---

VexCMS publishes [Agent Skills](https://agentskills.io): folders of instructions your coding
agent loads when a task matches. A skill tells the agent which commands to run, in what order,
and where to stop and ask you. The skills live in the repo's
[`skills/` folder](https://github.com/ianyimi/vex/tree/master/skills) and install with the
[`skills` CLI](https://github.com/vercel-labs/skills) (Node.js 22.20 or later).

## Set up a project with your agent

Open your coding agent in an empty folder and send it this:

```text
Read https://docs.vexcms.dev/agent-setup.md and set up a VexCMS project here.
```

[`agent-setup.md`](https://docs.vexcms.dev/agent-setup.md) tells the agent to load the
`vexcms-project-init` skill and follow it. You don't have to install anything first.

## Available skills

| #   | Skill                 | What it does                                                                                                                        |
| --- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 01  | `vexcms-project-init` | Scaffolds a new VexCMS project and runs it locally up to a signed-in admin, then offers to model the first collections and globals. |

More skills follow after 0.1.0.

## Install

`vexcms-project-init` runs before your project exists, and `create-vexcms` refuses to scaffold
into a folder that isn't empty. Install it for your user, not into the project folder:

```bash
npx skills add ianyimi/vex --skill vexcms-project-init -g
```

The CLI asks which of your coding agents to install it for. Other ways to get it:

```bash
# See every VexCMS skill without installing
npx skills add ianyimi/vex --list

# Install into the current project instead (writes .agents/skills/ and skills-lock.json)
npx skills add ianyimi/vex --skill vexcms-project-init

# Hand one skill to the current agent without installing it
npx skills use ianyimi/vex@vexcms-project-init
```

Update with `npx skills update`, remove with `npx skills remove vexcms-project-init -g`.

## Use a skill

Agents load a skill on their own when your request matches its description, for example "set up
a new VexCMS project". To start one by name:

| Tool                     | Invocation             |
| ------------------------ | ---------------------- |
| Claude Code              | `/vexcms-project-init` |
| Cursor                   | `/vexcms-project-init` |
| VS Code (GitHub Copilot) | `/vexcms-project-init` |
| Codex                    | `$vexcms-project-init` |

## What `vexcms-project-init` does

The agent runs the [quickstart](/guides/quickstart/) for you:

1. Checks Node.js 22+ and pnpm, and picks the target folder (an empty folder, or a new subfolder).
2. Asks you for the project name, the starter (marketing site or `--bare`), organizations, and
   whether the defaults suit you: port `3010`, email/password sign-in, no OAuth providers.
3. Scaffolds with `pnpm create vexcms@alpha … --yes` and installs dependencies. If you want
   other options, it gives you the interactive command to run in your own terminal.
4. Offers to install Convex's own AI files (`npx convex ai-files install`).
5. Creates a Convex project with a cloud dev deployment (`npx convex dev --once --configure new …`)
   and pushes `SITE_URL` and `BETTER_AUTH_SECRET` to it.
6. Starts `pnpm vex:dev` and `pnpm dev`, and seeds the marketing starter.
7. Asks you to sign up. The first account becomes the admin.
8. Asks whether to continue into the content model. On yes, it asks what content your site
   needs, proposes collections and globals, and writes them once you confirm.

It stops for you at four points: logging in to Convex, any non-default scaffold option, OAuth
client credentials, and the first sign-up. It doesn't deploy to production; see the
[deployment guide](/guides/deployment/) for that.

## Docs for agents

The docs site serves [llms.txt](https://llmstxt.org) indexes. Point an agent at `/llms.txt`
(index), `/llms-full.txt` (complete docs) or `/llms-small.txt` (compact). For Convex itself, see
Convex's [agent skills](https://docs.convex.dev/ai/agent-skills) and its
[AI files](https://docs.convex.dev/cli/reference/ai-files).
````

#### apps/docs/public/agent-setup.md

````markdown
# VexCMS setup

Set up a new VexCMS project (a type-safe headless CMS built on Convex and Next.js) in the current
folder. Run the commands yourself. Ask the user only where the skill says to.

1. Load the `vexcms-project-init` skill:

   ```bash
   npx skills use ianyimi/vex@vexcms-project-init
   ```

   It prints the skill's instructions and the folder its reference files were downloaded to.
   Follow the instructions, and read any reference file they name from that folder.

2. If `npx skills` can't reach the network, run it again outside the sandbox. If it still can't
   run, fetch https://raw.githubusercontent.com/ianyimi/vex/master/skills/vexcms-project-init/SKILL.md
   and follow it. Its reference files are under
   https://raw.githubusercontent.com/ianyimi/vex/master/skills/vexcms-project-init/references/.

3. When the project runs, tell the user they can install the skill for good with
   `npx skills add ianyimi/vex --skill vexcms-project-init -g`. Every VexCMS skill is listed at
   https://docs.vexcms.dev/guides/agent-skills/.

VexCMS docs for agents: https://docs.vexcms.dev/llms.txt (index), https://docs.vexcms.dev/llms-small.txt (compact).
````

#### apps/docs/astro.config.mjs

1. Append to `starlightLlmsTxt({ details: [...] })`, after the `/api/**` line:

```js
'- Coding agents setting up a new project: follow https://docs.vexcms.dev/agent-setup.md, which loads the `vexcms-project-init` agent skill. Installing the skills: https://docs.vexcms.dev/guides/agent-skills/.',
```

2. `promote`:

```js
promote: ['index*', 'guides/quickstart*', 'guides/agent-skills*', 'roadmap*'],
```

Verify: `pnpm --filter docs build`. Then `dist/agent-setup.md` is byte-identical to the source,
`dist/llms.txt` carries the details line, `llms-small.txt` has `# Agent skills` right after
`# Quickstart`, `_llms-txt/guides.txt` includes it, and
`git apply --check --include=apps/docs/astro.config.mjs` on LK's `copy-flip.patch` passes.

### Step 3 — Agent run-through and bookkeeping [agent]

- [x] run-through under the scoped P-024 exception; findings applied (`runthrough.md`)
- [x] board: SK section, log lines, human queue (Convex project deletion, post-merge check)
- [x] launch plan item 20 + final-sprint § 3b SKILL ticked (lock)
- [x] session log entry with the guide's final URL for COPY
- [x] `harness struct`

Verify: see `runthrough.md` (reached `/admin` as admin; content model in `/admin`); cleanup done.

## Verification

- `npx skills add . --list` → exactly `vexcms-project-init`.
- Docs: a full `pnpm --filter docs build` fails only in TypeDoc, on FT's in-progress
  `packages/core|react/src/fields/{number,select}` files (FT-3/FT-4, rule 7). The same config
  without the TypeDoc plugin builds clean and shows every output listed under Step 2. Re-run the
  full build once FT's steps are green.
- Run-through: `runthrough.md`.
