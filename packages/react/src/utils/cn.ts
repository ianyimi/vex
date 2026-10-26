import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names with conflict resolution.
 *
 * Combines `clsx` (conditional classes) with `tailwind-merge` (deduplication
 * of conflicting Tailwind utilities). Use this wherever class names are
 * conditionally composed in component props.
 *
 * @param inputs - Class names, arrays, or conditional objects
 * @returns Merged, deduplicated class string
 *
 * @example
 * ```ts
 * cn("px-2 py-1", isActive && "bg-blue-500", className)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
