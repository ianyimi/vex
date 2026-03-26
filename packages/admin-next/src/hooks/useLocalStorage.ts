"use client";

import { useState, useCallback, useEffect } from "react";

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
 * Starts with initialValue to match server render, then syncs
 * from localStorage after hydration to avoid SSR mismatch.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Sync from localStorage after hydration
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // Storage unavailable
    }
  }, [key]);

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
