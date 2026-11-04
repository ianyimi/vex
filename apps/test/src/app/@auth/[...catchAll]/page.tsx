/**
 * Catches every route under this slot that isn't the intercepted `/auth/*`
 * page or the exact root (`page.tsx`) — i.e. soft-navigating anywhere else
 * while the auth modal is open. Without this, Next.js's documented parallel-
 * route limitation applies: on a soft navigation to a URL this slot has no
 * match for, it keeps rendering whatever was last active instead of falling
 * back to `default.tsx`, so the modal would stay open over the new page. A
 * catch-all gives the slot an explicit (null) match for every other route,
 * closing the modal the instant the caller navigates away.
 */
export default function Page() {
  return null
}
