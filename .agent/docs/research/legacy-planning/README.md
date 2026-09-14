# Legacy planning documents

Carried over from the retired `.pi/agent-docs/product/` and `.rebuild/reference/`
trees on 2026-09-14 when those directories were deleted. Kept because
`.agent/docs/product/roadmap.md` cites them as the sources for its long-term
vision and Milestone 2/3 framing, and nothing else in `.agent/` holds the detail.

**These are not current plans.** The v0.1.0 track is
`.agent/docs/product/v0.1.0-launch-plan.md`; where a document here disagrees with
it, the launch plan wins. Read these for the reasoning behind a direction, not for
what to build next.

| File | What it holds | Cited by |
|---|---|---|
| `roadmap-monetization-strategy-v2.md` | Monetization strategy v2, the enterprise package split (environments, SSO, workflows, audit, localization), revenue tiers | `roadmap.md` → Long-term vision |
| `v0.1.0-launch-roadmap.md` | The original M1–M8 launch framing and the "Post-v1 Backlog" | `roadmap.md` → Long-term vision |
| `multi-component-architecture.md`, `multi-component-implementation.md` | `defineComponent()` / workspace routing design (Option A) | `roadmap.md` → Milestone 3, Exploring |
| `maprios-migration-todo.md`, `maprios-migration-analysis.md` | Migration checklist and site analysis for the first real migration off Payload | `roadmap.md` → Milestone 2; `product/maprios-roadmap-gaps.md` is the gap analysis |
| `auto-migration-reference/core-migrations/` | The pre-rebuild `diffSchema` / `planMigration` implementation | Launch plan B1 (deferred; stubs now live on `@vexcms/core/internal`) |

Pre-rebuild API names appear throughout (`object()`, `tabs`, `ui`, `imageUrl`,
`@vexcms/ui`, `admin.blockStyles`). See the API-delta table in
`.agent/docs/specs/2026-08-30-launch-readiness/spec.md` before reusing any code.
