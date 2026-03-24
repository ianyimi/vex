"use client";

import { useState, useCallback } from "react";

/**
 * Reads a value from localStorage synchronously.
 * Safe to call during useState initializers on the client.
 * Returns the fallback on the server or if localStorage is unavailable.
 */
export function readLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item !== null ? (JSON.parse(item) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * A hook that syncs state with localStorage.
 * Reads localStorage synchronously in the useState initializer
 * so the very first client render has the correct value.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() =>
    readLocalStorage(key, initialValue)
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue =
          typeof next === "function"
            ? (next as (prev: T) => T)(prev)
            : next;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch {
          // Storage full or unavailable
        }
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
