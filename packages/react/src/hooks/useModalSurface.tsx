"use client";

import { createContext, use, type ReactNode } from "react";

const ModalSurfaceContext = createContext(false);

/**
 * Marks everything inside as living on a modal surface.
 *
 * Applied once by `Modal`, so any field rendered into a dialog inherits it.
 * Fields are rendered generically by `RenderFieldInputComponents`, which has
 * no per-field prop channel — context is the only way to tell a select deep in
 * a generated form that it is inside a dialog.
 *
 * @param props - Component props.
 * @param props.children - Subtree rendered on the modal surface.
 * @returns The subtree wrapped in a provider marking it as modal.
 */
export function ModalSurfaceProvider({ children }: { children: ReactNode }) {
  return <ModalSurfaceContext value={true}>{children}</ModalSurfaceContext>;
}

/**
 * Whether the calling component is rendered inside a modal surface.
 *
 * A popover inside a dialog must be modal itself so it joins that dialog's
 * focus trap; the same popover on a normal page must not be, because modal
 * popovers lock page scroll.
 *
 * @returns `true` inside a `Modal`, otherwise `false`.
 */
export function useModalSurface(): boolean {
  return use(ModalSurfaceContext);
}
