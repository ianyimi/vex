# N: Run-through — 2026-11-06-launch-infrastructure

One row per check, per template. Fill in `date`/`result` after running against a fresh Convex
deployment per template (step 19's `[dev]` sub-item).

## base-nextjs

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms my-base-app` (base-nextjs preset) | Install, typecheck, `vex dev` codegen all succeed | |
| `vex dev` generates | after scaffold, run `vex dev` once | `convex/_generated/api.d.ts`, `convex/vex.schema.ts`, `src/vex.types.ts` all present and typecheck | |
| First-user signup becomes admin | sign up as the first user through the app's sign-up form | Redirected to `/admin`; the user's `roles` is `["admin"]` | |
| `curl` sign-up escalation is rejected | `curl -s -X POST http://localhost:3010/api/auth/sign-up/email -H "content-type: application/json" -d '{"email":"escalate@example.com","password":"correcthorsebattery","name":"Escalate","roles":["admin"]}'` (base's `dev` script uses `--port=3010`), then `npx convex data user` | The `escalate@example.com` row has `roles: ["user"]`, not `["admin"]` | |
| Signed-out visit runs no `isBootstrapped` | open `/` signed out; watch the Convex dashboard's dev-deployment logs | No `vex/firstUser:isBootstrapped` execution logged | |
| Create / edit — `user` | admin panel, users collection | Create and edit succeed | |
| Create / edit — `images` | admin panel, media collection | Upload-create and edit succeed | |
| Live preview | open an edit view with live preview enabled | Preview pane reflects unsaved edits | |
| Media upload | upload an image through the media library | Upload succeeds; `generateUploadUrl` → `createMediaDocument` round-trip completes | |
| `next build` | `pnpm build` | Exits 0 | |

## marketing-site

| Check | Command / steps | Expected | Result |
|---|---|---|---|
| Scaffold | `pnpm create vexcms my-marketing-app` (marketing-site preset) | Install, typecheck, `vex dev` codegen all succeed | |
| `vex dev` generates | after scaffold, run `vex dev` once | `convex/_generated/api.d.ts`, `convex/vex.schema.ts`, `src/vex.types.ts` all present and typecheck | |
| First-user signup becomes admin | sign up as the first user through the app's sign-up form | Redirected to `/admin`; the user's `roles` is `["admin"]` | |
| `curl` sign-up escalation is rejected | the same `curl` against the marketing scaffold's dev origin (its `dev` script's port), then `npx convex data user` | The `escalate@example.com` row has `roles: ["user"]`, not `["admin"]` | |
| Signed-out visit runs no `isBootstrapped` | open `/` signed out; watch the Convex dashboard's dev-deployment logs | No `vex/firstUser:isBootstrapped` execution logged | |
| Create / edit / publish — `pages` | admin panel, `pages` collection | Create, edit, publish all succeed | |
| Create / edit / publish — `headers` | admin panel, `headers` collection | Create, edit, publish all succeed | |
| Create / edit / publish — `footers` | admin panel, `footers` collection | Create, edit, publish all succeed | |
| Create / edit / publish — `themes` | admin panel, `themes` collection | Create, edit, publish all succeed | |
| Live preview | open a `pages` edit view with live preview enabled | Preview pane reflects unsaved edits | |
| Media upload | upload an image through the media library | Upload succeeds; `generateUploadUrl` → `createMediaDocument` round-trip completes | |
| vexcms-specific content absent | admin sidebar, site footer, `/posts/x`, `/privacy`, `/brand`, `/launch-week`, `/tour` | No `posts` collection; footer shows none of Privacy/Accessibility/Brand/Discussions/Release emails/Sponsor/Buy Me a Coffee and no Sponsors social link; each listed route returns 404; roadmap and FAQ show generic template copy (cross-spec decision 6) | |
| `next build` | `pnpm build` | Exits 0; seeded routes prerender | |

Fix every failure in both the template and its source app (AP-020), then re-run the failed row.
