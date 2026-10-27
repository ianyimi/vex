"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { NavigationBlockerAdapter } from "@vexcms/react";

/**
 * Next.js App Router implementation of `NavigationBlockerAdapter["useBlocker"]`.
 *
 * The App Router has no `routeChangeStart`-equivalent event and (spec decision 3)
 * programmatic navigation cannot be intercepted by patching
 * `history.pushState`/`replaceState` — Next's own `HistoryUpdater` calls
 * `pushState` from a `useInsertionEffect` AFTER the route has already
 * committed, and patches those methods itself. This hook therefore covers
 * only the two surfaces that fire BEFORE a route change commits: same-origin
 * `<a>` clicks (capture-phase `click` listener) and browser back/forward (a
 * `popstate` listener plus a duplicate-history-entry trap). Programmatic
 * navigation is guarded separately by `@vexcms/react`'s `useVexNavigate`,
 * which consults the guard itself before calling this adapter's
 * `useNavigate` (`useNextNavigate`, this package). `beforeunload` (tab close
 * / hard reload) is also NOT handled here — `@vexcms/react`'s
 * `useUnsavedChangesGuard` registers it directly, framework-independent.
 *
 * Provide the resulting adapter from `NextAdminLayoutClient`:
 * `components={{ …, navigationBlocker: { useBlocker: useNextNavigationBlocker } }}`.
 * `useUnsavedChangesGuard` then calls it once per mounted edit view with the
 * live dirty/autosave state.
 *
 * @param props - See `NavigationBlockerAdapter["useBlocker"]` in
 *   `@vexcms/react` (`packages/react/src/config/useFrameworkComponents.ts`).
 * @returns Nothing — every intercepted navigation surfaces through
 *   `props.onBlock`, never a return value.
 * @throws Never under normal operation; a blocked navigation reports through
 *   `onBlock`, not a throw.
 */
export function useNextNavigationBlocker(
  props: Parameters<NavigationBlockerAdapter["useBlocker"]>[0],
): void {
  const router = useRouter();

  // Refs, not state: the click/popstate listeners below are installed ONCE
  // per mount (empty dep array) so `when` flipping dirty<->clean never tears
  // down and reinstalls them, and the router's method identity (not
  // guaranteed stable across renders) never matters. Every handler reads
  // these refs instead of closing over the render's values.
  const routerRef = useRef(router);
  routerRef.current = router;
  const whenRef = useRef(props.when);
  whenRef.current = props.when;
  const onBlockRef = useRef(props.onBlock);
  onBlockRef.current = props.onBlock;

  // Set just before `history.go(-2)` on a blocked back/forward's Leave, so
  // the `popstate` that fires as a result of `history.go` is treated as the
  // replay instead of re-blocking it.
  const popstateReplayRef = useRef(false);
  // Whether the top-of-stack entry is our same-URL sentinel (pushed when
  // `when` turns true, re-pushed on a blocked popstate).
  const sentinelActiveRef = useRef(false);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const anchor = (event.target as Element).closest("a");
      if (
        !anchor ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        anchor.target ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) {
        // External link — let the browser handle it.
        return;
      }

      if (
        url.pathname + url.search ===
        window.location.pathname + window.location.search
      ) {
        // Same-page `#hash` anchor — not a route change.
        return;
      }

      if (!whenRef.current) {
        return;
      }

      event.preventDefault();
      onBlockRef.current(() => {
        const href = url.pathname + url.search;
        if (isSentinelEntry()) {
          // The sentinel is a same-URL duplicate of the guarded page: replace
          // it, so history matches a navigation made with no guard mounted.
          sentinelActiveRef.current = false;
          routerRef.current.replace(href);
          return;
        }
        routerRef.current.push(href);
      });
    }

    function onPopState() {
      if (popstateReplayRef.current) {
        popstateReplayRef.current = false;
        return;
      }

      const leftSentinel = sentinelActiveRef.current;
      sentinelActiveRef.current = false;
      // Without a sentinel the browser already left the guarded URL — the
      // traversal can no longer be undone, so let it through.
      if (!whenRef.current || !leftSentinel) {
        return;
      }

      // Back/forward only stepped off the sentinel onto the guarded page's own
      // entry (same URL). Re-push the sentinel so a Stay leaves history as it was.
      pushSentinel();
      onBlockRef.current(() => {
        // "Leave": step past the re-pushed sentinel AND the guarded page's own
        // entry, landing where the original back press intended.
        sentinelActiveRef.current = false;
        popstateReplayRef.current = true;
        window.history.go(-2);
      });
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
      // The sentinel is deliberately left in place: it is a traversable
      // same-URL entry (Next merged its router state into it), and popping it
      // here would start an async traversal that races — and cancels — the
      // navigation that usually caused this unmount (e.g. Delete's redirect
      // after the document query already returned null).
      sentinelActiveRef.current = false;
    };
    // Installs once per mount; handlers read refs.
  }, []);

  // A same-URL sentinel entry, pushed as soon as the guard starts blocking, so
  // the first back press lands on the guarded page's own entry instead of
  // leaving it. Never popped (popping triggers a traversal); a Leave through a
  // link replaces it instead.
  useEffect(() => {
    if (!props.when || sentinelActiveRef.current) return;
    pushSentinel();
  }, [props.when]);

  function pushSentinel(): void {
    // Next's patched `pushState` merges its own router state into this object,
    // so the entry stays traversable by the App Router.
    window.history.pushState({ [SENTINEL_STATE_KEY]: true }, "", window.location.href);
    sentinelActiveRef.current = true;
  }
}

/** History-state key marking the guard's same-URL sentinel entry. */
const SENTINEL_STATE_KEY = "__vexNavigationSentinel";

function isSentinelEntry(): boolean {
  const state: unknown = window.history.state;
  return typeof state === "object" && state !== null && SENTINEL_STATE_KEY in state;
}
