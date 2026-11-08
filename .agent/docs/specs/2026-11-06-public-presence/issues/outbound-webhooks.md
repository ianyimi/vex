title: Outbound webhooks
labels: planned, type: feature, area: core

## Context

Nothing in VexCMS notifies an external service when content changes; integrations have to poll.

## Scope

Admin-configured webhook endpoints, triggered by the existing `afterChange`/`afterDelete` lifecycle
hooks, with a signed payload (so the receiver can verify origin), configurable per collection, and a
delivery log with retry on failure.

## Acceptance criteria

- [ ] A webhook can be registered against a collection's change events from the admin
- [ ] A content change delivers a signed POST to the configured URL, with a visible delivery log
- [ ] A failed delivery retries with backoff and the failure is visible in the admin

## Out of scope

An outbound-webhook marketplace or pre-built third-party integrations (Slack, Zapier, etc.) — those
can be built on top of this once it ships.
