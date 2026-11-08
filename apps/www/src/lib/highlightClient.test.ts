import { highlightCode } from "./highlight";
import { highlightCodeInBrowser } from "./highlightClient";

describe("highlightCodeInBrowser", () => {
  // The browser path runs when live content misses the server-built highlight
  // map (live preview, or an ISR page whose document changed since render). A
  // divergence there ships Tokyo Night's raw comment colour, which fails
  // WCAG AA contrast on `--color-code-bg`.
  it("matches the server highlighter, including the comment colour replacement", async () => {
    const props = {
      code: "// gate it however you like\nexport const answer = 42\n",
      language: "ts" as const,
    };

    const browser = await highlightCodeInBrowser(props);

    expect(browser).toBe(await highlightCode(props));
    expect(browser.toLowerCase()).toContain("#747a97");
    expect(browser.toLowerCase()).not.toContain("#51597d");
  });
});
