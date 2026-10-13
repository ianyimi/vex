/**
 * Stable key identifying one highlighted code pane.
 *
 * Client-safe by construction — this module imports nothing (shiki in
 * particular), because both sides compute the key: the server when it builds
 * the highlight map, and `CodePane` in the browser when it looks an entry up.
 *
 * A hash rather than the source text itself: the map is serialised into the
 * RSC payload, and keying by the full code would ship every pane's source a
 * second time.
 *
 * @param props.code - Source text exactly as authored.
 * @param props.language - Resolved grammar name.
 * @returns A short key, stable across server and client for identical input.
 */
export function codeHighlightKey(props: { code: string; language: string }): string {
  const input = `${props.language}\u0000${props.code}`
  // FNV-1a, 32-bit. Collisions only ever mean "render the wrong highlighted
  // HTML for a pane", not a correctness or security problem, and the input
  // space here is a handful of panes per page.
  let hash = 0x811c9dc5
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return `${props.language}-${(hash >>> 0).toString(36)}-${props.code.length}`
}
