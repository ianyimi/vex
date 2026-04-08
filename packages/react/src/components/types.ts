import type { ComponentHKT } from "@vexcms/core";

/**
 * HKT slots for the framework-specific `Image` and `Link` components.
 *
 * Used as a constraint when a generic needs to carry both component slots
 * but before a concrete `ReactHKT` (or other framework HKT) is available.
 *
 * @see {@link ReactHKT} in `@vexcms/react` for the concrete React implementation
 */
export interface FrameworkProps {
  Image: ComponentHKT;
  Link: ComponentHKT;
}
