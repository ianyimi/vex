title: Localization
labels: planned, type: feature, area: core

## Context

VexCMS has no per-field locale support today; every value is stored once, globally.

## Scope

Per-field locale values, opted into per collection and per field, with locale-aware drafts. Values for
a locale that hasn't been translated yet fall back to the collection's default locale rather than
rendering empty.

## Acceptance criteria

- [ ] A field can be marked `localized: true` and store a distinct value per configured locale
- [ ] The admin panel has a locale switcher on the edit view for a document with localized fields
- [ ] Drafts are locale-aware: publishing one locale doesn't publish other locales' drafts

## Out of scope

Machine translation and translation-approval workflows.
