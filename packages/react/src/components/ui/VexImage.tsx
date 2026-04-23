"use client";

import { forwardRef } from "react";
import {
  useFrameworkComponents,
  type VexImageProps,
} from "../../hooks/useFrameworkComponents";

/**
 * Framework-aware image component.
 *
 * Renders the `Image` component from `FrameworkComponentsContext` if one is
 * configured (e.g. Next.js `NextImage`), otherwise falls back to a native
 * `<img>` tag. All props are forwarded.
 *
 * @param props - Accepts `src`, `alt`, and any standard HTML img attributes
 * @returns An image element rendered by the injected framework component or `<img>`
 *
 * @example
 * ```tsx
 * <VexImage src="/logo.png" alt="Site logo" width={120} height={40} />
 * ```
 */
export const VexImage = forwardRef<HTMLImageElement, VexImageProps>(
  function VexImage({ src, alt, ...rest }, ref) {
    const { Image } = useFrameworkComponents();
    if (Image) {
      return (
        <Image src={src} alt={alt} ref={ref} width={64} height={64} {...rest} />
      );
    }
    return (
      <img src={src} alt={alt} ref={ref} width={64} height={64} {...rest} />
    );
  },
);
