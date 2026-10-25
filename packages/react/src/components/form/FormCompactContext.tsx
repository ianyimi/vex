"use client";

import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/**
 * The form-column width (px) below which item actions move from inline icons
 * into a ⋯ menu — the same 32rem as the `@lg/form` container queries the rest
 * of the form layout uses.
 */
export const FORM_COMPACT_WIDTH_PX = 512;

/** Whether the nearest measured form column is compact — see {@link useCompactForm}. */
export const FormCompactContext = createContext(false);

/**
 * Whether the enclosing form column is narrower than
 * {@link FORM_COMPACT_WIDTH_PX}. Measured, not a CSS container query: it
 * decides which actions render inline and which go into a dropdown, and
 * dropdown content renders in a portal, outside any container query's reach.
 * An unmeasured column (width 0: not laid out yet, or no layout engine) is
 * not compact.
 *
 * @returns `true` while the nearest measured form column is compact.
 */
export function useCompactForm(): boolean {
  return useContext(FormCompactContext);
}

/**
 * Tracks whether `ref`'s element is narrower than `thresholdPx` (default
 * {@link FORM_COMPACT_WIDTH_PX}), via a `ResizeObserver`.
 *
 * @param ref - The element to measure.
 * @param thresholdPx - Width below which the element counts as compact.
 * @returns `true` while the element is laid out and narrower than the threshold.
 */
export function useMeasuredCompact(
  ref: RefObject<HTMLElement | null>,
  thresholdPx: number = FORM_COMPACT_WIDTH_PX,
): boolean {
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () =>
      setCompact(element.clientWidth > 0 && element.clientWidth < thresholdPx);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, thresholdPx]);
  return compact;
}

/**
 * Measures its own full-width wrapper and provides {@link useCompactForm} to
 * everything inside — the edit view wraps its form column in this, which
 * overrides `AppForm`'s own measurement (the nearest provider wins).
 *
 * @param props.children - The form content to measure and provide for.
 * @returns The measured wrapper.
 */
export function FormCompactProvider(props: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const compact = useMeasuredCompact(ref);
  return (
    <FormCompactContext.Provider value={compact}>
      <div ref={ref}>{props.children}</div>
    </FormCompactContext.Provider>
  );
}
