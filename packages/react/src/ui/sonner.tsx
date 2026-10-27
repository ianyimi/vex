"use client";

import { createContext, useContext } from "react";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";

import { ThemeContext } from "./ThemeProvider";

/**
 * Marks that a `<Toaster>` is already mounted somewhere above in the tree.
 *
 * sonner's `toast()` calls push into one global, shared queue — every
 * mounted `<Toaster>` renders every toast, so two mounted instances render
 * each toast twice. `AdminLayout` mounts a `<Toaster>` by default, but a host
 * app that renders this same exported `<Toaster>` higher up (e.g. in its root
 * layout, for its own public-site toasts) wants exactly one viewport, not
 * two — this context is how the nested one detects the ancestor and skips.
 */
const ToasterMountedContext = createContext(false);

/**
 * Renders sonner's toast viewport, synced to the admin panel's light/dark
 * theme — unless an ancestor `<Toaster>` (this same component, rendered
 * higher in the tree, typically by the host app) is already mounted, in
 * which case this renders nothing and toasts push into that ancestor's
 * viewport instead.
 *
 * Mounted by default inside `AdminLayout`. A host app that wants its own
 * toast positioning/config, shared between its own toasts and the admin
 * panel's error toasts (`useVexMutation`'s `onError`), should render this
 * exported `<Toaster>` — not sonner's own — above `AdminLayout`;
 * `AdminLayout`'s internal mount then defers to it automatically. This only
 * detects another instance of *this* component — sonner's own `<Toaster>`
 * rendered directly (bypassing this wrapper) has no way to announce itself
 * and would still double-render.
 *
 * Reads the theme via the raw `ThemeContext`, not `useTheme()`: a `<Toaster>`
 * rendered by the host app above `AdminLayout` sits outside `ThemeProvider`
 * (mounted inside `AdminLayout`), where `useTheme()` would throw — this
 * degrades to `"system"` instead.
 *
 * @param props - Forwarded to sonner's `<Toaster>`, overriding the theme/position/richColors defaults.
 * @returns The rendered toast viewport, or nothing if an ancestor already mounted one.
 */
function Toaster(props: ToasterProps) {
  const alreadyMounted = useContext(ToasterMountedContext);
  const theme = useContext(ThemeContext)?.resolvedTheme ?? "system";

  if (alreadyMounted) {
    return null;
  }

  return (
    <ToasterMountedContext.Provider value={true}>
      <SonnerToaster theme={theme} richColors position="bottom-right" {...props} />
    </ToasterMountedContext.Provider>
  );
}

export { Toaster };
