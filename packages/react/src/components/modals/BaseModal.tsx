"use client";

import { ComponentPropsWithRef } from "react";
import { Dialog } from "../ui/dialog";
import { useQueryState, parseAsBoolean } from "nuqs";
import { ModalSurfaceProvider } from "../../hooks/useModalSurface";

/**
 * URL-state-driven modal wrapper.
 *
 * Opens when `?{urlParam}=true` is present in the URL and closes by setting
 * the param back to `null` via `nuqs`. Wraps the shadcn `Dialog` primitive.
 *
 * @param props - Component props.
 * @param props.urlParam - The `nuqs` URL parameter key that drives open state.
 * @param props.dismissible - Whether Escape, a backdrop click, or any
 *   `DialogClose` trigger (a Cancel button, the corner close icon) may close
 *   the dialog. Defaults to `true`. Set to `false` while an owned write is
 *   in flight — Base UI still runs its internal close handling unless the
 *   change event is canceled, so this vetoes it centrally rather than
 *   leaving every dismissal vector (Escape/backdrop/Cancel) to guard itself.
 * @param props.children - `DialogContent` and any other `Dialog` children.
 * @returns A `Dialog` whose open state is bound to the URL search parameter.
 *
 * @example
 * ```tsx
 * <Modal urlParam="createNew">
 *   <DialogContent>...</DialogContent>
 * </Modal>
 * ```
 */
export function Modal({
  urlParam,
  children,
  dismissible = true,
  ...divProps
}: { urlParam: string; dismissible?: boolean } & ComponentPropsWithRef<"div">) {
  const [open, setOpen] = useQueryState(urlParam, parseAsBoolean);
  return (
    <Dialog
      {...divProps}
      open={open ?? false}
      onOpenChange={(nextOpen, eventDetails) => {
        if (!nextOpen && !dismissible) {
          eventDetails.cancel();
          return;
        }
        if (nextOpen) {
          setOpen(true);
        } else {
          setOpen(null);
        }
      }}
    >
      <ModalSurfaceProvider>{children}</ModalSurfaceProvider>
    </Dialog>
  );
}
