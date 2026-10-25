# 2026-10-24-telemetry — Spec stem

> **Not a spec yet.** Input for the `dev-spec` interview for launch-plan item **M**. Records
> the pattern already decided so the interview only settles the open questions below.

## Goal

Learn which field types, features and config shapes real projects use, so 0.1.x work
targets what people build — without collecting anything that identifies a company, a
person, or their content.

## Decided (2026-10-24): the commonly accepted CLI telemetry pattern

The pattern Next.js, Astro and Turborepo use; confirm each detail against their current docs
during the spec.

| # | Decision |
|---|---|
| T1 | **Anonymous, on by default (opt-out)**, collected only by the CLI at build/dev time (`vex dev`, `vex deploy`, `create-vexcms`). Nothing runs in the customer's Convex deployment or in the browser |
| T2 | **First-run notice** printed once per machine: what is collected, link to the docs page, how to disable |
| T3 | **Disable controls:** `vex telemetry disable` / `enable` / `status` (stored per machine), an env var (`VEX_TELEMETRY_DISABLED=1`), and `DO_NOT_TRACK=1` honoured |
| T4 | **Off in CI** (detected via the `CI` env var and common CI providers) |
| T5 | **Config shape only:** field-type counts, enabled features (drafts, live preview, conditions, slots, masks, localization…), collection / global / block counts, adapter kinds, package and Node versions, OS. Collection, field and block **names are never sent** (dropped, not hashed, unless a stable hash is shown to be needed) |
| T6 | **Random anonymous project id + machine id** so repeat runs of one project are not counted twice; no link to user, email, repo URL, or Convex deployment |
| T7 | **Endpoint on a vendor-owned Convex deployment** (HTTP action); **no IP address stored**; fire-and-forget with a short timeout so telemetry never slows or fails a build |
| T8 | **Public docs page** listing every field sent, with an example payload; `vex telemetry status --json` prints the exact payload locally |
| T9 | **Linking to a customer is out of scope** — a post-0.1.0, opt-in, licence-bound feature for paying customers only |

## Open questions for the interview

1. Which commands send events, and is it one event per command run or per session?
2. Exact payload schema and its version field; how the schema evolves.
3. Retention period, and who can read the data.
4. Where the per-machine setting lives (`~/.config/vexcms/…`) and how it interacts with the env vars.
5. Does `create-vexcms` share the CLI's notice/setting or have its own?
6. Lawyer check: opt-out default and notice wording (GDPR / CCPA).
7. Test strategy: payload snapshot tests prove no names leak.

## Acceptance (for the eventual spec)

- A project with collections named `secretProject` produces a payload containing no
  collection, field or block names.
- `DO_NOT_TRACK=1`, the env var, `vex telemetry disable`, and `CI=true` each send nothing.
- An unreachable endpoint adds no visible delay or error to `vex dev`.
- The docs page lists every field the payload contains.
