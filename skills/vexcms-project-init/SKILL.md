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
