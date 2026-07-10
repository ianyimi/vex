import { type VexMediaDocument } from "@vexcms/core";
import { Icon } from "../Icon";
import { type ComponentPropsWithRef } from "react";
import { cn } from "../../styles/utils";
import { VexImage } from "../ui";

/**
 * Props for the FilePreview component.
 */
export type FilePreviewProps<TDoc extends VexMediaDocument = VexMediaDocument> =
  ComponentPropsWithRef<"div"> & {
    /** The media document. */
    mediaDoc: TDoc;
    /** Fixed size in pixels. If omitted, fills container (default behavior). */
    size?: number;
    /** Border radius in pixels. Default: 3. */
    radius?: number;
    /** Loading state for media document if fetched outside of this component. */
    isPending?: boolean;
  };

/**
 * File preview component that fetches and renders media previews based on MIME type.
 *
 * Behavior by MIME type:
 * - `image/*` (except SVG): Fetches URL via `vexConvexApi.media.getUrl`, renders `<img>`.
 * - `image/svg+xml`: Shows type icon (SVG is vector, not raster).
 * - `video/*`: Shows video icon (thumbnail fetch deferred to future spec).
 * - Other: Shows generic file icon.
 *
 * Falls back to file icon on image load error (403, 5xx).
 *
 * @param props - Component props.
 */
export function FilePreview<TDoc extends VexMediaDocument = VexMediaDocument>({
  mediaDoc,
  isPending,
  size,
  radius = 3,
  className,
}: FilePreviewProps<TDoc>) {
  const isSvg = mediaDoc.mimeType === "image/svg+xml";
  const isImage = mediaDoc.mimeType.startsWith("image/") && !isSvg;
  const isVideo = mediaDoc.mimeType.startsWith("video/");
  const isAudio = mediaDoc.mimeType.startsWith("audio/");

  // Default behavior: fill container. Pass explicit size for fixed dimensions.
  const fillContainer = size === undefined;
  const wrapperStyle = fillContainer
    ? {
        borderRadius: radius,
      }
    : {
        width: size,
        height: size,
        borderRadius: radius,
      };

  const wrapperClassName = fillContainer ? "w-full h-full absolute inset-0" : "";
  function IconWrapper({ children }: ComponentPropsWithRef<"div">) {
    return (
      <div
        className={cn(`flex items-center justify-center p-2 bg-muted`, wrapperClassName, className)}
        style={wrapperStyle}
      >
        {children}
      </div>
    );
  }

  if (isPending) {
    return (
      <IconWrapper>
        <Icon
          name="Loader"
          size={fillContainer ? 24 : size * 0.3}
          className="animate-spin text-muted-foreground"
        />
      </IconWrapper>
    );
  }

  const alt = mediaDoc.alt ?? mediaDoc.filename;
  if (isImage && mediaDoc?.src) {
    return (
      <div
        className={cn("relative overflow-hidden", wrapperClassName, className)}
        style={wrapperStyle}
      >
        <VexImage
          src={mediaDoc.src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to file icon on load error
            const wrapper = e.currentTarget.parentElement;
            if (wrapper) {
              wrapper.innerHTML = `<div class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"><svg width="${mediaDoc.size * 0.3}" height="${mediaDoc.size * 0.3}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg></div>`;
            }
          }}
        />
      </div>
    );
  }

  // SVG → show type icon
  if (isSvg && mediaDoc?.src) {
    return (
      <div
        className={cn("relative overflow-hidden", wrapperClassName, className)}
        style={wrapperStyle}
      >
        <img
          src={mediaDoc.src}
          alt={alt}
          className="h-full w-full object-contain" // ← object-contain for SVGs
        />
      </div>
    );
  }

  // Video → show video icon (thumbnail fetch deferred)
  if (isVideo) {
    return (
      <IconWrapper>
        <Icon name="Video" size={fillContainer ? 32 : size} className="text-muted-foreground" />
      </IconWrapper>
    );
  }

  if (isAudio) {
    return (
      <IconWrapper>
        <Icon
          name="AudioWaveform"
          size={fillContainer ? 32 : size}
          className="text-muted-foreground"
        />
      </IconWrapper>
    );
  }

  // Fallback → generic file icon
  return (
    <IconWrapper>
      <Icon name="File" size={fillContainer ? 32 : size} className="text-muted-foreground" />
    </IconWrapper>
  );
}
