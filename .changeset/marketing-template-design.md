---
"create-vexcms": patch
---

Rebuild the marketing template around the VexCMS site design, and fix five
defects that made a scaffolded marketing site unusable.

**Defects fixed**

- `next.config.ts` pinned `turbopack.root` to the app directory, which is
  correct standalone but breaks every `--monorepo` scaffold: dependencies are
  hoisted into the workspace root store, so `next build` failed with "Could not
  find the Next.js package". It now walks up for `pnpm-workspace.yaml` and falls
  back to the app directory.
- The marketing overlay's `(frontend)/(site)/page.tsx` collided with base's
  `(frontend)/page.tsx` — both resolve to `/`, and base's bare bootstrap page
  won, so the seeded marketing home page was unreachable. The installer now
  removes base's home route when the overlay is applied.
- The marketing site inherited base's fail-closed session gate, which guards
  every route but `/`. `/features`, `/roadmap` and every other CMS page
  redirected anonymous visitors to sign-in. The overlay now ships its own
  `proxy.ts` guarding `/admin/:path*`; base's remains fail-closed.
- `anyApi` was used for client-side reads in `PageContent`, `SiteHeader` and
  `SiteFooter`, discarding types in a project that has a fully generated `api`.
  All reads now go through `@convex/_generated/api`.
- `logoImage` was passed straight to `<img src>`, but an `upload()` field stores
  an array of media ids — the logo never rendered. A new `MediaImage` component
  resolves the id through the storage adapter and renders `next/image`.

**Template**

- Three new blocks — `Stats`, `CodeShowcase` (shiki-highlighted, server-rendered)
  and `Split`.
- `Hero` gains `variant` (`full` / `compact`) and `installCommand`;
  `Roadmap`'s `status` becomes `shipped | in-progress | planned | exploring`.
- All eight existing renderers rebuilt against the design; new shared
  `Container`, `SectionHeader`, `BrandMark`, `CopyButton`, `InstallCommand`,
  `CodePane` and `MediaImage` components.
- Renderers now import their generated block types from `vex.types.ts` instead
  of re-declaring field shapes by hand.
- `shiki` is added by the installer for marketing scaffolds only, so `--bare`
  does not pay for it.
- A fresh scaffold now passes `lint` with zero problems; previously it reported
  17 errors and 214 warnings before any code was written.

**Admin readability.** Every collection and global in the marketing template
now declares `admin.icon`, so the sidebar reads as labelled sections rather
than a list of identical entries — `pages` `FileText`, `headers` `PanelTop`,
`footers` `PanelBottom`, alongside the existing `themes` `Palette`, `images`
`Image`, `users` `Users` and `siteSettings` `Settings`. Every field across
every collection, global and block config now carries an explicit `label`
(`users.name` was the last one relying on key inference), and the seeded home
hero sets its `variant` and `installCommand` values so no shipped block leaves
a field blank that the design expects filled.

The array item headers were the worst of it: `FormLabel` falls back to the
field's path when a field has no label, and `group()` defaults `label` to `""`
(only `defineCollection` infers one), so every repeatable item rendered as
`[10] - blocks[3].items[9]`. The `group()` passed as each array's `items` now
carries a singular label, so the admin reads `[10] - Roadmap Item`,
`[2] - Feature`, `[3] - Menu Item` and so on across all 12 array fields.
