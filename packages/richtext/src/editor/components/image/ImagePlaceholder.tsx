"use client";

const pulseKeyframes = `
@keyframes vex-img-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
`;

/**
 * Loading placeholder shown in the editor while an image is being uploaded.
 */
export function ImagePlaceholder() {
  return (
    <div
      contentEditable={false}
      style={{
        background: "var(--muted)",
        borderRadius: "var(--radius)",
        padding: 24,
        margin: "8px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "var(--muted-foreground)",
        fontSize: 13,
        animation: "vex-img-pulse 1.5s ease-in-out infinite",
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: pulseKeyframes }} />
      Uploading image…
    </div>
  );
}
