---
"@vexcms/react": patch
"@vexcms/next": patch
---

Unsaved-changes navigation guard. Both edit views now block navigating away from a dirty form
— in-app links and back/forward prompt with a styled Stay/Leave dialog; `beforeunload`
prompts with the browser's native dialog. A form is dirty when its values differ from their
default (`!isDefaultValue`); `useAutosave`'s new `hasUnsavedChanges` result field drives this
on an autosave-enabled document — true during the debounce window, while a save is in flight,
or after a failed save, false once a successful save's reset settles the diff to empty —
already-persisted autosaved work never prompts. The guard releases automatically after a
successful save, delete, or duplicate navigation.

New `useVexNavigate()` hook (`@vexcms/react`) is the supported path for a built-in's
post-mutation redirect (after delete, after a duplicate's create resolves) — it consults the
same blocking state and shows the same dialog as an in-app click or back/forward, falling back
to `window.location.assign` when the adapter has no `useNavigate`.

The interception itself is a framework-adapter capability (`NavigationBlockerAdapter`), not a
`@vexcms/react` dependency on `next/navigation` — `@vexcms/next` is the only adapter that
implements it today, intercepting same-origin anchor clicks in the capture phase and trapping
back/forward via `popstate`; no `pushState`/`replaceState` patching.
