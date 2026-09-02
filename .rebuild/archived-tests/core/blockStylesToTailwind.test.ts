import { describe, it, expect } from "vitest";
import { blockStylesToTailwind } from "./blockStylesToTailwind";

describe("blockStylesToTailwind", () => {
  it("returns empty string for undefined input", () => {
    expect(blockStylesToTailwind({ blockStylesJson: undefined })).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(blockStylesToTailwind({ blockStylesJson: "" })).toBe("");
  });

  it("returns empty string for invalid JSON", () => {
    expect(blockStylesToTailwind({ blockStylesJson: "not json" })).toBe("");
  });

  it("converts base-only styles to Tailwind classes", () => {
    const json = JSON.stringify({
      base: { margin: "4", padding: "2" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("m-4 p-2");
  });

  it("converts individual margin sides", () => {
    const json = JSON.stringify({
      base: { marginTop: "2", marginBottom: "4" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("mt-2 mb-4");
  });

  it("converts individual padding sides", () => {
    const json = JSON.stringify({
      base: { paddingLeft: "3", paddingRight: "3" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("pl-3 pr-3");
  });

  it("handles DEFAULT border radius", () => {
    const json = JSON.stringify({
      base: { borderRadius: "DEFAULT" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("rounded");
  });

  it("handles named border radius", () => {
    const json = JSON.stringify({
      base: { borderRadius: "lg" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("rounded-lg");
  });

  it("handles DEFAULT border width", () => {
    const json = JSON.stringify({
      base: { borderWidth: "DEFAULT" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("border");
  });

  it("handles numbered border width", () => {
    const json = JSON.stringify({
      base: { borderWidth: "2" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("border-2");
  });

  it("handles DEFAULT box shadow", () => {
    const json = JSON.stringify({
      base: { boxShadow: "DEFAULT" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("shadow");
  });

  it("converts backgroundColor with hex to arbitrary value", () => {
    const json = JSON.stringify({
      base: { backgroundColor: "#3b82f6" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "bg-[#3b82f6]",
    );
  });

  it("converts backgroundColor with CSS variable to arbitrary value", () => {
    const json = JSON.stringify({
      base: { backgroundColor: "var(--primary)" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "bg-[var(--primary)]",
    );
  });

  it("converts text color with hex to arbitrary value", () => {
    const json = JSON.stringify({
      base: { color: "#ffffff" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "text-[#ffffff]",
    );
  });

  it("converts border color with CSS variable", () => {
    const json = JSON.stringify({
      base: { borderColor: "var(--border)" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "border-[var(--border)]",
    );
  });

  it("converts text style properties", () => {
    const json = JSON.stringify({
      base: { textAlign: "center", fontSize: "xl", fontWeight: "bold" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "text-center text-xl font-bold",
    );
  });

  it("converts line height and letter spacing", () => {
    const json = JSON.stringify({
      base: { lineHeight: "tight", letterSpacing: "wide" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "leading-tight tracking-wide",
    );
  });

  it("converts layout properties", () => {
    const json = JSON.stringify({
      base: { gap: "4", flexDirection: "column", alignItems: "center" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "gap-4 flex-col items-center",
    );
  });

  it("converts justify content", () => {
    const json = JSON.stringify({
      base: { justifyContent: "between" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "justify-between",
    );
  });

  it("converts media properties", () => {
    const json = JSON.stringify({
      base: { objectFit: "cover", aspectRatio: "video" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "object-cover aspect-video",
    );
  });

  it("converts width and maxWidth", () => {
    const json = JSON.stringify({
      base: { width: "full", maxWidth: "7xl" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "w-full max-w-7xl",
    );
  });

  it("converts opacity and display", () => {
    const json = JSON.stringify({
      base: { opacity: "50", display: "flex" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "opacity-50 flex",
    );
  });

  it("converts overflow", () => {
    const json = JSON.stringify({
      base: { overflow: "hidden" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "overflow-hidden",
    );
  });

  it("converts border style", () => {
    const json = JSON.stringify({
      base: { borderStyle: "dashed" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "border-dashed",
    );
  });

  it("adds breakpoint prefixes for non-base keys", () => {
    const json = JSON.stringify({
      base: { margin: "4" },
      sm: { margin: "6" },
      lg: { margin: "8", padding: "4" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "m-4 lg:m-8 lg:p-4 sm:m-6",
    );
  });

  it("handles only breakpoint styles with no base", () => {
    const json = JSON.stringify({
      md: { padding: "4" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("md:p-4");
  });

  it("skips empty values", () => {
    const json = JSON.stringify({
      base: { margin: "4", padding: "" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("m-4");
  });

  it("handles complex multi-breakpoint multi-property example", () => {
    const json = JSON.stringify({
      base: {
        margin: "4",
        padding: "2",
        backgroundColor: "var(--background)",
        borderRadius: "lg",
      },
      sm: { margin: "6", padding: "4" },
      md: { margin: "8" },
      lg: { margin: "12", padding: "6", maxWidth: "7xl" },
    });
    const result = blockStylesToTailwind({ blockStylesJson: json });
    expect(result).toContain("m-4");
    expect(result).toContain("p-2");
    expect(result).toContain("bg-[var(--background)]");
    expect(result).toContain("rounded-lg");
    expect(result).toContain("sm:m-6");
    expect(result).toContain("sm:p-4");
    expect(result).toContain("md:m-8");
    expect(result).toContain("lg:m-12");
    expect(result).toContain("lg:p-6");
    expect(result).toContain("lg:max-w-7xl");
  });

  it("returns empty string for empty base object", () => {
    const json = JSON.stringify({ base: {} });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("");
  });

  it("handles flexDirection row-reverse", () => {
    const json = JSON.stringify({
      base: { flexDirection: "row-reverse" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "flex-row-reverse",
    );
  });

  it("handles inline-flex display", () => {
    const json = JSON.stringify({
      base: { display: "inline-flex" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe(
      "inline-flex",
    );
  });

  it("handles flexWrap", () => {
    const json = JSON.stringify({
      base: { flexWrap: "wrap" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("flex-wrap");
  });

  it("handles object position", () => {
    const json = JSON.stringify({
      base: { objectPosition: "top" },
    });
    expect(blockStylesToTailwind({ blockStylesJson: json })).toBe("object-top");
  });
});
