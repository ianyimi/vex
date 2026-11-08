---
title: Accessibility
description: VexCMS's accessibility conformance statement for the admin panel and the React/Next.js packages.
---

## Conformance target

WCAG 2.2 Level AA in full, plus 2.4.13 Focus Appearance (normally a Level AAA criterion), applied
to the admin panel rendered by `@vexcms/react`'s `AdminLayout` and every `packages/react/src/ui`
primitive, and to the read-only demo of it at [vexcms.dev/admin](https://vexcms.dev/admin).

## How this is tested

Automated: axe-core 4.14 (via Playwright, tagged for WCAG 2.2 A/AA), a colocated `vitest-axe`
check on every interactive primitive, and eslint-plugin-jsx-a11y. We also ran a full
keyboard-only sweep of every admin flow (sign in, create/edit/publish, media upload, list
filters and saved views, live preview). A VoiceOver and 200%-zoom/reflow pass hasn't run yet;
this statement will be updated once it has, with no date promised.

## Last tested

2026-11-08.

## Known limitations

One: selecting, resizing, or choosing a table size in the richtext editor's image and table
tools needs a pointer — there's no keyboard equivalent yet (WCAG 2.1.1 Keyboard, 2.5.7 Dragging
Movements). Every other issue found during testing has been fixed.

## Feedback

Questions about privacy or this page: hello@vexcms.dev.
