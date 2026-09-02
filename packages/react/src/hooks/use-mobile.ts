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
