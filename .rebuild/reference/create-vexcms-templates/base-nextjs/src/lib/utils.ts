import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize a page slug for consistent lookup.
 * - Strips leading/trailing slashes
 * - Treats "/" and "/home" and "home" all as "home"
 * - "/features" becomes "features"
 */
export function normalizeSlug(slug?: string): string {
  if (!slug) return "home"
  const cleaned = slug.replace(/^\/+|\/+$/g, "")
  return cleaned === "" ? "home" : cleaned
}
