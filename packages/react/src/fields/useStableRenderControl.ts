"use client";

import { useRef } from "react";

/**
 * Wraps `render` in a function whose identity never changes across the
 * owning component's renders, while its body always delegates to the
 * *latest* `render` passed in — including when invoked during the very
 * render pass that redefined it (the delegate ref is updated synchronously
 * during render, not via an effect, so there is no stale-by-one-render lag
 * the way an effect-based "latest ref" would have).
 *
 * `useFieldControlOverride` wraps every field's `defaultControl` with this so
 * the `renderDefault` an `admin.components.Input` override receives keeps one
 * identity across re-renders of the field — safe both to call directly
 * (`renderDefault(props)`) and to render as JSX (`<RenderDefault {...props} />`,
 * the natural pattern an override uses to wrap the built-in control).
 * Rendering an unstable function as a JSX component type makes React treat
 * every render as a brand-new component type, unmounting (and, for an
 * `<input>`, losing focus on) the subtree it produces each time — which is
 * exactly what happened before this wrapper existed: every `*FieldAdmin`
 * defined its `renderMaskedControl`/`renderBareControl` inline, a fresh
 * closure every render, so `useFieldControlOverride`'s composed chain (and
 * any override rendering it as JSX) remounted the real control on every
 * keystroke.
 *
 * @param render - The field's current render function — may be a fresh
 *   closure every render; only its latest value is ever read.
 * @returns A function with permanent identity across this hook instance's
 *   lifetime (i.e. across the owning component's re-renders, not across
 *   remounts), behaviourally equivalent to the latest `render` passed in.
 */
export function useStableRenderControl<TProps extends object, TResult>(
  render: (props: TProps) => TResult,
): (props: TProps) => TResult {
  const renderRef = useRef(render);
  renderRef.current = render;
  const stableRef = useRef<((props: TProps) => TResult) | undefined>(undefined);
  if (!stableRef.current) {
    stableRef.current = (props) => renderRef.current(props);
  }
  return stableRef.current;
}
