import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RenderBlocks, type BlockComponentProps } from "./RenderBlocks";

type HeroTestBlock = { id: string; blockType: "hero"; heading: string };
type CtaTestBlock = { id: string; blockType: "cta"; label: string };
type TestBlock = HeroTestBlock | CtaTestBlock;

function Hero({ block }: BlockComponentProps<HeroTestBlock>) {
  return <h2>{block.heading}</h2>;
}

function Cta({ block }: BlockComponentProps<CtaTestBlock>) {
  return <button type="button">{block.label}</button>;
}

function Unknown({ block }: BlockComponentProps<TestBlock>) {
  return <p>unknown: {block.blockType}</p>;
}

const blocks: TestBlock[] = [
  { id: "b1", blockType: "hero", heading: "First" },
  { id: "b2", blockType: "cta", label: "Click" },
  { id: "b3", blockType: "hero", heading: "Second" },
];

describe("RenderBlocks", () => {
  it("renders every block through its own component, in document order", () => {
    const { container } = render(
      <RenderBlocks blocks={blocks} components={{ hero: Hero, cta: Cta }} />,
    );
    const rendered = Array.from(container.children).map((el) => el.textContent);
    expect(rendered).toEqual(["First", "Click", "Second"]);
    expect(container.querySelectorAll("h2")).toHaveLength(2);
    expect(container.querySelectorAll("button")).toHaveLength(1);
  });

  it("renders nothing for undefined, null, and empty arrays", () => {
    for (const value of [undefined, null, [] as TestBlock[]]) {
      const { container } = render(
        <RenderBlocks blocks={value} components={{ hero: Hero }} />,
      );
      expect(container.innerHTML).toBe("");
    }
  });

  it("skips blocks with no registered component when there is no fallback", () => {
    const { container } = render(
      <RenderBlocks blocks={blocks} components={{ hero: Hero }} />,
    );
    const rendered = Array.from(container.children).map((el) => el.textContent);
    expect(rendered).toEqual(["First", "Second"]);
  });

  it("routes unregistered block types to the fallback", () => {
    const { container } = render(
      <RenderBlocks blocks={blocks} components={{ hero: Hero }} fallback={Unknown} />,
    );
    const rendered = Array.from(container.children).map((el) => el.textContent);
    expect(rendered).toEqual(["First", "unknown: cta", "Second"]);
  });
});
