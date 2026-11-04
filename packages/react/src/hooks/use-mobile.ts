import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Tracks whether the viewport is narrower than `MOBILE_BREAKPOINT` (768px),
 * updating live via a `matchMedia` change listener so components can adapt
 * layout (e.g. collapsing the sidebar) as the window is resized.
 *
 * @returns `true` once the viewport has been measured and is below the
 *   breakpoint; `false` otherwise (including before the initial measurement).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Gates a mobile/desktop flag (e.g. {@link useIsMobile}'s own return value) behind THIS
 * component's own mount, not just the flag's own "measured yet" state — needed wherever the
 * flag crosses a `<Suspense>` boundary via context (e.g. `ui/sidebar.tsx`'s `Sidebar`/
 * `SidebarMenuButton`, read from `SidebarProvider`'s `useIsMobile()` through
 * `SidebarContext`): `useIsMobile()` alone starts `false` on every FRESH mount, server or
 * client, which is safe as long as the consumer mounts (and hydrates) at the SAME time as the
 * provider — but a Suspense boundary that streams in on a later tick (an `authPromise` fetch)
 * can hydrate AFTER the provider's own `useIsMobile()` effect has already run and
 * flipped context to `true` on a narrow viewport, so the LATE subtree's first render would
 * already see `true` where the server (which never runs effects) rendered `false` — a
 * hydration mismatch despite `useIsMobile()` itself being written correctly. Re-gating on
 * THIS component's own mount guarantees its first render always matches the server regardless
 * of when in the tree-wide hydration sequence it actually happens; it only reflects the real
 * flag on a normal post-mount re-render of its own, which is ordinary reactivity, not a
 * hydration diff.
 *
 * @param isMobile - The flag to gate, typically `useIsMobile()`'s own return value (possibly
 *   read through context, i.e. computed by a DIFFERENT component than the caller).
 * @returns `false` until this component itself has mounted, then `isMobile` as given.
 */
export function useIsMobileAfterOwnMount(isMobile: boolean): boolean {
  const [hasMounted, setHasMounted] = React.useState(false)
  React.useEffect(() => {
    setHasMounted(true)
  }, [])
  return hasMounted && isMobile
}
