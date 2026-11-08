title: Scheduled publishing
labels: planned, type: feature, area: versions

## Context

Publishing and unpublishing happen immediately today; there's no way to queue either for a future time.

## Scope

A `publishAt` (and optionally `unpublishAt`) field on versioned documents, executed by Convex's
scheduler, reusing the existing `publish` write path so hooks and validation still run when the
scheduled time arrives.

## Acceptance criteria

- [ ] Setting a future `publishAt` on a draft publishes it automatically at that time, visible to
      anonymous readers from that moment on
- [ ] Canceling a scheduled publish before it fires leaves the document as a draft
- [ ] The admin edit view shows the pending scheduled time and a cancel action

## Out of scope

Recurring/repeating publish schedules.
