import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";

import { PLATE_52_DOCUMENT } from "../test/fixtures";
import { RichText } from "./RichText";

afterEach(cleanup);

describe("RichText — content stored under Plate 52", () => {
  it("renders every node of the 52 document with its semantic element", () => {
    const { container } = render(<RichText content={PLATE_52_DOCUMENT} />);

    expect(container.querySelector("h2")?.textContent).toBe("Upgrade heading");
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("italic");

    const items = [...container.querySelectorAll("ul li")].map((li) => li.textContent);
    expect(items).toEqual(["First bullet", "Second bullet"]);

    const link = container.querySelector("a");
    expect(link?.getAttribute("href")).toBe("https://docs.vexcms.dev");
    expect(link?.textContent).toBe("docs site");

    const image = container.querySelector("img");
    expect(image?.getAttribute("src")).toBe(
      "https://example.convex.cloud/api/storage/71ade08e-225b-46c2-bd81-dee8dc29e021",
    );
    expect(image?.getAttribute("alt")).toBe("ChatGPT Image Aug 31, 2025, 11_13_14 PM.png");
  });

  it("renders a flat (pre-53) blockquote's text inside the quote", () => {
    const { container } = render(<RichText content={PLATE_52_DOCUMENT} />);

    const quotes = container.querySelectorAll("blockquote");
    expect(quotes).toHaveLength(1);
    expect(quotes[0]?.textContent).toBe("A quoted line");
  });

  it("never nests a list or block inside a <p> (hydration-safe markup)", () => {
    const { container } = render(
      <RichText
        content={[
          ...PLATE_52_DOCUMENT,
          { type: "p", indent: 1, listStyleType: "decimal", children: [{ text: "Step one" }] },
        ]}
      />,
    );

    expect(container.querySelector("p ul, p ol, p div")).toBeNull();
    expect(container.querySelector("ol li")?.textContent).toBe("Step one");
    // The link stays inline in its paragraph rather than becoming its own block.
    expect(container.querySelector("p > a")?.textContent).toBe("docs site");
  });

  it("renders a 53 container blockquote's paragraphs inside the quote", () => {
    const { container } = render(
      <RichText
        content={[
          {
            type: "blockquote",
            children: [
              { type: "p", children: [{ text: "First quoted" }] },
              { type: "p", children: [{ text: "Second quoted" }] },
            ],
          },
        ]}
      />,
    );

    const quotes = container.querySelectorAll("blockquote");
    expect(quotes).toHaveLength(1);
    const paragraphs = [...quotes[0]!.querySelectorAll("p")].map((p) => p.textContent);
    expect(paragraphs).toEqual(["First quoted", "Second quoted"]);
  });
});
