# Launch Infrastructure — Operations Record

## Vercel

| | |
|---|---|
| Team plan | Pro |
| On-Demand Budget | $___ /month |
| Pause production on overage | On |
| Notification thresholds | 50%, 75%, 100% |
| SMS alert | 100% only |
| Budget set by | ___ (name/date) |

## Uptime monitors (UptimeRobot Free, 5-minute interval)

| Monitor | URL | Type | Keyword | Alert contact |
|---|---|---|---|---|
| www | `https://vexcms.dev` | Keyword | `The content backend for everything Convex.` | Mobile app push |
| docs | `https://docs.vexcms.dev` | Keyword | `VexCMS` | Mobile app push |
| admin | `https://vexcms.dev/admin` | Keyword | `Dashboard` | Mobile app push |
| Convex auth | `https://usable-bee-730.convex.site/api/auth/ok` | HTTP | — | Mobile app push |

Test alert sent: ___ (date, confirmed received).

Keyword sources: the www keyword is the seeded home-page hero heading (`apps/www/convex/seed.ts`);
the admin keyword is `DashboardView`'s `<h1>` (`packages/react/src/admin/DashboardView.tsx`). A
later change to either text breaks its monitor; update the monitor in the same change.

## Convex

Plan, deployment class, and usage thresholds are recorded in `sizing.md` (step 9) — this file
doesn't duplicate them. `usable-bee-730` is www's production deployment.

## Who receives alerts

| Channel | Recipient |
|---|---|
| Vercel spend-management email/SMS | ___ |
| UptimeRobot mobile app push | ___ |
| Convex usage-notification email | ___ (set in step 9) |
