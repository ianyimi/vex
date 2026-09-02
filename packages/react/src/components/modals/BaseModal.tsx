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
  ...divProps
}: { urlParam: string } & ComponentPropsWithRef<"div">) {
  const [open, setOpen] = useQueryState(urlParam, parseAsBoolean);
  return (
    <Dialog
      {...divProps}
      open={open ?? false}
      onOpenChange={(open) => {
        if (open) {
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
