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
 * `props.mask` is resolved fresh (a new object) on every render by callers
 * such as `resolveFieldMask`, so this hook memoizes it by a serialized
 * value key rather than by reference: an equal-but-new mask object keeps
 * the same stable identity across renders, so the `useCallback` below (and
 * therefore the mounted Inputmask instance) is only torn down and
 * re-created when the mask's actual value changes — never on every
 * keystroke merely because the caller re-rendered.
 *
 * Passes `{ rightAlign: false, ...mask.options, autoUnmask: !mask.storeMasked }`
 * to `withMask` — `rightAlign: false` first so every numeric-family alias
 * (`numeric`/`decimal`/`integer`/`currency`/`percentage`, which all set
 * `rightAlign: true` themselves) renders left-aligned like every other
 * input instead, unless `mask.options` explicitly opts back into
 * right-alignment. `autoUnmask` makes the DOM element's own `value` (and
 * every `input`/`change` event's `target.value`) report the raw unmasked
 * string while the screen keeps showing the formatted one, unless
 * `storeMasked` is set, in which case the formatted value is both shown and
 * stored.
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

  // Keep the same `FieldMask` object reference across renders as long as
  // its serialized value is unchanged, so callers that re-resolve a fresh
  // (but equal) mask object every render don't force Inputmask to tear
  // down and re-initialize on every keystroke.
  const stableMaskRef = useRef<{ key: string | undefined; mask: FieldMask | undefined }>(
    { key: undefined, mask: undefined },
  );
  const maskKey = mask ? JSON.stringify(mask) : undefined;
  if (stableMaskRef.current.key !== maskKey) {
    stableMaskRef.current = { key: maskKey, mask };
  }
  const stableMask = stableMaskRef.current.mask;

  const maskRef = useCallback<RefCallback<HTMLInputElement>>(
    (node) => {
      teardownRef.current?.();
      teardownRef.current = undefined;
      if (!node || !stableMask) return;

      let cancelled = false;
      teardownRef.current = () => {
        cancelled = true;
      };

      import("use-mask-input").then(({ withMask }) => {
        if (cancelled) return;
        const applyMask = withMask(stableMask.mask, {
          rightAlign: false,
          ...stableMask.options,
          autoUnmask: !stableMask.storeMasked,
        });
        applyMask(node);
        teardownRef.current = () => applyMask(null);
      });
    },
    [stableMask],
  );

  return stableMask ? maskRef : undefined;
}
