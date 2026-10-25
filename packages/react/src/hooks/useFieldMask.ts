"use client";

import { useCallback, useRef } from "react";
import type { RefCallback } from "react";
import type { FieldMask } from "@vexcms/core";

/**
 * Attaches `use-mask-input` to a text input only when a mask resolved,
 * lazy-loading the library (`import("use-mask-input")`, ~29 KB gz) the first
 * time a masked input actually mounts — an unmasked form never pays for it.
 * The import runs inside the returned ref callback, which only ever fires in
 * the browser, so this is inherently SSR-safe with no environment check.
 *
 * Passes `{ ...mask.options, autoUnmask: !mask.storeMasked }` to
 * `withMask` — `autoUnmask` makes the DOM element's own `value` (and every
 * `input`/`change` event's `target.value`) report the raw unmasked string
 * while the screen keeps showing the formatted one, unless `storeMasked` is
 * set, in which case the formatted value is both shown and stored.
 *
 * @param props - Input props.
 * @param props.mask - The field's resolved mask, or `undefined` for no mask.
 * @returns A ref callback to attach to the `<input>` element, or `undefined`
 *   when `mask` is `undefined` — pass straight through to the `ref` prop.
 */
export function useFieldMask(props: {
  mask: FieldMask | undefined;
}): RefCallback<HTMLInputElement> | undefined {
  const { mask } = props;
  const teardownRef = useRef<(() => void) | undefined>(undefined);

  const maskRef = useCallback<RefCallback<HTMLInputElement>>(
    (node) => {
      teardownRef.current?.();
      teardownRef.current = undefined;
      if (!node || !mask) return;

      let cancelled = false;
      teardownRef.current = () => {
        cancelled = true;
      };

      import("use-mask-input").then(({ withMask }) => {
        if (cancelled) return;
        const applyMask = withMask(mask.mask, {
          ...mask.options,
          autoUnmask: !mask.storeMasked,
        });
        applyMask(node);
        teardownRef.current = () => applyMask(null);
      });
    },
    [mask],
  );

  return mask ? maskRef : undefined;
}
