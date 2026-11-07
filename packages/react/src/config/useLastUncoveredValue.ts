"use client";

import { useRef } from "react";
import { useIsRouteCovered } from "./useIsRouteCovered";

/**
 * Returns `value`, except while a route outside the admin covers it
 * ({@link useIsRouteCovered}) — then it keeps returning the last value read
 * while the admin owned the URL.
 *
 * For URL-derived admin state. A covering route (e.g. the sign-in modal opened
 * from the admin top bar) replaces the URL, so a query-param reader on the page
 * underneath would otherwise read the modal's query: a list's filter, view and
 * search vanish and the wrong rows load behind the modal.
 *
 * @param value - The live value, e.g. a `nuqs` query-state read.
 * @returns `value` while the admin owns the URL; its last such value while covered.
 */
export function useLastUncoveredValue<T>(value: T): T {
  const isCovered = useIsRouteCovered();
  const lastUncoveredRef = useRef(value);
  if (!isCovered) lastUncoveredRef.current = value;
  return lastUncoveredRef.current;
}
