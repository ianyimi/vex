# Public copy — VexCMS 0.1.0

> The single wording source for every public surface: docs, www (`apps/www/convex/seed.ts`),
> README, GitHub (community files, Sponsors, Discussions), npm, and U's launch kit.
> Quote these strings verbatim. Change them here first, then everywhere they appear.
> Never name a paid tier, a paid feature, a price, or a customer on a public surface.

## Paid-work line

Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.

## Licence line

VexCMS is Apache-2.0 licensed.

## Roadmap — after 0.1.0

Intro: Everything below is free and lands in the Apache-2.0 core. It ships in this order.

1. **Plugin system** — The extension points 0.1.0 ships (admin slots, component overrides, action contributions) become a supported plugin API for collections, fields, hooks, access rules and admin views.
2. **Free features, as demand appears** — No fixed order.
   - **Localization** — Per-field locale values, opted into per collection and per field, with locale-aware drafts.
   - **Scheduled publishing** — Publish and unpublish at a set time, on Convex's scheduler.
   - **TanStack Start adapter** — The admin panel and the caching helpers on a second framework.
   - **Form builder** — Collect input from site visitors, with generated validation and stored submissions.
   - **Outbound webhooks** — Notify other services when content changes.
   - **API keys and team management** — Invite people, assign roles, and issue scoped keys for reading content from outside.
3. **Brownfield adoption** — Add VexCMS to an existing Convex app table by table, without migrating the data it already holds.

Not planned: `imageUrl` field — use `upload` with the media library, or a `url` field.

## Who builds this

VexCMS is built and maintained by one developer, [@ianyimi](https://github.com/ianyimi), in their free time. New issues are triaged within a week; how fast a fix lands depends on its severity and on sponsorship.

## Pull request response window

I give every pull request a first review within a week.

## Funding

Sponsorship pays for time on the free core: faster bug fixes first, then the free roadmap. Sponsor on [GitHub Sponsors](https://github.com/sponsors/ianyimi) (monthly or one-time), or [buy me a coffee](https://buymeacoffee.com/zaye).

## Support channels

Questions and ideas go to [GitHub Discussions](https://github.com/ianyimi/vex/discussions). Bugs go to [issues](https://github.com/ianyimi/vex/issues/new/choose). Security reports go to [private vulnerability reporting](https://github.com/ianyimi/vex/security/advisories/new) or security@vexcms.dev — never a public issue.

## Contact

- hello@vexcms.dev — sponsorship, partnership and business enquiries, and Code of Conduct reports.
- security@vexcms.dev — security reports, when private vulnerability reporting isn't an option.

## Follow

Release emails: one email per release, nothing else — [subscribe](https://buttondown.com/vexcms).

## Security response window

Reports are acknowledged within a week. Supported versions: the latest 0.1.x release.

## GitHub Sponsors

Bio: I build VexCMS, a type-safe headless CMS built on Convex, in my free time. Sponsorship funds the free core: faster bug fixes first, then the free roadmap. Paid add-ons may come later, as separate packages, after the free roadmap. The core stays Apache-2.0, and nothing free becomes paid.

| Tier | Monthly | Description (published text — immutable once published) |
|---|---|---|
| Supporter | $3 | Funds a little free-tier maintenance time every month. Thank you. |
| Backer | $10 | Helps keep bug-fix turnaround inside a week. |
| Sponsor | $50 | Your name in the Sponsors section of the VexCMS README. |
| Company sponsor | $250 | Your name and logo in the Sponsors section of the VexCMS README. |

Goal (monthly amount, set at step 8): When this goal is met, VexCMS gets <N> funded days a month of free-tier work: bug fixes first, then the next roadmap item.

## Footer

The canonical order of the www footer (`footers` doc `Main Footer`, block `main-footer`). Every seed edit inserts its entry at this position. Labels and hrefs are verbatim.

`links`:

| # | label | href | Inserted by |
|---|---|---|---|
| 1 | Features | `/features` | existing |
| 2 | Roadmap | `/roadmap` | existing |
| 3 | Docs | `https://docs.vexcms.dev` | existing |
| 4 | Quickstart | `https://docs.vexcms.dev/guides/quickstart/` | existing |
| 5 | Admin demo | `/admin` | existing |
| 6 | Discussions | `https://github.com/ianyimi/vex/discussions` | public-presence step 10 |
| 7 | Release emails | `https://buttondown.com/vexcms` | public-presence step 10 |
| 8 | Sponsor | `https://github.com/sponsors/ianyimi` | public-presence step 10 |
| 9 | Buy Me a Coffee | `https://buymeacoffee.com/zaye` | public-presence step 10 |
| 10 | Brand | `/brand` | public-presence step 13 |
| 11 | npm | `https://www.npmjs.com/package/@vexcms/core` | existing |
| 12 | Licence | `https://github.com/ianyimi/vex/blob/master/LICENSE` | existing |
| 13 | Privacy | `/privacy` | launch-infrastructure step 13 |
| 14 | Accessibility | `/accessibility` | quality-pass step 11 |
| 15 | Convex | `https://convex.dev` | existing |
| 16 | Convex docs | `https://docs.convex.dev` | existing |

`socialLinks`:

| # | platform | href | icon | Inserted by |
|---|---|---|---|---|
| 1 | GitHub | `https://github.com/ianyimi/vex` | `Github` | existing |
| 2 | GitHub Sponsors | `https://github.com/sponsors/ianyimi` | `Heart` | public-presence step 10 |

## Privacy contact

Questions about privacy or this page: hello@vexcms.dev.

## Release emails privacy entry

Release emails: if you subscribe, your email address is stored by Buttondown, which runs the list and sends one email per release. Buttondown's privacy policy: https://buttondown.com/legal/privacy

## Canonical URLs

- Announcement: https://vexcms.dev/posts/vexcms-0-1-0 (title: "VexCMS 0.1.0"; a draft until D1)
- Brand kit: https://vexcms.dev/brand
- Roadmap: https://docs.vexcms.dev/roadmap/
- Comparison: https://docs.vexcms.dev/compare/
